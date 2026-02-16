import type { CanvasSpec } from './db';

// ─── Default Canvas ───

export const DEFAULT_CANVAS_SPEC: CanvasSpec = {
    tokens: {
        colors: {
            bg: '#0a0a0f',
            surface: '#1a1a26',
            surfaceAlt: '#222233',
            border: 'rgba(255,255,255,0.06)',
            text: '#e8e8ed',
            textSecondary: '#8888a0',
            accent: '#6366f1',
            accentAlt: '#818cf8',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
        },
        typography: {
            fontFamily: 'Inter, sans-serif',
            fontFamilyMono: 'JetBrains Mono, monospace',
            scale: { xs: '11px', sm: '13px', base: '14px', lg: '16px', xl: '20px', xxl: '28px' },
        },
        spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
        radius: { sm: '6px', md: '8px', lg: '12px', full: '9999px' },
        shadows: {
            sm: '0 1px 2px rgba(0,0,0,0.3)',
            md: '0 4px 12px rgba(0,0,0,0.4)',
        },
    },
    components: {
        card: { bg: '#1a1a26', border: 'rgba(255,255,255,0.06)', radius: '12px', padding: '16px' },
        callout: {
            info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', accent: '#3b82f6' },
            warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', accent: '#f59e0b' },
            tip: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', accent: '#22c55e' },
            caution: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', accent: '#ef4444' },
        },
        table: { headerBg: '#1a1a26', rowAltBg: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' },
        codeBlock: { bg: '#12121a', border: 'rgba(255,255,255,0.06)' },
        input: { bg: '#12121a', border: 'rgba(255,255,255,0.08)', focusBorder: '#6366f1', radius: '8px' },
        button: {
            primary: { bg: '#6366f1', text: '#ffffff', hoverBg: '#818cf8' },
            secondary: { bg: 'rgba(255,255,255,0.06)', text: '#e8e8ed', hoverBg: 'rgba(255,255,255,0.1)' },
        },
    },
    decorations: {
        backgroundGradient: 'none',
        backgroundPattern: 'none',
        messageGlow: false,
        animatedAccents: false,
    },
};

// ─── Compile CanvasSpec to CSS variables ───

export function compileCanvasSpec(spec: CanvasSpec): Record<string, string> {
    const vars: Record<string, string> = {};

    // Colors
    for (const [key, value] of Object.entries(spec.tokens.colors)) {
        vars[`--canvas-color-${key}`] = value;
    }

    // Typography
    vars['--canvas-font-family'] = spec.tokens.typography.fontFamily;
    vars['--canvas-font-mono'] = spec.tokens.typography.fontFamilyMono;
    for (const [key, value] of Object.entries(spec.tokens.typography.scale)) {
        vars[`--canvas-font-${key}`] = value;
    }

    // Spacing
    for (const [key, value] of Object.entries(spec.tokens.spacing)) {
        vars[`--canvas-space-${key}`] = value;
    }

    // Radius
    for (const [key, value] of Object.entries(spec.tokens.radius)) {
        vars[`--canvas-radius-${key}`] = value;
    }

    // Shadows
    for (const [key, value] of Object.entries(spec.tokens.shadows)) {
        vars[`--canvas-shadow-${key}`] = value;
    }

    // Component - card
    for (const [key, value] of Object.entries(spec.components.card)) {
        vars[`--canvas-card-${key}`] = value;
    }

    // Component - code
    for (const [key, value] of Object.entries(spec.components.codeBlock)) {
        vars[`--canvas-code-${key}`] = value;
    }

    // Component - table
    for (const [key, value] of Object.entries(spec.components.table)) {
        vars[`--canvas-table-${key}`] = value;
    }

    return vars;
}

// ─── Apply canvas to DOM element ───

export function applyCanvasToElement(el: HTMLElement, spec: CanvasSpec) {
    const vars = compileCanvasSpec(spec);
    for (const [key, value] of Object.entries(vars)) {
        el.style.setProperty(key, value);
    }
}

// ─── Validate CanvasSpec (basic XSS prevention) ───

export function validateCanvasSpec(spec: unknown): spec is CanvasSpec {
    if (!spec || typeof spec !== 'object') return false;
    const s = spec as Record<string, unknown>;
    if (!s.tokens || typeof s.tokens !== 'object') return false;

    // Check no values contain script tags or dangerous patterns
    const jsonStr = JSON.stringify(spec);
    if (/<script/i.test(jsonStr) || /javascript:/i.test(jsonStr) || /on\w+=/i.test(jsonStr)) {
        return false;
    }

    return true;
}

// ─── Merge patches ───

export function mergeCanvasPatches(base: CanvasSpec, patch: Partial<CanvasSpec>): CanvasSpec {
    return {
        tokens: {
            colors: { ...base.tokens.colors, ...patch.tokens?.colors },
            typography: {
                ...base.tokens.typography,
                ...patch.tokens?.typography,
                scale: { ...base.tokens.typography.scale, ...patch.tokens?.typography?.scale },
            },
            spacing: { ...base.tokens.spacing, ...patch.tokens?.spacing },
            radius: { ...base.tokens.radius, ...patch.tokens?.radius },
            shadows: { ...base.tokens.shadows, ...patch.tokens?.shadows },
        },
        components: {
            card: { ...base.components.card, ...patch.components?.card },
            callout: {
                info: { ...base.components.callout.info, ...patch.components?.callout?.info },
                warning: { ...base.components.callout.warning, ...patch.components?.callout?.warning },
                tip: { ...base.components.callout.tip, ...patch.components?.callout?.tip },
                caution: { ...base.components.callout.caution, ...patch.components?.callout?.caution },
            },
            table: { ...base.components.table, ...patch.components?.table },
            codeBlock: { ...base.components.codeBlock, ...patch.components?.codeBlock },
            input: { ...base.components.input, ...patch.components?.input },
            button: {
                primary: { ...base.components.button.primary, ...patch.components?.button?.primary },
                secondary: { ...base.components.button.secondary, ...patch.components?.button?.secondary },
            },
        },
        decorations: { ...base.decorations, ...patch.decorations },
    };
}
