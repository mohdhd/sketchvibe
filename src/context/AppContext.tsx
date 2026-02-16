import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getActiveProvider, getActiveModel, setActiveProvider as persistProvider, setActiveModel as persistModel } from '../lib/providers';
import type { CanvasSpec } from '../lib/db';
import { DEFAULT_CANVAS_SPEC, compileCanvasSpec } from '../lib/canvasSpec';
import { starterCanvases } from '../lib/starterCanvases';

type ModalType = 'settings' | 'canvas-studio' | 'canvas-library' | 'export-import' | null;

const GLOBAL_CANVAS_KEY = 'sketchvibe_global_canvas_id';

interface AppContextType {
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    activeModal: ModalType;
    setActiveModal: (modal: ModalType) => void;
    activeProviderId: string;
    activeModelId: string;
    setActiveProviderAndModel: (providerId: string, modelId: string) => void;
    isStreaming: boolean;
    setIsStreaming: (streaming: boolean) => void;
    activeCanvasSpec: CanvasSpec;
    activeCanvasId: string | null;
    setGlobalCanvas: (canvasId: string, spec: CanvasSpec) => void;
    resetGlobalCanvas: () => void;
}

// Map canvas spec colors → CSS custom properties used by the Tailwind theme
function applyCanvasToRoot(spec: CanvasSpec) {
    const root = document.documentElement;
    const c = spec.tokens.colors;

    // Core Tailwind theme vars (override @theme definitions)
    root.style.setProperty('--color-bg-primary', c.bg);
    root.style.setProperty('--color-bg-secondary', c.surface);
    root.style.setProperty('--color-bg-surface', c.surface);
    root.style.setProperty('--color-bg-surface-hover', c.surfaceAlt);
    root.style.setProperty('--color-bg-elevated', c.surfaceAlt);
    root.style.setProperty('--color-border', c.border);
    root.style.setProperty('--color-text-primary', c.text);
    root.style.setProperty('--color-text-secondary', c.textSecondary);
    root.style.setProperty('--color-accent', c.accent);
    root.style.setProperty('--color-accent-hover', c.accentAlt);
    root.style.setProperty('--color-success', c.success);
    root.style.setProperty('--color-warning', c.warning);
    root.style.setProperty('--color-error', c.error);

    // Typography
    root.style.setProperty('--font-sans', spec.tokens.typography.fontFamily);
    root.style.setProperty('--font-mono', spec.tokens.typography.fontFamilyMono);

    // Decorations — background gradient
    if (spec.decorations?.backgroundGradient && spec.decorations.backgroundGradient !== 'none') {
        document.body.style.backgroundImage = spec.decorations.backgroundGradient;
    } else {
        document.body.style.backgroundImage = 'none';
    }

    // Also apply all --canvas-* vars for block renderers
    const canvasVars = compileCanvasSpec(spec);
    for (const [key, value] of Object.entries(canvasVars)) {
        root.style.setProperty(key, value);
    }

    // Update body bg
    document.body.style.backgroundColor = c.bg;
}

function getInitialCanvas(): { id: string | null; spec: CanvasSpec } {
    const savedId = localStorage.getItem(GLOBAL_CANVAS_KEY);
    if (savedId) {
        const starter = starterCanvases.find((c) => c.id === savedId);
        if (starter) return { id: savedId, spec: starter.spec };
    }
    return { id: null, spec: DEFAULT_CANVAS_SPEC };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const initial = getInitialCanvas();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [activeProviderId, setActiveProviderId] = useState(getActiveProvider());
    const [activeModelId, setActiveModelId] = useState(getActiveModel());
    const [isStreaming, setIsStreaming] = useState(false);
    const [activeCanvasSpec, setActiveCanvasSpec] = useState<CanvasSpec>(initial.spec);
    const [activeCanvasId, setActiveCanvasId] = useState<string | null>(initial.id);

    const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

    const setActiveProviderAndModel = useCallback((providerId: string, modelId: string) => {
        setActiveProviderId(providerId);
        setActiveModelId(modelId);
        persistProvider(providerId);
        persistModel(modelId);
    }, []);

    const setGlobalCanvas = useCallback((canvasId: string, spec: CanvasSpec) => {
        setActiveCanvasSpec(spec);
        setActiveCanvasId(canvasId);
        localStorage.setItem(GLOBAL_CANVAS_KEY, canvasId);
        applyCanvasToRoot(spec);
    }, []);

    const resetGlobalCanvas = useCallback(() => {
        setActiveCanvasSpec(DEFAULT_CANVAS_SPEC);
        setActiveCanvasId(null);
        localStorage.removeItem(GLOBAL_CANVAS_KEY);
        applyCanvasToRoot(DEFAULT_CANVAS_SPEC);
    }, []);

    // Apply canvas on mount (restore from localStorage)
    useEffect(() => {
        applyCanvasToRoot(activeCanvasSpec);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close sidebar on mobile when conversation is selected
    useEffect(() => {
        if (window.innerWidth < 768 && activeConversationId) {
            setSidebarOpen(false);
        }
    }, [activeConversationId]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === ',') {
                    e.preventDefault();
                    setActiveModal(activeModal === 'settings' ? null : 'settings');
                }
                if (e.key === 'b') {
                    e.preventDefault();
                    toggleSidebar();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeModal, toggleSidebar]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <AppContext.Provider
            value={{
                activeConversationId,
                setActiveConversationId,
                sidebarOpen,
                toggleSidebar,
                setSidebarOpen,
                activeModal,
                setActiveModal,
                activeProviderId,
                activeModelId,
                setActiveProviderAndModel,
                isStreaming,
                setIsStreaming,
                activeCanvasSpec,
                activeCanvasId,
                setGlobalCanvas,
                resetGlobalCanvas,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
