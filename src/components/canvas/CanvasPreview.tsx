import { useRef, useEffect } from 'react';
import type { CanvasSpec } from '../../lib/db';
import { compileCanvasSpec } from '../../lib/canvasSpec';

interface CanvasPreviewProps {
    spec: CanvasSpec;
}

export default function CanvasPreview({ spec }: CanvasPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const vars = compileCanvasSpec(spec);
        for (const [key, value] of Object.entries(vars)) {
            containerRef.current.style.setProperty(key, value);
        }
    }, [spec]);

    const bg = spec.tokens.colors.bg;
    const surface = spec.tokens.colors.surface;
    const surfaceAlt = spec.tokens.colors.surfaceAlt;
    const border = spec.tokens.colors.border;
    const text = spec.tokens.colors.text;
    const textSecondary = spec.tokens.colors.textSecondary;
    const accent = spec.tokens.colors.accent;
    const font = spec.tokens.typography.fontFamily;
    const fontMono = spec.tokens.typography.fontFamilyMono;


    return (
        <div
            ref={containerRef}
            className="min-h-full p-4 md:p-6"
            style={{ background: bg, fontFamily: font, color: text }}
        >
            <p className="text-xs mb-4" style={{ color: textSecondary }}>
                Live Preview — This is how your canvas will look
            </p>

            {/* User message */}
            <div className="flex gap-3 mb-4">
                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: `${accent}22`, color: accent }}>
                    U
                </div>
                <p className="text-sm leading-relaxed">
                    Can you compare React and Vue for a new project?
                </p>
            </div>

            {/* Assistant message with blocks */}
            <div className="flex gap-3 mb-4">
                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs border"
                    style={{ background: surface, borderColor: border, color: textSecondary }}>
                    AI
                </div>
                <div className="flex-1 text-sm leading-relaxed space-y-3">
                    <p>Here's a comparison of <strong>React</strong> and <strong>Vue</strong>:</p>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: border }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: surface }}>
                                    <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: textSecondary, borderBottom: `1px solid ${border}` }}>Feature</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: textSecondary, borderBottom: `1px solid ${border}` }}>React</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: textSecondary, borderBottom: `1px solid ${border}` }}>Vue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Learning Curve', 'Moderate', 'Gentle'],
                                    ['Bundle Size', '~40KB', '~33KB'],
                                    ['Ecosystem', 'Vast', 'Growing'],
                                ].map(([feature, react, vue]) => (
                                    <tr key={feature} style={{ borderBottom: `1px solid ${border}44` }}>
                                        <td className="px-3 py-2 text-xs font-medium">{feature}</td>
                                        <td className="px-3 py-2 text-xs">{react}</td>
                                        <td className="px-3 py-2 text-xs">{vue}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Callout */}
                    <div className="px-4 py-3 rounded-lg border-l-4" style={{ borderLeftColor: accent, background: `${accent}11` }}>
                        <p className="text-xs">💡 Both frameworks are excellent choices. React has a larger ecosystem, while Vue offers a gentler learning curve.</p>
                    </div>

                    {/* Code block */}
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: border }}>
                        <div className="px-3 py-1.5 text-[11px]" style={{ background: surface, borderBottom: `1px solid ${border}`, color: textSecondary, fontFamily: fontMono }}>
                            jsx
                        </div>
                        <pre className="p-3 overflow-x-auto text-xs leading-relaxed" style={{ background: surfaceAlt, fontFamily: fontMono }}>
                            <code>{`function App() {\n  return <h1>Hello World!</h1>;\n}`}</code>
                        </pre>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium">Next Steps:</p>
                        <label className="flex items-center gap-2 text-xs" style={{ color: textSecondary }}>
                            <input type="checkbox" readOnly className="rounded" style={{ accentColor: accent }} /> Set up project boilerplate
                        </label>
                        <label className="flex items-center gap-2 text-xs" style={{ color: textSecondary }}>
                            <input type="checkbox" readOnly checked className="rounded" style={{ accentColor: accent }} /> Choose a framework
                        </label>
                    </div>
                </div>
            </div>

            {/* Loading skeleton */}
            <div className="flex gap-3 opacity-40">
                <div className="shrink-0 w-7 h-7 rounded-lg" style={{ background: surface }} />
                <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-full w-3/4" style={{ background: surface }} />
                    <div className="h-3 rounded-full w-1/2" style={{ background: surface }} />
                </div>
            </div>
        </div>
    );
}
