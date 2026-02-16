export interface ProviderModel {
    id: string;
    name: string;
    contextWindow: number;
    /** OpenAI reasoning effort level — only for GPT-5.2 thinking variants */
    thinkingLevel?: 'low' | 'medium' | 'high' | 'xhigh';
}

export interface Provider {
    id: string;
    name: string;
    icon: string;
    models: ProviderModel[];
    endpointUrl: string;
    keyPrefix: string;
}

export const providers: Provider[] = [
    {
        id: 'openai',
        name: 'OpenAI',
        icon: '🟢',
        endpointUrl: 'https://api.openai.com/v1/chat/completions',
        keyPrefix: 'sk-',
        models: [
            { id: 'gpt-5.2:low', name: 'GPT-5.2 (Low)', contextWindow: 128000, thinkingLevel: 'low' },
            { id: 'gpt-5.2:medium', name: 'GPT-5.2 (Medium)', contextWindow: 128000, thinkingLevel: 'medium' },
            { id: 'gpt-5.2:high', name: 'GPT-5.2 (High)', contextWindow: 128000, thinkingLevel: 'high' },
            { id: 'gpt-5.2:xhigh', name: 'GPT-5.2 (xHigh)', contextWindow: 128000, thinkingLevel: 'xhigh' },
            { id: 'gpt-5.2-mini', name: 'GPT-5.2 Mini', contextWindow: 128000 },
        ],
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        icon: '🟠',
        endpointUrl: 'https://api.anthropic.com/v1/messages',
        keyPrefix: 'sk-ant-',
        models: [
            { id: 'claude-opus-4-6', name: 'Claude 4.6 Opus', contextWindow: 1000000 },
            { id: 'claude-sonnet-4-5-20250929', name: 'Claude 4.5 Sonnet', contextWindow: 200000 },
            { id: 'claude-haiku-4-5-20251001', name: 'Claude 4.5 Haiku', contextWindow: 200000 },
        ],
    },
    {
        id: 'gemini',
        name: 'Google Gemini',
        icon: '🔵',
        endpointUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        keyPrefix: 'AI',
        models: [
            { id: 'gemini-3-flash', name: 'Gemini 3 Flash', contextWindow: 1000000 },
            { id: 'gemini-3-pro', name: 'Gemini 3 Pro', contextWindow: 2000000 },
        ],
    },
    {
        id: 'grok',
        name: 'xAI Grok',
        icon: '⚡',
        endpointUrl: 'https://api.x.ai/v1/chat/completions',
        keyPrefix: 'xai-',
        models: [
            { id: 'grok-4.1-fast', name: 'Grok 4.1 Fast (Reasoning)', contextWindow: 2000000 },
            { id: 'grok-4.1-fast-no-reasoning', name: 'Grok 4.1 Fast (No Reasoning)', contextWindow: 2000000 },
        ],
    },
];

const KEYS_PREFIX = 'sketchvibe_key_';
const ACTIVE_PROVIDER_KEY = 'sketchvibe_active_provider';
const ACTIVE_MODEL_KEY = 'sketchvibe_active_model';

export function getApiKey(providerId: string): string {
    return localStorage.getItem(`${KEYS_PREFIX}${providerId}`) || '';
}

export function setApiKey(providerId: string, key: string) {
    if (key) {
        localStorage.setItem(`${KEYS_PREFIX}${providerId}`, key);
    } else {
        localStorage.removeItem(`${KEYS_PREFIX}${providerId}`);
    }
}

export function getActiveProvider(): string {
    return localStorage.getItem(ACTIVE_PROVIDER_KEY) || 'openai';
}

export function setActiveProvider(providerId: string) {
    localStorage.setItem(ACTIVE_PROVIDER_KEY, providerId);
}

export function getActiveModel(): string {
    return localStorage.getItem(ACTIVE_MODEL_KEY) || 'gpt-5.2:low';
}

export function setActiveModel(modelId: string) {
    localStorage.setItem(ACTIVE_MODEL_KEY, modelId);
}

export function getProvider(id: string): Provider | undefined {
    return providers.find((p) => p.id === id);
}

export function getProviderForModel(modelId: string): Provider | undefined {
    return providers.find((p) => p.models.some((m) => m.id === modelId));
}

// ─── Voice Provider Settings ───

const STT_PROVIDER_KEY = 'sketchvibe_stt_provider';
const TTS_PROVIDER_KEY = 'sketchvibe_tts_provider';
const STT_KEY_PREFIX = 'sketchvibe_stt_key_';
const TTS_KEY_PREFIX = 'sketchvibe_tts_key_';

export type STTProvider = 'whisper' | 'elevenlabs-scribe';
export type TTSProvider = 'openai-tts' | 'elevenlabs-tts';

export function getSTTProvider(): STTProvider {
    return (localStorage.getItem(STT_PROVIDER_KEY) as STTProvider) || 'whisper';
}

export function setSTTProvider(provider: STTProvider) {
    localStorage.setItem(STT_PROVIDER_KEY, provider);
}

export function getTTSProvider(): TTSProvider {
    return (localStorage.getItem(TTS_PROVIDER_KEY) as TTSProvider) || 'openai-tts';
}

export function setTTSProvider(provider: TTSProvider) {
    localStorage.setItem(TTS_PROVIDER_KEY, provider);
}

export function getVoiceApiKey(type: 'stt' | 'tts', provider: string): string {
    const prefix = type === 'stt' ? STT_KEY_PREFIX : TTS_KEY_PREFIX;
    return localStorage.getItem(`${prefix}${provider}`) || '';
}

export function setVoiceApiKey(type: 'stt' | 'tts', provider: string, key: string) {
    const prefix = type === 'stt' ? STT_KEY_PREFIX : TTS_KEY_PREFIX;
    if (key) {
        localStorage.setItem(`${prefix}${provider}`, key);
    } else {
        localStorage.removeItem(`${prefix}${provider}`);
    }
}

// ─── Tavily ───

const TAVILY_KEY = 'sketchvibe_tavily_key';
const WEB_SEARCH_ENABLED = 'sketchvibe_web_search_enabled';

export function getTavilyApiKey(): string {
    return localStorage.getItem(TAVILY_KEY) || '';
}

export function setTavilyApiKey(key: string) {
    if (key) localStorage.setItem(TAVILY_KEY, key);
    else localStorage.removeItem(TAVILY_KEY);
}

export function getWebSearchEnabled(): boolean {
    return localStorage.getItem(WEB_SEARCH_ENABLED) === 'true';
}

export function setWebSearchEnabled(enabled: boolean) {
    localStorage.setItem(WEB_SEARCH_ENABLED, String(enabled));
}
