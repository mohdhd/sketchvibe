import { useState } from 'react';
import { Copy, Check, User, Bot, Volume2, VolumeX, Loader2 } from 'lucide-react';
import type { Message } from '../lib/db';
import BlockRenderer from './blocks/BlockRenderer';
import SourcesPanel from './SourcesPanel';
import { getTTSProvider, getApiKey, getVoiceApiKey, getEffectiveTTSVoice } from '../lib/providers';
import { speakOpenAI, speakElevenLabs, stopPlayback } from '../lib/voice/tts';

interface MessageBubbleProps {
    message: Message;
    isStreaming: boolean;
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
    const [copied, setCopied] = useState(false);
    const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing'>('idle');

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // TTS availability
    const ttsProvider = getTTSProvider();
    const ttsApiKey = ttsProvider === 'openai-tts'
        ? getApiKey('openai')
        : getVoiceApiKey('tts', 'elevenlabs');
    const hasTts = !!ttsApiKey;

    const handleSpeak = async () => {
        if (ttsState === 'playing') {
            stopPlayback();
            setTtsState('idle');
            return;
        }

        if (!ttsApiKey || ttsState === 'loading') return;

        setTtsState('loading');
        try {
            // Strip code blocks but keep surrounding text for TTS
            const lines = message.content.split('\n');
            const textLines: string[] = [];
            let inCodeBlock = false;

            for (const line of lines) {
                if (line.trimStart().startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                    continue;
                }
                if (!inCodeBlock) {
                    textLines.push(line);
                }
            }

            const plainText = textLines.join('\n')
                .replace(/`[^`]+`/g, '')                // remove inline code
                .replace(/!\[[^\]]*\]\([^)]*\)/g, '')   // remove images
                .replace(/\[[^\]]*\]\(([^)]*)\)/g, '')  // remove links
                .replace(/^#{1,6}\s+/gm, '')            // remove heading markers
                .replace(/[*_~`]/g, '')                  // remove bold/italic markers
                .replace(/^[\s]*[-*+]\s/gm, '')         // remove list markers
                .replace(/^[\s]*\d+\.\s/gm, '')         // remove numbered list markers
                .replace(/\n{2,}/g, '. ')               // paragraph breaks → pauses
                .replace(/\n/g, ' ')                     // newlines → spaces
                .replace(/\s{2,}/g, ' ')                 // collapse whitespace
                .trim();

            if (!plainText) {
                setTtsState('idle');
                return;
            }

            // onFirstChunkReady fires when audio is about to start — keeps spinner until then
            const onReady = () => setTtsState('playing');

            const voice = getEffectiveTTSVoice();
            if (ttsProvider === 'openai-tts') {
                await speakOpenAI(plainText, ttsApiKey, voice, onReady);
            } else {
                await speakElevenLabs(plainText, ttsApiKey, voice, onReady);
            }

            setTtsState('idle');
        } catch (err) {
            console.error('TTS error:', err);
            setTtsState('idle');
        }
    };

    if (message.role === 'user') {
        return (
            <div className="flex gap-3 py-4 animate-fade-in">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center mt-0.5">
                    <User size={14} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {message.attachments.map((att, i) => (
                                att.type === 'image' ? (
                                    <a key={i} href={att.dataUrl} target="_blank" rel="noopener noreferrer" className="msg-attachment-thumb-link">
                                        <img src={att.dataUrl} alt={att.name} className="msg-attachment-thumb" />
                                    </a>
                                ) : (
                                    <span key={i} className="msg-attachment-chip">
                                        📄 {att.name}
                                    </span>
                                )
                            ))}
                        </div>
                    )}
                    {message.content && (
                        <p className="text-sm text-text-primary whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 py-5 animate-fade-in">
            <div className="shrink-0 w-7 h-7 rounded-lg bg-bg-surface border border-border flex items-center justify-center mt-1">
                <Bot size={14} className="text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0 response-wrapper">
                <div className={`leading-relaxed ${isStreaming ? 'streaming-cursor' : ''}`}>
                    <BlockRenderer content={message.content} isStreaming={isStreaming} />
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                    <SourcesPanel sources={message.sources} />
                )}

                {/* Actions */}
                {!isStreaming && message.content && (
                    <div className="flex items-center gap-1 mt-3">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover transition-colors"
                            title="Copy message"
                        >
                            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        </button>

                        {hasTts && (
                            <button
                                onClick={handleSpeak}
                                disabled={ttsState === 'loading'}
                                className={`p-1.5 rounded-md transition-colors ${ttsState === 'playing'
                                    ? 'text-accent bg-accent-muted'
                                    : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover'
                                    }`}
                                title={ttsState === 'playing' ? 'Stop playback' : 'Read aloud'}
                            >
                                {ttsState === 'loading' ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : ttsState === 'playing' ? (
                                    <VolumeX size={13} />
                                ) : (
                                    <Volume2 size={13} />
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
