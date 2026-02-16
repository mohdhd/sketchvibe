import { getProvider, getProviderForModel, type Provider } from './providers';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface StreamCallbacks {
    onChunk: (text: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: Error) => void;
}

/** Resolve a composite model ID (e.g. "gpt-5.2:high") into base model + optional thinking level */
function resolveModelId(modelId: string): { baseModel: string; thinkingLevel?: string } {
    // Find the model definition to check for thinkingLevel
    const provider = getProviderForModel(modelId);
    const modelDef = provider?.models.find((m) => m.id === modelId);
    if (modelDef?.thinkingLevel) {
        // Strip the ":level" suffix to get the actual API model name
        const baseModel = modelId.split(':')[0];
        return { baseModel, thinkingLevel: modelDef.thinkingLevel };
    }
    return { baseModel: modelId };
}

// ─── Main Entry ───

export async function streamChat(
    messages: ChatMessage[],
    providerId: string,
    modelId: string,
    apiKey: string,
    systemPrompt: string,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
): Promise<void> {
    const provider = getProvider(providerId);
    if (!provider) {
        callbacks.onError(new Error(`Unknown provider: ${providerId}`));
        return;
    }

    const allMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages,
    ];

    try {
        switch (providerId) {
            case 'openai':
            case 'grok':
                await streamOpenAICompatible(provider, modelId, apiKey, allMessages, callbacks, signal);
                break;
            case 'anthropic':
                await streamAnthropic(provider, modelId, apiKey, allMessages, callbacks, signal);
                break;
            case 'gemini':
                await streamGemini(modelId, apiKey, allMessages, callbacks, signal);
                break;
            default:
                callbacks.onError(new Error(`Unsupported provider: ${providerId}`));
        }
    } catch (err) {
        if (signal?.aborted) return;
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
}

// ─── OpenAI / Grok (compatible) ───

async function streamOpenAICompatible(
    provider: Provider,
    model: string,
    apiKey: string,
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
) {
    const { baseModel, thinkingLevel } = resolveModelId(model);

    const body: Record<string, unknown> = { model: baseModel, messages, stream: true };
    if (thinkingLevel) {
        body.reasoning_effort = thinkingLevel;
    }

    const resp = await fetch(provider.endpointUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal,
    });

    if (!resp.ok) {
        const errorText = await resp.text().catch(() => resp.statusText);
        throw new Error(`${provider.name} error (${resp.status}): ${errorText}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                    fullText += content;
                    callbacks.onChunk(fullText);
                }
            } catch {
                // skip malformed JSON
            }
        }
    }

    callbacks.onDone(fullText);
}

// ─── Anthropic ───

async function streamAnthropic(
    provider: Provider,
    model: string,
    apiKey: string,
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
) {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

    const resp = await fetch(provider.endpointUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model,
            max_tokens: 8192,
            system: systemMsg?.content || '',
            messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
            stream: true,
        }),
        signal,
    });

    if (!resp.ok) {
        const errorText = await resp.text().catch(() => resp.statusText);
        throw new Error(`Anthropic error (${resp.status}): ${errorText}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);

            try {
                const json = JSON.parse(data);
                if (json.type === 'content_block_delta' && json.delta?.text) {
                    fullText += json.delta.text;
                    callbacks.onChunk(fullText);
                }
            } catch {
                // skip
            }
        }
    }

    callbacks.onDone(fullText);
}

// ─── Gemini ───

async function streamGemini(
    model: string,
    apiKey: string,
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal
) {
    const systemInstruction = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents = chatMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction
                ? { parts: [{ text: systemInstruction.content }] }
                : undefined,
            generationConfig: { maxOutputTokens: 8192 },
        }),
        signal,
    });

    if (!resp.ok) {
        const errorText = await resp.text().catch(() => resp.statusText);
        throw new Error(`Gemini error (${resp.status}): ${errorText}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);

            try {
                const json = JSON.parse(data);
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    fullText += text;
                    callbacks.onChunk(fullText);
                }
            } catch {
                // skip
            }
        }
    }

    callbacks.onDone(fullText);
}
