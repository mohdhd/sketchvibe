import { useState } from 'react';
import { Copy, Check, User, Bot } from 'lucide-react';
import type { Message } from '../lib/db';
import BlockRenderer from './blocks/BlockRenderer';
import SourcesPanel from './SourcesPanel';

interface MessageBubbleProps {
    message: Message;
    isStreaming: boolean;
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (message.role === 'user') {
        return (
            <div className="flex gap-3 py-4 animate-fade-in">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center mt-0.5">
                    <User size={14} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 py-4 animate-fade-in">
            <div className="shrink-0 w-7 h-7 rounded-lg bg-bg-surface border border-border flex items-center justify-center mt-0.5">
                <Bot size={14} className="text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`text-sm leading-relaxed ${isStreaming ? 'streaming-cursor' : ''}`}>
                    <BlockRenderer content={message.content} />
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                    <SourcesPanel sources={message.sources} />
                )}

                {/* Actions */}
                {!isStreaming && message.content && (
                    <div className="flex items-center gap-1 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover transition-colors"
                            title="Copy message"
                        >
                            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
