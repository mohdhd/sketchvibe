import { type ReactNode, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import CodeBlock from './CodeBlock';
import ChartBlock from './ChartBlock';

interface BlockRendererProps {
    content: string;
}

// Stable plugin arrays — never recreated
const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex, rehypeHighlight];

// ─── Callout detection ───

type CalloutType = 'tip' | 'warning' | 'info' | 'success' | 'fire' | 'summary';

const CALLOUT_MAP: Record<string, CalloutType> = {
    '💡': 'tip',
    '⚠️': 'warning',
    'ℹ️': 'info',
    '✅': 'success',
    '🔥': 'fire',
    '📝': 'summary',
};

const CALLOUT_STYLES: Record<CalloutType, { border: string; bg: string; icon: string }> = {
    tip: { border: 'border-emerald-500/60', bg: 'bg-emerald-500/8', icon: '💡' },
    warning: { border: 'border-amber-500/60', bg: 'bg-amber-500/8', icon: '⚠️' },
    info: { border: 'border-blue-500/60', bg: 'bg-blue-500/8', icon: 'ℹ️' },
    success: { border: 'border-green-500/60', bg: 'bg-green-500/8', icon: '✅' },
    fire: { border: 'border-orange-500/60', bg: 'bg-orange-500/8', icon: '🔥' },
    summary: { border: 'border-violet-500/60', bg: 'bg-violet-500/8', icon: '📝' },
};

function detectCalloutType(children: ReactNode): CalloutType | null {
    const text = extractText(children);
    for (const [emoji, type] of Object.entries(CALLOUT_MAP)) {
        if (text.startsWith(emoji)) return type;
    }
    return null;
}

function extractText(node: ReactNode): string {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node && typeof node === 'object' && 'props' in node) {
        return extractText((node as { props: { children?: ReactNode } }).props.children);
    }
    return '';
}

// ─── Main component ───

// Stable components object — never recreated between renders
const markdownComponents = {
    // ─── Code blocks ───
    code({ className, children, ...props }: { className?: string; children?: ReactNode;[key: string]: unknown }) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className;
        const code = String(children).replace(/\n$/, '');

        if (isInline) {
            return (
                <code className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[13px] font-mono border border-accent/10" {...props}>
                    {children}
                </code>
            );
        }

        return <CodeBlock code={code} language={match?.[1] || ''} />;
    },

    // ─── Tables ───
    table({ children }: { children?: ReactNode }) {
        return (
            <div className="overflow-x-auto my-4 rounded-xl border border-border/60 shadow-sm">
                <table className="w-full text-sm">{children}</table>
            </div>
        );
    },
    thead({ children }: { children?: ReactNode }) {
        return <thead className="bg-bg-surface/80 backdrop-blur-sm">{children}</thead>;
    },
    th({ children }: { children?: ReactNode }) {
        return (
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
                {children}
            </th>
        );
    },
    td({ children }: { children?: ReactNode }) {
        return (
            <td className="px-4 py-2.5 text-sm text-text-primary border-b border-border/30">
                {children}
            </td>
        );
    },
    tr({ children }: { children?: ReactNode }) {
        return <tr className="hover:bg-accent/[0.03] transition-colors even:bg-bg-surface/30">{children}</tr>;
    },

    // ─── Blockquotes (callout cards) ───
    blockquote({ children }: { children?: ReactNode }) {
        const calloutType = detectCalloutType(children);

        if (calloutType) {
            const style = CALLOUT_STYLES[calloutType];
            return (
                <div className={`my-4 px-4 py-3.5 rounded-xl border-l-4 ${style.border} ${style.bg} text-sm backdrop-blur-sm`}>
                    {children}
                </div>
            );
        }

        return (
            <div className="my-4 px-4 py-3.5 rounded-xl border-l-4 border-accent/50 bg-accent/[0.06] text-sm backdrop-blur-sm">
                {children}
            </div>
        );
    },

    // ─── Lists ───
    ul({ children }: { children?: ReactNode }) {
        return <ul className="my-3 space-y-1.5 list-disc list-inside text-text-primary">{children}</ul>;
    },
    ol({ children }: { children?: ReactNode }) {
        return <ol className="my-3 space-y-2 list-decimal list-inside text-text-primary">{children}</ol>;
    },
    li({ children }: { children?: ReactNode }) {
        return <li className="text-sm leading-relaxed pl-1">{children}</li>;
    },

    // ─── Headings ───
    h1({ children }: { children?: ReactNode }) {
        return (
            <h1 className="text-2xl font-bold text-text-primary mt-6 mb-3 pb-2 border-b border-border/40">
                {children}
            </h1>
        );
    },
    h2({ children }: { children?: ReactNode }) {
        return (
            <h2 className="text-lg font-bold text-text-primary mt-6 mb-2.5 pb-1.5 border-b border-border/30">
                {children}
            </h2>
        );
    },
    h3({ children }: { children?: ReactNode }) {
        return (
            <h3 className="text-base font-semibold text-text-primary mt-5 mb-2">
                {children}
            </h3>
        );
    },
    h4({ children }: { children?: ReactNode }) {
        return (
            <h4 className="text-sm font-semibold text-text-secondary mt-4 mb-1.5 uppercase tracking-wide">
                {children}
            </h4>
        );
    },

    // ─── Paragraphs ───
    p({ children }: { children?: ReactNode }) {
        return <p className="my-2.5 text-text-primary leading-[1.75]">{children}</p>;
    },

    // ─── Links ───
    a({ href, children }: { href?: string; children?: ReactNode }) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover underline decoration-accent/30 underline-offset-2 hover:decoration-accent/60 transition-colors"
            >
                {children}
                <span className="inline-block ml-0.5 opacity-50 text-[10px]">↗</span>
            </a>
        );
    },

    // ─── Horizontal rule ───
    hr() {
        return (
            <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
        );
    },

    // ─── Strong/Bold ───
    strong({ children }: { children?: ReactNode }) {
        return <strong className="font-bold text-text-primary">{children}</strong>;
    },

    // ─── Emphasis ───
    em({ children }: { children?: ReactNode }) {
        return <em className="italic text-text-secondary">{children}</em>;
    },

    // ─── Checkboxes ───
    input({ type, checked, ...props }: { type?: string; checked?: boolean;[key: string]: unknown }) {
        if (type === 'checkbox') {
            return (
                <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="mr-2 rounded border-border accent-accent w-4 h-4"
                    {...props}
                />
            );
        }
        return <input type={type} {...props} />;
    },
};

function BlockRendererInner({ content }: BlockRendererProps) {
    const parts = useMemo(() => splitChartBlocks(content), [content]);

    return (
        <div className="prose-custom">
            {parts.map((part, i) => {
                if (part.type === 'chart') {
                    return <ChartBlock key={i} config={part.content} />;
                }
                return (
                    <ReactMarkdown
                        key={i}
                        remarkPlugins={remarkPlugins}
                        rehypePlugins={rehypePlugins}
                        components={markdownComponents as any}
                    >
                        {part.content}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
}

const BlockRenderer = memo(BlockRendererInner);
export default BlockRenderer;

// ─── Helpers ───

interface ContentPart {
    type: 'text' | 'chart';
    content: string;
}

function splitChartBlocks(content: string): ContentPart[] {
    const parts: ContentPart[] = [];
    const chartRegex = /```chart\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = chartRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'chart', content: match[1].trim() });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    if (parts.length === 0) {
        parts.push({ type: 'text', content });
    }

    return parts;
}
