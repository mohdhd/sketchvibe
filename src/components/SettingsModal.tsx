import { useState } from 'react';
import { X, Eye, EyeOff, Key, Volume2, Globe, Database, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
    providers, getApiKey, setApiKey, getProvider,
    getSTTProvider, setSTTProvider, getTTSProvider, setTTSProvider,
    getVoiceApiKey, setVoiceApiKey, getTavilyApiKey, setTavilyApiKey,
    getWebSearchEnabled, setWebSearchEnabled,
    type STTProvider, type TTSProvider,
} from '../lib/providers';
import { exportAllData, importAllData, clearAllData } from '../lib/exportImport';

type Tab = 'providers' | 'voice' | 'search' | 'data';

export default function SettingsModal() {
    const { setActiveModal, setActiveProviderAndModel, activeProviderId, activeModelId } = useApp();
    const [activeTab, setActiveTab] = useState<Tab>('providers');

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'providers', label: 'Providers', icon: <Key size={14} /> },
        { id: 'voice', label: 'Voice', icon: <Volume2 size={14} /> },
        { id: 'search', label: 'Search', icon: <Globe size={14} /> },
        { id: 'data', label: 'Data', icon: <Database size={14} /> },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setActiveModal(null)} />
            <div className="relative w-full max-w-lg max-h-[85vh] glass rounded-xl flex flex-col animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-text-primary">Settings</h2>
                    <button
                        onClick={() => setActiveModal(null)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-5 gap-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-accent text-accent'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {activeTab === 'providers' && (
                        <ProvidersTab
                            activeProviderId={activeProviderId}
                            activeModelId={activeModelId}
                            onProviderChange={setActiveProviderAndModel}
                        />
                    )}
                    {activeTab === 'voice' && <VoiceTab />}
                    {activeTab === 'search' && <SearchTab />}
                    {activeTab === 'data' && <DataTab onClose={() => setActiveModal(null)} />}
                </div>
            </div>
        </div>
    );
}

// ─── Providers Tab ───

function ProvidersTab({
    activeProviderId,
    activeModelId,
    onProviderChange,
}: {
    activeProviderId: string;
    activeModelId: string;
    onProviderChange: (providerId: string, modelId: string) => void;
}) {
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
    const [keys, setKeys] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        for (const p of providers) {
            initial[p.id] = getApiKey(p.id);
        }
        return initial;
    });

    const toggleVisibility = (id: string) => {
        setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleKeyChange = (providerId: string, value: string) => {
        setKeys((prev) => ({ ...prev, [providerId]: value }));
        setApiKey(providerId, value);
    };

    return (
        <div className="space-y-5">
            {/* Active provider/model */}
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Active Provider</label>
                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={activeProviderId}
                        onChange={(e) => {
                            const p = getProvider(e.target.value);
                            onProviderChange(e.target.value, p?.models[0]?.id || '');
                        }}
                        className="px-3 py-2 text-sm bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                    >
                        {providers.map((p) => (
                            <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                        ))}
                    </select>
                    <select
                        value={activeModelId}
                        onChange={(e) => onProviderChange(activeProviderId, e.target.value)}
                        className="px-3 py-2 text-sm bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                    >
                        {getProvider(activeProviderId)?.models.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* API Keys */}
            {providers.map((provider) => (
                <div key={provider.id}>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        {provider.icon} {provider.name} API Key
                    </label>
                    <div className="relative">
                        <input
                            type={visibleKeys[provider.id] ? 'text' : 'password'}
                            value={keys[provider.id] || ''}
                            onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                            placeholder={`${provider.keyPrefix}...`}
                            autoComplete="new-password"
                            data-1p-ignore
                            data-lpignore="true"
                            className="w-full px-3 py-2 pr-10 text-sm bg-bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent font-mono"
                        />
                        <button
                            onClick={() => toggleVisibility(provider.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary"
                        >
                            {visibleKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Voice Tab ───

function VoiceTab() {
    const [sttProvider, setSttState] = useState<STTProvider>(getSTTProvider());
    const [ttsProvider, setTtsState] = useState<TTSProvider>(getTTSProvider());
    const [elevenLabsKey, setElevenLabsKey] = useState(() => getVoiceApiKey('stt', 'elevenlabs'));
    const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);

    const handleElevenLabsKeyChange = (value: string) => {
        setElevenLabsKey(value);
        setVoiceApiKey('stt', 'elevenlabs', value);
        setVoiceApiKey('tts', 'elevenlabs', value);
    };

    return (
        <div className="space-y-5">
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Speech-to-Text Provider</label>
                <select
                    value={sttProvider}
                    onChange={(e) => {
                        const val = e.target.value as STTProvider;
                        setSttState(val);
                        setSTTProvider(val);
                    }}
                    className="w-full px-3 py-2 text-sm bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                >
                    <option value="whisper">OpenAI Whisper</option>
                    <option value="elevenlabs-scribe">ElevenLabs Scribe</option>
                </select>
                <p className="text-[11px] text-text-tertiary mt-1">
                    {sttProvider === 'whisper' ? 'Uses your OpenAI API key' : 'Requires ElevenLabs API key below'}
                </p>
            </div>

            <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Text-to-Speech Provider</label>
                <select
                    value={ttsProvider}
                    onChange={(e) => {
                        const val = e.target.value as TTSProvider;
                        setTtsState(val);
                        setTTSProvider(val);
                    }}
                    className="w-full px-3 py-2 text-sm bg-bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                >
                    <option value="openai-tts">OpenAI TTS</option>
                    <option value="elevenlabs-tts">ElevenLabs TTS</option>
                </select>
                <p className="text-[11px] text-text-tertiary mt-1">
                    {ttsProvider === 'openai-tts' ? 'Uses your OpenAI API key' : 'Requires ElevenLabs API key below'}
                </p>
            </div>

            {/* ElevenLabs API key */}
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">ElevenLabs API Key</label>
                <div className="relative">
                    <input
                        type={showElevenLabsKey ? 'text' : 'password'}
                        value={elevenLabsKey}
                        onChange={(e) => handleElevenLabsKeyChange(e.target.value)}
                        placeholder="xi-..."
                        autoComplete="new-password"
                        data-1p-ignore
                        data-lpignore="true"
                        className="w-full px-3 py-2 pr-10 text-sm bg-bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent font-mono"
                    />
                    <button
                        onClick={() => setShowElevenLabsKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary"
                    >
                        {showElevenLabsKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Search Tab ───

function SearchTab() {
    const [enabled, setEnabledState] = useState(getWebSearchEnabled());
    const [key, setKeyState] = useState(getTavilyApiKey());
    const [showKey, setShowKey] = useState(false);

    return (
        <div className="space-y-5">
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Tavily API Key</label>
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={key}
                        onChange={(e) => {
                            setKeyState(e.target.value);
                            setTavilyApiKey(e.target.value);
                        }}
                        placeholder="tvly-..."
                        autoComplete="new-password"
                        data-1p-ignore
                        data-lpignore="true"
                        className="w-full px-3 py-2 pr-10 text-sm bg-bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent font-mono"
                    />
                    <button
                        onClick={() => setShowKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary"
                    >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
                <p className="text-[11px] text-text-tertiary mt-1">Get a key at tavily.com</p>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-text-primary">Enable Web Search</p>
                    <p className="text-[11px] text-text-tertiary">Available globally when toggled on</p>
                </div>
                <button
                    onClick={() => {
                        const newVal = !enabled;
                        setEnabledState(newVal);
                        setWebSearchEnabled(newVal);
                    }}
                    className={`w-10 h-6 rounded-full transition-colors relative ${enabled ? 'bg-accent' : 'bg-bg-elevated'
                        }`}
                >
                    <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-5' : 'left-1'
                            }`}
                    />
                </button>
            </div>
        </div>
    );
}

// ─── Data Tab ───

function DataTab({ onClose }: { onClose: () => void }) {
    const [importing, setImporting] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [importResult, setImportResult] = useState<string | null>(null);

    const handleExport = async () => {
        await exportAllData();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const result = await importAllData(file);
            setImportResult(`Imported ${result.imported} conversations (${result.skipped} skipped)`);
        } catch (err) {
            setImportResult(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setImporting(false);
        }
    };

    const handleClear = async () => {
        if (!clearing) {
            setClearing(true);
            return;
        }
        await clearAllData();
        setClearing(false);
        onClose();
        window.location.reload();
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium text-text-primary mb-1">Export Data</h3>
                <p className="text-[11px] text-text-tertiary mb-2">Download all conversations and canvases as JSON</p>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                >
                    Export All Data
                </button>
            </div>

            <hr className="border-border" />

            <div>
                <h3 className="text-sm font-medium text-text-primary mb-1">Import Data</h3>
                <p className="text-[11px] text-text-tertiary mb-2">Import from a SketchVibe export file</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-bg-surface border border-border text-text-primary rounded-lg hover:bg-bg-surface-hover transition-colors cursor-pointer">
                    {importing ? <Loader2 size={14} className="animate-spin" /> : null}
                    {importing ? 'Importing…' : 'Choose File'}
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                {importResult && (
                    <p className="text-xs text-text-secondary mt-2">{importResult}</p>
                )}
            </div>

            <hr className="border-border" />

            <div>
                <h3 className="text-sm font-medium text-error mb-1">Clear All Data</h3>
                <p className="text-[11px] text-text-tertiary mb-2">Permanently delete all conversations and canvases</p>
                <button
                    onClick={handleClear}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${clearing
                        ? 'bg-error text-white hover:bg-error/80'
                        : 'bg-error-muted text-error hover:bg-error/20'
                        }`}
                >
                    {clearing ? 'Click again to confirm' : 'Clear All Data'}
                </button>
            </div>
        </div>
    );
}
