import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Save, RotateCcw, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { streamChat, type ChatMessage } from '../../lib/ai';
import { canvasStudioSystemPrompt } from '../../lib/systemPrompts';
import { getApiKey } from '../../lib/providers';
import { DEFAULT_CANVAS_SPEC, mergeCanvasPatches, validateCanvasSpec } from '../../lib/canvasSpec';
import { saveCanvas } from '../../lib/hooks';
import type { CanvasSpec } from '../../lib/db';
import CanvasPreview from './CanvasPreview';

interface StudioMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function CanvasStudio() {
    const { setActiveModal, activeProviderId, activeModelId, setGlobalCanvas } = useApp();
    const [canvasSpec, setCanvasSpec] = useState<CanvasSpec>(DEFAULT_CANVAS_SPEC);
    const [messages, setMessages] = useState<StudioMessage[]>([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [canvasName, setCanvasName] = useState('My Canvas');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, streamingContent]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || streaming) return;

        const apiKey = getApiKey(activeProviderId);
        if (!apiKey) {
            alert('Please set your API key in Settings first.');
            return;
        }

        const userMsg: StudioMessage = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setStreaming(true);
        setStreamingContent('');

        const abort = new AbortController();
        abortRef.current = abort;

        const chatMessages: ChatMessage[] = [
            ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user' as const, content: text },
        ];

        await streamChat(
            chatMessages,
            activeProviderId,
            activeModelId,
            apiKey,
            canvasStudioSystemPrompt,
            {
                onChunk: (fullText) => setStreamingContent(fullText),
                onDone: (fullText) => {
                    setStreaming(false);
                    setStreamingContent('');
                    abortRef.current = null;

                    setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);

                    // Extract CanvasSpec from response
                    const specMatch = fullText.match(/```canvasspec\n([\s\S]*?)```/);
                    if (specMatch) {
                        try {
                            const patch = JSON.parse(specMatch[1]);
                            if (validateCanvasSpec(mergeCanvasPatches(canvasSpec, patch))) {
                                setCanvasSpec((prev) => mergeCanvasPatches(prev, patch));
                            }
                        } catch {
                            // ignore parse errors
                        }
                    }
                },
                onError: (error) => {
                    setStreaming(false);
                    setStreamingContent('');
                    abortRef.current = null;
                    setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ Error: ${error.message}` }]);
                },
            },
            abort.signal
        );
    }, [input, streaming, messages, activeProviderId, activeModelId, canvasSpec]);

    const handleSave = async () => {
        const id = await saveCanvas(canvasName, canvasSpec);
        setGlobalCanvas(id, canvasSpec);
        setActiveModal(null);
    };

    const handleReset = () => {
        setCanvasSpec(DEFAULT_CANVAS_SPEC);
        setMessages([]);
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-bg-primary">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-text-primary">Canvas Studio</h2>
                    <input
                        type="text"
                        value={canvasName}
                        onChange={(e) => setCanvasName(e.target.value)}
                        className="px-2 py-1 text-sm bg-bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:border-accent w-40"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary bg-bg-surface border border-border rounded-lg hover:bg-bg-surface-hover transition-colors"
                    >
                        <RotateCcw size={12} />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        <Save size={12} />
                        <span>Save</span>
                    </button>
                    <button
                        onClick={() => setActiveModal(null)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Split panes */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left: Chat */}
                <div className="flex-1 flex flex-col border-r border-border min-h-0 md:max-w-[50%]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-sm text-text-secondary mb-2">Describe your ideal canvas theme</p>
                                <p className="text-xs text-text-tertiary">Try: "A warm minimal theme with earthy tones and serif typography"</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-text-primary' : 'text-text-secondary'}`}>
                                <span className="text-[11px] text-text-tertiary font-medium">
                                    {msg.role === 'user' ? 'You' : 'Designer'}:
                                </span>
                                <p className="mt-0.5 whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        ))}
                        {streaming && streamingContent && (
                            <div className="text-sm text-text-secondary">
                                <span className="text-[11px] text-text-tertiary font-medium">Designer:</span>
                                <p className="mt-0.5 whitespace-pre-wrap streaming-cursor">{streamingContent}</p>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-border">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Describe your theme…"
                                className="flex-1 px-3 py-2 text-sm bg-bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || streaming}
                                className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-30 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <CanvasPreview spec={canvasSpec} />
                </div>
            </div>
        </div>
    );
}
