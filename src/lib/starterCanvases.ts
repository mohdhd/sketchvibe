import type { CanvasSpec } from './db';
import { DEFAULT_CANVAS_SPEC } from './canvasSpec';

interface StarterCanvas {
    id: string;
    name: string;
    spec: CanvasSpec;
}

export const starterCanvases: StarterCanvas[] = [
    {
        id: 'starter-midnight',
        name: 'Midnight',
        spec: DEFAULT_CANVAS_SPEC,
    },
    {
        id: 'starter-aurora',
        name: 'Aurora',
        spec: {
            ...DEFAULT_CANVAS_SPEC,
            tokens: {
                ...DEFAULT_CANVAS_SPEC.tokens,
                colors: {
                    bg: '#0d0b1a',
                    surface: '#16132b',
                    surfaceAlt: '#1f1b3d',
                    border: 'rgba(168,85,247,0.12)',
                    text: '#e8e0f0',
                    textSecondary: '#9b8ab8',
                    accent: '#a855f7',
                    accentAlt: '#c084fc',
                    success: '#34d399',
                    warning: '#fbbf24',
                    error: '#f87171',
                },
            },
            decorations: {
                backgroundGradient: 'radial-gradient(ellipse at 20% 50%, rgba(168,85,247,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(34,211,153,0.06) 0%, transparent 50%)',
                backgroundPattern: 'none',
                messageGlow: true,
                animatedAccents: true,
            },
        },
    },
    {
        id: 'starter-paper',
        name: 'Paper',
        spec: {
            ...DEFAULT_CANVAS_SPEC,
            tokens: {
                ...DEFAULT_CANVAS_SPEC.tokens,
                colors: {
                    bg: '#faf8f5',
                    surface: '#ffffff',
                    surfaceAlt: '#f5f2ed',
                    border: 'rgba(0,0,0,0.08)',
                    text: '#1a1a1a',
                    textSecondary: '#6b6b6b',
                    accent: '#c2410c',
                    accentAlt: '#ea580c',
                    success: '#16a34a',
                    warning: '#d97706',
                    error: '#dc2626',
                },
                typography: {
                    fontFamily: 'Georgia, serif',
                    fontFamilyMono: 'JetBrains Mono, monospace',
                    scale: { xs: '11px', sm: '13px', base: '15px', lg: '17px', xl: '22px', xxl: '30px' },
                },
            },
            components: {
                ...DEFAULT_CANVAS_SPEC.components,
                card: { bg: '#ffffff', border: 'rgba(0,0,0,0.08)', radius: '8px', padding: '20px' },
                codeBlock: { bg: '#f5f2ed', border: 'rgba(0,0,0,0.08)' },
                table: { headerBg: '#f5f2ed', rowAltBg: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.08)' },
            },
        },
    },
    {
        id: 'starter-neon',
        name: 'Neon',
        spec: {
            ...DEFAULT_CANVAS_SPEC,
            tokens: {
                ...DEFAULT_CANVAS_SPEC.tokens,
                colors: {
                    bg: '#000000',
                    surface: '#0a0a0a',
                    surfaceAlt: '#141414',
                    border: 'rgba(0,255,136,0.12)',
                    text: '#e0ffe0',
                    textSecondary: '#66ff99',
                    accent: '#00ff88',
                    accentAlt: '#ff00aa',
                    success: '#00ff88',
                    warning: '#ffff00',
                    error: '#ff0044',
                },
            },
            decorations: {
                backgroundGradient: 'none',
                backgroundPattern: 'grid',
                messageGlow: true,
                animatedAccents: true,
            },
        },
    },
    {
        id: 'starter-ocean',
        name: 'Ocean',
        spec: {
            ...DEFAULT_CANVAS_SPEC,
            tokens: {
                ...DEFAULT_CANVAS_SPEC.tokens,
                colors: {
                    bg: '#0b1120',
                    surface: '#111b2e',
                    surfaceAlt: '#182640',
                    border: 'rgba(56,189,248,0.1)',
                    text: '#e0eeff',
                    textSecondary: '#7aa2cc',
                    accent: '#0ea5e9',
                    accentAlt: '#38bdf8',
                    success: '#2dd4bf',
                    warning: '#fbbf24',
                    error: '#f87171',
                },
            },
            decorations: {
                backgroundGradient: 'linear-gradient(180deg, #0b1120 0%, #0f1d35 100%)',
                backgroundPattern: 'none',
                messageGlow: false,
                animatedAccents: false,
            },
        },
    },
];
