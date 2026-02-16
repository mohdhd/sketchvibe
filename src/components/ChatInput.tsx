import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Globe, Mic, LayoutGrid, Paperclip, X, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getApiKey, getTavilyApiKey, getProvider, getSTTProvider, getVoiceApiKey } from '../lib/providers';
import type { Attachment } from '../lib/db';
import VoiceModePanel from './VoiceModePanel';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = 'image/*,.pdf,.txt,.md,.csv,.json,.xml,.py,.js,.ts,.tsx,.jsx,.html,.css,.yaml,.yml,.toml,.sh,.sql,.rb,.go,.rs,.java,.kt,.swift,.c,.cpp,.h';

interface ChatInputProps {
    onSend: (text: string, webSearch: boolean, visualMode: boolean, attachments: Attachment[]) => void;
    onStop: () => void;
    isStreaming: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
    const { activeProviderId, activeModelId, setActiveModal } = useApp();
    const [text, setText] = useState('');
    const [webSearch, setWebSearch] = useState(false);
    const [visualMode, setVisualMode] = useState(true);
    const [voiceMode, setVoiceMode] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apiKey = getApiKey(activeProviderId);
    const tavilyKey = getTavilyApiKey();
    const provider = getProvider(activeProviderId);
    const model = provider?.models.find((m) => m.id === activeModelId);

    // Check if voice is available
    const sttProvider = getSTTProvider();
    const voiceApiKey = sttProvider === 'whisper'
        ? getApiKey('openai')
        : getVoiceApiKey('stt', 'elevenlabs');
    const hasVoice = !!voiceApiKey;

    const autoResize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }, []);

    useEffect(() => {
        autoResize();
    }, [text, autoResize]);

    const handleSend = () => {
        const trimmed = text.trim();
        if ((!trimmed && attachments.length === 0) || isStreaming) return;
        onSend(trimmed || (attachments.length > 0 ? 'Describe the attached file(s).' : ''), webSearch, visualMode, attachments);
        setText('');
        setAttachments([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleVoiceResult = (transcript: string) => {
        if (transcript.trim()) {
            onSend(transcript.trim(), webSearch, visualMode, attachments);
            setAttachments([]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file) => {
            if (file.size > MAX_FILE_SIZE) {
                alert(`File "${file.name}" exceeds 10MB limit.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                const isImage = file.type.startsWith('image/');
                setAttachments((prev) => [
                    ...prev,
                    {
                        type: isImage ? 'image' : 'file',
                        name: file.name,
                        mimeType: file.type || 'application/octet-stream',
                        dataUrl,
                    },
                ]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input so the same file can be re-selected
        e.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="border-t border-border bg-bg-primary px-3 pb-3 pt-2 md:px-4 md:pb-4">
            <div className="max-w-3xl mx-auto">
                {voiceMode ? (
                    <VoiceModePanel
                        onResult={handleVoiceResult}
                        onExit={() => setVoiceMode(false)}
                    />
                ) : (
                    <div className="relative flex flex-col bg-bg-surface border border-border rounded-xl focus-within:border-accent/50 transition-colors">
                        {/* Attachment preview strip */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 px-3 pt-3">
                                {attachments.map((att, i) => (
                                    <div key={i} className="attachment-preview">
                                        {att.type === 'image' ? (
                                            <img src={att.dataUrl} alt={att.name} className="attachment-thumb" />
                                        ) : (
                                            <div className="attachment-file-icon">
                                                <FileText size={16} />
                                            </div>
                                        )}
                                        <span className="attachment-name">{att.name}</span>
                                        <button
                                            onClick={() => removeAttachment(i)}
                                            className="attachment-remove"
                                            title="Remove"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={apiKey ? 'Type a message…' : 'Set your API key in Settings first…'}
                            rows={1}
                            disabled={!apiKey}
                            className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ maxHeight: '200px' }}
                        />

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_TYPES}
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Bottom bar */}
                        <div className="flex items-center justify-between px-3 pb-2 pt-1">
                            <div className="flex items-center gap-1.5">
                                {/* Provider chip */}
                                <button
                                    onClick={() => setActiveModal('settings')}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover transition-colors"
                                    title="Change model"
                                >
                                    <span>{provider?.icon}</span>
                                    <span className="hidden sm:inline">{model?.name || activeModelId}</span>
                                </button>

                                {/* Attach file button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${attachments.length > 0
                                        ? 'bg-accent-muted text-accent'
                                        : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover'
                                        }`}
                                    title="Attach files or images"
                                >
                                    <Paperclip size={12} />
                                    <span className="hidden sm:inline">
                                        {attachments.length > 0 ? `${attachments.length}` : 'Attach'}
                                    </span>
                                </button>

                                {/* Web search toggle */}
                                {tavilyKey && (
                                    <button
                                        onClick={() => setWebSearch(!webSearch)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${webSearch
                                            ? 'bg-accent-muted text-accent'
                                            : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover'
                                            }`}
                                        title="Toggle web search"
                                    >
                                        <Globe size={12} />
                                        <span className="hidden sm:inline">Web</span>
                                    </button>
                                )}

                                {/* Visual mode toggle */}
                                <button
                                    onClick={() => setVisualMode(!visualMode)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${visualMode
                                        ? 'bg-accent-muted text-accent'
                                        : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover'
                                        }`}
                                    title={visualMode ? 'Visual mode ON' : 'Visual mode OFF'}
                                >
                                    <LayoutGrid size={12} />
                                    <span className="hidden sm:inline">Visual</span>
                                </button>

                                {/* Voice mode toggle */}
                                {hasVoice && (
                                    <button
                                        onClick={() => setVoiceMode(true)}
                                        className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover transition-colors"
                                        title="Voice mode"
                                    >
                                        <Mic size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5">
                                {isStreaming ? (
                                    <button
                                        onClick={onStop}
                                        className="p-2 rounded-lg bg-error/20 text-error hover:bg-error/30 transition-colors"
                                        title="Stop generating"
                                    >
                                        <Square size={16} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSend}
                                        disabled={(!text.trim() && attachments.length === 0) || !apiKey}
                                        className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Send message"
                                    >
                                        <Send size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <p className="text-center text-[10px] text-text-tertiary mt-2">
                    AI responses may be inaccurate. All data stays in your browser.
                </p>
            </div>
        </div>
    );
}
