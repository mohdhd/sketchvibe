import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import hljs from 'highlight.js';

interface CodeBlockProps {
    code: string;
    language: string;
    highlightedChildren?: unknown;
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const highlighted = useMemo(() => {
        try {
            if (language && hljs.getLanguage(language)) {
                return hljs.highlight(code, { language }).value;
            }
            return hljs.highlightAuto(code).value;
        } catch {
            return code;
        }
    }, [code, language]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 rounded-lg border border-border overflow-hidden bg-bg-secondary">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-bg-surface border-b border-border">
                <span className="text-[11px] text-text-tertiary font-mono">{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={12} className="text-success" />
                            <span>Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            {/* Code */}
            <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed font-mono">
                <code
                    className={`hljs ${language ? `language-${language}` : ''}`}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
            </pre>
        </div>
    );
}
