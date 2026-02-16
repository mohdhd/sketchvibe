import { X, Plus, Trash2, Copy, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCanvases, deleteCanvas, duplicateCanvas } from '../../lib/hooks';
import { starterCanvases } from '../../lib/starterCanvases';
import { db } from '../../lib/db';

export default function CanvasLibrary() {
    const { setActiveModal, setGlobalCanvas, resetGlobalCanvas, activeCanvasId } = useApp();
    const userCanvases = useCanvases();

    const handleApplyStarter = (canvasId: string) => {
        const canvas = starterCanvases.find((c) => c.id === canvasId);
        if (canvas) {
            setGlobalCanvas(canvasId, canvas.spec);
        }
        setActiveModal(null);
    };

    const handleApplyUser = async (canvasId: string) => {
        const canvas = await db.canvases.get(canvasId);
        if (canvas) {
            setGlobalCanvas(canvasId, canvas.spec);
        }
        setActiveModal(null);
    };

    const handleReset = () => {
        resetGlobalCanvas();
        setActiveModal(null);
    };

    const handleDuplicate = async (id: string) => {
        await duplicateCanvas(id);
    };

    const handleDelete = async (id: string) => {
        if (id === activeCanvasId) {
            resetGlobalCanvas();
        }
        await deleteCanvas(id);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setActiveModal(null)} />
            <div className="relative w-full max-w-2xl max-h-[85vh] glass rounded-xl flex flex-col animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-text-primary">Canvas Library</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-bg-surface rounded-lg hover:bg-bg-surface-hover transition-colors"
                            title="Reset to default theme"
                        >
                            <RotateCcw size={12} />
                            Reset
                        </button>
                        <button
                            onClick={() => setActiveModal('canvas-studio')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
                        >
                            <Plus size={12} />
                            Create New
                        </button>
                        <button
                            onClick={() => setActiveModal(null)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Canvas Grid */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* Starter Canvases */}
                    <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Starter Themes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {starterCanvases.map((canvas) => (
                            <button
                                key={canvas.id}
                                onClick={() => handleApplyStarter(canvas.id)}
                                className={`group text-left p-3 rounded-xl border transition-all ${activeCanvasId === canvas.id
                                        ? 'border-accent ring-1 ring-accent/30'
                                        : 'border-border hover:border-accent/40'
                                    }`}
                                style={{ background: canvas.spec.tokens.colors.bg }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: canvas.spec.tokens.colors.accent }} />
                                    <div className="w-3 h-3 rounded-full" style={{ background: canvas.spec.tokens.colors.success }} />
                                    <div className="w-3 h-3 rounded-full" style={{ background: canvas.spec.tokens.colors.warning }} />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="h-2 rounded-full w-3/4" style={{ background: canvas.spec.tokens.colors.surface }} />
                                    <div className="h-2 rounded-full w-1/2" style={{ background: canvas.spec.tokens.colors.surface }} />
                                    <div className="h-2 rounded-full w-2/3" style={{ background: canvas.spec.tokens.colors.surface }} />
                                </div>
                                <p className="mt-3 text-xs font-medium" style={{ color: canvas.spec.tokens.colors.text }}>
                                    {canvas.name}
                                    {activeCanvasId === canvas.id && (
                                        <span className="ml-2 text-[10px] opacity-60">• Active</span>
                                    )}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* User Canvases */}
                    {userCanvases.length > 0 && (
                        <>
                            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Your Canvases</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {userCanvases.map((canvas) => (
                                    <div
                                        key={canvas.id}
                                        className={`group relative text-left p-3 rounded-xl border transition-all cursor-pointer ${activeCanvasId === canvas.id
                                                ? 'border-accent ring-1 ring-accent/30'
                                                : 'border-border hover:border-accent/40'
                                            }`}
                                        style={{ background: canvas.spec.tokens.colors.bg }}
                                        onClick={() => handleApplyUser(canvas.id)}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 rounded-full" style={{ background: canvas.spec.tokens.colors.accent }} />
                                            <div className="w-3 h-3 rounded-full" style={{ background: canvas.spec.tokens.colors.success }} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="h-2 rounded-full w-3/4" style={{ background: canvas.spec.tokens.colors.surface }} />
                                            <div className="h-2 rounded-full w-1/2" style={{ background: canvas.spec.tokens.colors.surface }} />
                                        </div>
                                        <p className="mt-3 text-xs font-medium" style={{ color: canvas.spec.tokens.colors.text }}>
                                            {canvas.name}
                                            {activeCanvasId === canvas.id && (
                                                <span className="ml-2 text-[10px] opacity-60">• Active</span>
                                            )}
                                        </p>

                                        {/* Actions */}
                                        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDuplicate(canvas.id); }}
                                                className="p-1 rounded bg-black/40 text-white/70 hover:text-white transition-colors"
                                                title="Duplicate"
                                            >
                                                <Copy size={10} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(canvas.id); }}
                                                className="p-1 rounded bg-black/40 text-white/70 hover:text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
