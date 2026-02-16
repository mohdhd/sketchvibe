import { type ReactNode, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

// ─── Types ───

interface HeroData {
    title: string;
    subtitle?: string;
    badge?: string;
}

interface FeatureItem {
    icon: string;
    title: string;
    desc: string;
}

interface StatItem {
    value: string;
    label: string;
}

interface StepItem {
    title: string;
    desc: string;
}

interface SplitData {
    title?: string;
    left: string;
    right: string;
}

interface CompareItem {
    title: string;
    color?: string;
    points: string[];
}

interface CompareData {
    items: CompareItem[];
}

// ─── Helpers ───

function safeParse<T>(json: string): T | null {
    try {
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

const miniRemarkPlugins = [remarkGfm];

const miniComponents = {
    code({ className, children }: { className?: string; children?: ReactNode;[key: string]: unknown }) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className;

        if (isInline) {
            return <code className="inline-code">{children}</code>;
        }

        // Extract plain text from children
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
};

function MiniMarkdown({ content }: { content: string }) {
    return (
        <ReactMarkdown remarkPlugins={miniRemarkPlugins} components={miniComponents as any}>
            {content}
        </ReactMarkdown>
    );
}

// ─── HeroBlock ───

export function HeroBlock({ config }: { config: string }) {
    const data = safeParse<HeroData>(config);
    if (!data) return null;

    return (
        <div className="landing-hero">
            <div className="landing-hero-bg" />
            {data.badge && (
                <span className="landing-hero-badge">{data.badge}</span>
            )}
            <h1 className="landing-hero-title">{data.title}</h1>
            {data.subtitle && (
                <p className="landing-hero-subtitle">{data.subtitle}</p>
            )}
        </div>
    );
}

// ─── FeaturesGrid ───

export function FeaturesGrid({ config }: { config: string }) {
    const items = safeParse<FeatureItem[]>(config);
    if (!items || items.length === 0) return null;

    return (
        <div className="landing-features">
            {items.map((item, i) => (
                <div key={i} className="landing-feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span className="landing-feature-icon">{item.icon}</span>
                    <h3 className="landing-feature-title">{item.title}</h3>
                    <p className="landing-feature-desc">{item.desc}</p>
                </div>
            ))}
        </div>
    );
}

// ─── StatsRow ───

function AnimatedValue({ value }: { value: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <span ref={ref} className={`landing-stat-value ${visible ? 'animate-in' : ''}`}>
            {value}
        </span>
    );
}

export function StatsRow({ config }: { config: string }) {
    const items = safeParse<StatItem[]>(config);
    if (!items || items.length === 0) return null;

    return (
        <div className="landing-stats">
            {items.map((item, i) => (
                <div key={i} className="landing-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                    <AnimatedValue value={item.value} />
                    <span className="landing-stat-label">{item.label}</span>
                </div>
            ))}
        </div>
    );
}

// ─── StepsFlow ───

export function StepsFlow({ config }: { config: string }) {
    const steps = safeParse<StepItem[]>(config);
    if (!steps || steps.length === 0) return null;

    return (
        <div className="landing-steps">
            {steps.map((step, i) => (
                <div key={i} className="landing-step" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="landing-step-indicator">
                        <div className="landing-step-number">{i + 1}</div>
                        {i < steps.length - 1 && <div className="landing-step-connector" />}
                    </div>
                    <div className="landing-step-content">
                        <h4 className="landing-step-title">{step.title}</h4>
                        <p className="landing-step-desc">{step.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── SplitSection ───

export function SplitSection({ config }: { config: string }) {
    const data = safeParse<SplitData>(config);
    if (!data) return null;

    return (
        <div className="landing-split">
            {data.title && <h3 className="landing-split-title">{data.title}</h3>}
            <div className="landing-split-columns">
                <div className="landing-split-left">
                    <MiniMarkdown content={data.left} />
                </div>
                <div className="landing-split-right">
                    <MiniMarkdown content={data.right} />
                </div>
            </div>
        </div>
    );
}

// ─── CompareBlock ───

const DEFAULT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function CompareBlock({ config }: { config: string }) {
    const data = safeParse<CompareData>(config);
    if (!data || !data.items || data.items.length === 0) return null;

    return (
        <div className="landing-compare">
            {data.items.map((item, i) => {
                const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                return (
                    <div key={i} className="landing-compare-card" style={{ '--compare-color': color } as React.CSSProperties}>
                        <div className="landing-compare-header" style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)` }}>
                            <h3 className="landing-compare-title" style={{ color }}>{item.title}</h3>
                        </div>
                        <ul className="landing-compare-points">
                            {item.points.map((point, j) => (
                                <li key={j}>
                                    <span className="landing-compare-bullet" style={{ background: color }} />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}
