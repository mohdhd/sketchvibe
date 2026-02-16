import { type ReactNode, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import CodeBlock from './CodeBlock';
import ChartBlock from './ChartBlock';
import {
    HeroBlock,
    FeaturesGrid,
    StatsRow,
    StepsFlow,
    SplitSection,
    CompareBlock,
} from './LandingBlocks';

interface BlockRendererProps {
    content: string;
    isStreaming?: boolean;
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

// ─── Metric detection ───
const METRIC_REGEX = /^[\d$€£¥₹,.]+[%+kKmMbBxX]?$/;
function isMetricText(text: string): boolean {
    return METRIC_REGEX.test(text.trim()) && text.trim().length <= 20;
}

// ─── Heading counter ───
let headingCounter = 0;

// ─── Markdown components ───

const markdownComponents = {
    code({ className, children, ...props }: { className?: string; children?: ReactNode;[key: string]: unknown }) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className;

        if (isInline) {
            return <code className="inline-code" {...props}>{children}</code>;
        }

        // Extract plain text for copy button
        const extractPlainText = (node: unknown): string => {
            if (node == null) return '';
            if (typeof node === 'string') return node;
            if (typeof node === 'number') return String(node);
            if (Array.isArray(node)) return node.map(extractPlainText).join('');
            if (typeof node === 'object' && node !== null && 'props' in node) {
                return extractPlainText((node as { props: { children?: unknown } }).props.children);
            }
            return '';
        };

        const code = extractPlainText(children).replace(/\n$/, '');
        return <CodeBlock code={code} language={match?.[1] || ''} />;
    },

    table({ children }: { children?: ReactNode }) {
        return <div className="table-card overflow-x-auto"><table>{children}</table></div>;
    },
    thead({ children }: { children?: ReactNode }) { return <thead>{children}</thead>; },
    th({ children }: { children?: ReactNode }) { return <th>{children}</th>; },
    td({ children }: { children?: ReactNode }) { return <td>{children}</td>; },
    tr({ children }: { children?: ReactNode }) { return <tr>{children}</tr>; },

    blockquote({ children }: { children?: ReactNode }) {
        const calloutType = detectCalloutType(children);
        const typeClass = calloutType ? `callout-${calloutType}` : 'callout-default';
        return <div className={`callout-glass ${typeClass}`}>{children}</div>;
    },

    ul({ children }: { children?: ReactNode }) { return <ul className="styled-list">{children}</ul>; },
    ol({ children }: { children?: ReactNode }) { return <ol className="styled-list-ordered">{children}</ol>; },
    li({ children }: { children?: ReactNode }) { return <li>{children}</li>; },

    h1({ children }: { children?: ReactNode }) {
        headingCounter++;
        if (headingCounter === 1) return <h1 className="hero-heading">{children}</h1>;
        return <h1 className="heading-decorated heading-decorated-h2" style={{ fontSize: '24px' }}>{children}</h1>;
    },
    h2({ children }: { children?: ReactNode }) {
        headingCounter++;
        if (headingCounter === 1) return <h2 className="hero-heading" style={{ fontSize: '24px' }}>{children}</h2>;
        return <h2 className="heading-decorated heading-decorated-h2">{children}</h2>;
    },
    h3({ children }: { children?: ReactNode }) {
        return <h3 className="heading-decorated heading-decorated-h3">{children}</h3>;
    },
    h4({ children }: { children?: ReactNode }) {
        return <h4 className="heading-decorated heading-decorated-h4">{children}</h4>;
    },

    p({ children }: { children?: ReactNode }) { return <p>{children}</p>; },

    strong({ children }: { children?: ReactNode }) {
        const text = extractText(children);
        if (isMetricText(text)) return <strong className="metric-value">{children}</strong>;
        return <strong>{children}</strong>;
    },

    em({ children }: { children?: ReactNode }) { return <em>{children}</em>; },

    a({ href, children }: { href?: string; children?: ReactNode }) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="link-styled">
                {children}<span className="inline-block ml-0.5 opacity-50 text-[10px]">↗</span>
            </a>
        );
    },

    hr() { return <div className="section-divider" />; },

    input({ type, checked, ...props }: { type?: string; checked?: boolean;[key: string]: unknown }) {
        if (type === 'checkbox') {
            return <input type="checkbox" checked={checked} readOnly className="mr-2 rounded border-border accent-accent w-4 h-4" {...props} />;
        }
        return <input type={type} {...props} />;
    },
};

// ─── Main component ───

function BlockRendererInner({ content, isStreaming }: BlockRendererProps) {
    headingCounter = 0;

    const parts = useMemo(() => splitContentBlocks(content), [content]);

    return (
        <div className={`prose-custom ${isStreaming ? 'is-streaming' : ''}`}>
            {parts.map((part, i) => (
                <RenderPart key={i} part={part} />
            ))}
        </div>
    );
}

function RenderPart({ part }: { part: ContentPart }) {
    switch (part.type) {
        case 'chart': return <ChartBlock config={part.content} />;
        case 'hero': return <HeroBlock config={part.content} />;
        case 'features': return <FeaturesGrid config={part.content} />;
        case 'stats': return <StatsRow config={part.content} />;
        case 'steps': return <StepsFlow config={part.content} />;
        case 'split': return <SplitSection config={part.content} />;
        case 'compare': return <CompareBlock config={part.content} />;
        case 'text':
            return (
                <ReactMarkdown
                    remarkPlugins={remarkPlugins}
                    rehypePlugins={rehypePlugins}
                    components={markdownComponents as any}
                >
                    {part.content}
                </ReactMarkdown>
            );
        default:
            return null;
    }
}

const BlockRenderer = memo(BlockRendererInner);
export default BlockRenderer;

// ─── Helpers ───

type BlockType = 'text' | 'chart' | 'hero' | 'features' | 'stats' | 'steps' | 'split' | 'compare';

interface ContentPart {
    type: BlockType;
    content: string;
}

const BLOCK_TYPES = ['chart', 'hero', 'features', 'stats', 'steps', 'split', 'compare'];

/**
 * Line-by-line parser that splits content into visual blocks and text parts.
 * Correctly distinguishes visual blocks (```hero, ```features, etc.) from
 * regular code blocks (```python, ```js, etc.), preserving code blocks as
 * text for ReactMarkdown to render.
 */
function splitContentBlocks(content: string): ContentPart[] {
    const parts: ContentPart[] = [];
    const lines = content.split('\n');
    let textBuffer: string[] = [];
    let blockType: BlockType | null = null;
    let blockBuffer: string[] = [];
    let inCodeFence = false;

    const flushText = () => {
        const text = textBuffer.join('\n').trim();
        if (text) parts.push({ type: 'text', content: text });
        textBuffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // If we're inside a visual block, look for closing ```
        if (blockType) {
            if (trimmed === '```') {
                parts.push({ type: blockType, content: blockBuffer.join('\n').trim() });
                blockType = null;
                blockBuffer = [];
            } else {
                blockBuffer.push(line);
            }
            continue;
        }

        // If we're inside a regular code fence, look for closing ```
        if (inCodeFence) {
            textBuffer.push(line);
            if (trimmed === '```') {
                inCodeFence = false;
            }
            continue;
        }

        // Check for opening ``` 
        if (trimmed.startsWith('```')) {
            const tag = trimmed.slice(3).trim();
            if (BLOCK_TYPES.includes(tag)) {
                // Visual block — flush text, start capturing block content
                flushText();
                blockType = tag as BlockType;
                blockBuffer = [];
            } else {
                // Regular code block (```python, ```js, empty ```, etc.) — keep as text for markdown
                textBuffer.push(line);
                inCodeFence = true;
            }
            continue;
        }

        textBuffer.push(line);
    }

    // Flush remaining text
    flushText();

    if (parts.length === 0) {
        parts.push({ type: 'text', content });
    }

    return parts;
}
