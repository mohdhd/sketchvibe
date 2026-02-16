import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getApiKey, getTavilyApiKey, getProvider } from '../lib/providers';
import VoiceButton from './VoiceButton';

interface ChatInputProps {
    onSend: (text: string, webSearch: boolean) => void;
    onStop: () => void;
    isStreaming: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
    const { activeProviderId, activeModelId, setActiveModal } = useApp();
    const [text, setText] = useState('');
    const [webSearch, setWebSearch] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const apiKey = getApiKey(activeProviderId);
    const tavilyKey = getTavilyApiKey();
    const provider = getProvider(activeProviderId);
    const model = provider?.models.find((m) => m.id === activeModelId);

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
        if (!trimmed || isStreaming) return;
        onSend(trimmed, webSearch);
        setText('');
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
        setText((prev) => (prev ? prev + ' ' : '') + transcript);
        textareaRef.current?.focus();
    };

    return (
        <div className="border-t border-border bg-bg-primary px-3 pb-3 pt-2 md:px-4 md:pb-4">
            <div className="max-w-3xl mx-auto">
                <div className="relative flex flex-col bg-bg-surface border border-border rounded-xl focus-within:border-accent/50 transition-colors">
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

                            {/* Voice */}
                            <VoiceButton onResult={handleVoiceResult} />
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
                                    disabled={!text.trim() || !apiKey}
                                    className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Send message"
                                >
                                    <Send size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <p className="text-center text-[10px] text-text-tertiary mt-2">
                    AI responses may be inaccurate. All data stays in your browser.
                </p>
            </div>
        </div>
    );
}
