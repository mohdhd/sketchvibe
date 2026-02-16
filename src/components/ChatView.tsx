import { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowDown, Sparkles, PanelLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMessages, addMessage, updateMessage, autoTitleConversation, createConversation } from '../lib/hooks';
import { streamChat, type ChatMessage } from '../lib/ai';
import { buildSystemPrompt } from '../lib/systemPrompts';
import { getApiKey, getTavilyApiKey } from '../lib/providers';
import { searchWeb, formatSearchResultsForPrompt } from '../lib/search';
import type { Attachment } from '../lib/db';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export default function ChatView() {
    const {
        activeConversationId,
        setActiveConversationId,
        activeProviderId,
        activeModelId,
        isStreaming,
        setIsStreaming,
        toggleSidebar,
        sidebarOpen,
    } = useApp();

    const messages = useMessages(activeConversationId);
    const [streamingContent, setStreamingContent] = useState('');
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }, []);

    useEffect(() => {
        scrollToBottom(false);
    }, [messages.length, scrollToBottom]);

    useEffect(() => {
        if (streamingContent) scrollToBottom();
    }, [streamingContent, scrollToBottom]);

    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const isScrollable = el.scrollHeight > el.clientHeight + 50;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        setShowScrollBtn(isScrollable && !atBottom);
    }, []);

    const handleSend = useCallback(
        async (text: string, webSearch: boolean, visualMode: boolean = true, attachments: Attachment[] = []) => {
            let conversationId = activeConversationId;

            if (!conversationId) {
                conversationId = await createConversation(activeProviderId, activeModelId);
                setActiveConversationId(conversationId);
            }

            const apiKey = getApiKey(activeProviderId);
            if (!apiKey) {
                alert(`Please set your ${activeProviderId} API key in Settings.`);
                return;
            }

            await addMessage(conversationId, 'user', text, undefined, attachments.length > 0 ? attachments : undefined);

            // Auto-title on first message
            const msgCount = messages.length;
            if (msgCount === 0) {
                autoTitleConversation(conversationId, text);
            }

            // Build system prompt with date and web search awareness
            const currentDate = new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });

            let searchContext = '';

            // Web search — fetch results and build context block
            if (webSearch) {
                const tavilyKey = getTavilyApiKey();
                if (tavilyKey) {
                    try {
                        const searchResults = await searchWeb(text, tavilyKey);
                        searchContext = formatSearchResultsForPrompt(searchResults.results);
                    } catch {
                        // Graceful fallback — proceed without search
                    }
                }
            }

            const systemPrompt = buildSystemPrompt(webSearch, currentDate, visualMode);

            const chatMessages: ChatMessage[] = [
                ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, attachments: m.attachments })),
                { role: 'user' as const, content: searchContext ? text + searchContext : text, attachments: attachments.length > 0 ? attachments : undefined },
            ];

            setIsStreaming(true);
            setStreamingContent('');
            const abort = new AbortController();
            abortRef.current = abort;

            const assistantMsgId = await addMessage(conversationId, 'assistant', '');

            await streamChat(
                chatMessages,
                activeProviderId,
                activeModelId,
                apiKey,
                systemPrompt,
                {
                    onChunk: (fullText) => {
                        setStreamingContent(fullText);
                    },
                    onDone: async (fullText) => {
                        setStreamingContent('');
                        setIsStreaming(false);
                        abortRef.current = null;
                        await updateMessage(assistantMsgId, fullText);
                    },
                    onError: async (error) => {
                        setStreamingContent('');
                        setIsStreaming(false);
                        abortRef.current = null;
                        await updateMessage(assistantMsgId, `⚠️ Error: ${error.message}`);
                    },
                },
                abort.signal
            );
        },
        [activeConversationId, activeProviderId, activeModelId, messages, setActiveConversationId, setIsStreaming]
    );

    const handleStop = useCallback(() => {
        abortRef.current?.abort();
        setIsStreaming(false);
        setStreamingContent('');
    }, [setIsStreaming]);

    const suggestedPrompts = [
        '✨ Explain quantum computing simply',
        '📊 Compare React vs Vue vs Svelte',
        '🧮 Solve a calculus integral step by step',
        '📝 Create a project planning template',
    ];

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-bg-primary relative">
            {/* Mobile Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border md:hidden">
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-bg-surface-hover text-text-secondary transition-colors"
                >
                    <PanelLeft size={20} />
                </button>
                <img src="/logo.svg" alt="" style={{ width: 22, height: 22, borderRadius: 5 }} />
                <span className="text-sm font-medium text-text-primary truncate">SketchVibe</span>
            </div>

            {/* Desktop toggle when sidebar is hidden */}
            {!sidebarOpen && (
                <div className="hidden md:flex items-center gap-3 px-4 py-3 border-b border-border">
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-lg hover:bg-bg-surface-hover text-text-secondary transition-colors"
                    >
                        <PanelLeft size={20} />
                    </button>
                    <img src="/logo.svg" alt="" style={{ width: 22, height: 22, borderRadius: 5 }} />
                    <span className="text-sm font-medium text-text-primary">SketchVibe</span>
                </div>
            )}

            {/* Messages */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto"
            >
                {!activeConversationId || messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
                        <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mb-6">
                            <Sparkles size={28} className="text-accent" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-2 text-center">
                            How can I help you today?
                        </h1>
                        <p className="text-sm text-text-secondary mb-8 text-center max-w-md">
                            Start a conversation or try one of these prompts
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                            {suggestedPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt.replace(/^[^\s]+\s/, ''), false)}
                                    className="text-left px-4 py-3 rounded-xl border border-border bg-bg-surface hover:bg-bg-surface-hover text-sm text-text-secondary hover:text-text-primary transition-all hover:border-border-active"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto px-4 py-6 space-y-1">
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isStreaming={false}
                            />
                        ))}
                        {isStreaming && streamingContent && (
                            <MessageBubble
                                message={{
                                    id: 'streaming',
                                    conversationId: activeConversationId!,
                                    role: 'assistant',
                                    content: streamingContent,
                                    createdAt: Date.now(),
                                }}
                                isStreaming={true}
                            />
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
                {/* Scroll to bottom button */}
                {showScrollBtn && (
                    <button
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full bg-bg-surface border border-border shadow-md hover:bg-bg-surface-hover transition-all animate-fade-in z-10"
                    >
                        <ArrowDown size={16} className="text-text-secondary" />
                    </button>
                )}
            </div>

            {/* Input */}
            <ChatInput
                onSend={handleSend}
                onStop={handleStop}
                isStreaming={isStreaming}
            />
        </div>
    );
}
