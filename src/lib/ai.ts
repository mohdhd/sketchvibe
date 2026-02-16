import { getProvider, getProviderForModel, type Provider, type ProviderModel } from './providers';
import type { Attachment } from './db';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: Attachment[];
}

export interface StreamCallbacks {
    onChunk: (text: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: Error) => void;
}

/** Resolve a composite model ID (e.g. "gpt-5.2:high") into base model + optional thinking level */
function resolveModelId(modelId: string): { baseModel: string; thinkingLevel?: string; modelDef?: ProviderModel } {
    // Find the model definition to check for thinkingLevel
    const provider = getProviderForModel(modelId);
    const modelDef = provider?.models.find((m) => m.id === modelId);
    if (modelDef?.thinkingLevel) {
        // Strip the ":level" suffix to get the actual API model name
        const baseModel = modelId.split(':')[0];
        return { baseModel, thinkingLevel: modelDef.thinkingLevel, modelDef };
    }
    return { baseModel: modelId, modelDef: modelDef || undefined };
}

// ─── Helpers ───

/** Extract raw base64 data from a data URL */
function dataUrlToBase64(dataUrl: string): string {
    return dataUrl.split(',')[1] || '';
}

/** Build OpenAI/Grok-compatible content array for a message with attachments */
function buildOpenAIContent(msg: ChatMessage): string | Array<Record<string, unknown>> {
    if (!msg.attachments?.length) return msg.content;

    const parts: Array<Record<string, unknown>> = [];

    // Text files: prepend their content
    const textAttachments = msg.attachments.filter((a) => a.type === 'file');
    let textContent = msg.content;
    for (const att of textAttachments) {
        const decoded = atob(dataUrlToBase64(att.dataUrl));
        textContent = `[File: ${att.name}]\n${decoded}\n\n${textContent}`;
    }

    parts.push({ type: 'text', text: textContent });

    // Images
    for (const att of msg.attachments.filter((a) => a.type === 'image')) {
        parts.push({
            type: 'image_url',
            image_url: { url: att.dataUrl },
        });
    }

    return parts;
}

/** Build Anthropic content array for a message with attachments */
function buildAnthropicContent(msg: ChatMessage): string | Array<Record<string, unknown>> {
    if (!msg.attachments?.length) return msg.content;

    const parts: Array<Record<string, unknown>> = [];

    // Images first (Anthropic convention)
    for (const att of msg.attachments.filter((a) => a.type === 'image')) {
        parts.push({
            type: 'image',
            source: {
                type: 'base64',
                media_type: att.mimeType,
                data: dataUrlToBase64(att.dataUrl),
            },
        });
    }

    // Text files: prepend their content
    const textAttachments = msg.attachments.filter((a) => a.type === 'file');
    let textContent = msg.content;
    for (const att of textAttachments) {
        const decoded = atob(dataUrlToBase64(att.dataUrl));
        textContent = `[File: ${att.name}]\n${decoded}\n\n${textContent}`;
    }

    parts.push({ type: 'text', text: textContent });

    return parts;
}

/** Build Gemini parts array for a message with attachments */
function buildGeminiParts(msg: ChatMessage): Array<Record<string, unknown>> {
    const parts: Array<Record<string, unknown>> = [];

    // Text files: prepend their content
    const textAttachments = msg.attachments?.filter((a) => a.type === 'file') || [];
    let textContent = msg.content;
    for (const att of textAttachments) {
        const decoded = atob(dataUrlToBase64(att.dataUrl));
        textContent = `[File: ${att.name}]\n${decoded}\n\n${textContent}`;
    }

    parts.push({ text: textContent });

    // Images
    for (const att of (msg.attachments || []).filter((a) => a.type === 'image')) {
        parts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: dataUrlToBase64(att.dataUrl),
            },
        });
    }

    return parts;
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
    const { baseModel, thinkingLevel, modelDef } = resolveModelId(model);

    const formattedMessages = messages.map((m) => ({
        role: m.role,
        content: buildOpenAIContent(m),
    }));

    const body: Record<string, unknown> = { model: baseModel, messages: formattedMessages, stream: true };
    if (thinkingLevel) {
        body.reasoning_effort = thinkingLevel;
    }
    if (modelDef?.maxOutputTokens) {
        body.max_completion_tokens = modelDef.maxOutputTokens;
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

    const { modelDef } = resolveModelId(model);
    const maxTokens = modelDef?.maxOutputTokens || 8192;

    const formattedMessages = nonSystemMsgs.map((m) => ({
        role: m.role,
        content: buildAnthropicContent(m),
    }));

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
            max_tokens: maxTokens,
            system: systemMsg?.content || '',
            messages: formattedMessages,
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
        parts: buildGeminiParts(m),
    }));

    const { modelDef } = resolveModelId(model);
    const maxOutputTokens = modelDef?.maxOutputTokens || 8192;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction
                ? { parts: [{ text: systemInstruction.content }] }
                : undefined,
            generationConfig: { maxOutputTokens },
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
