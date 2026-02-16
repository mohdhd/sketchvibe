import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { SearchSource } from '../lib/db';

interface SourcesPanelProps {
    sources: SearchSource[];
}

export default function SourcesPanel({ sources }: SourcesPanelProps) {
    const [expanded, setExpanded] = useState(false);

    if (!sources.length) return null;

    return (
        <div className="mt-3">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <span>{sources.length} source{sources.length !== 1 ? 's' : ''}</span>
            </button>

            {expanded && (
                <div className="mt-2 space-y-2 animate-slide-up">
                    {sources.map((source, i) => (
                        <a
                            key={i}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 p-2.5 rounded-lg bg-bg-surface border border-border hover:bg-bg-surface-hover hover:border-border-active transition-colors group"
                        >
                            <span className="shrink-0 w-5 h-5 rounded bg-accent-muted text-accent text-[10px] font-bold flex items-center justify-center">
                                {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-text-primary truncate">{source.title}</span>
                                    <ExternalLink size={10} className="shrink-0 text-text-tertiary group-hover:text-accent transition-colors" />
                                </div>
                                <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-2">{source.content}</p>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
