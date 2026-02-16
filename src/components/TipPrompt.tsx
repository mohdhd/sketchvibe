import { X, Heart } from 'lucide-react';

const TIP_COUNT_KEY = 'sketchvibe_tip_count';
const TIP_CLICKED_KEY = 'sketchvibe_tip_clicked';
const TIP_LINK = 'https://buymeacoffee.com/soloforge';

function getConversationCount(): number {
    return parseInt(localStorage.getItem(TIP_COUNT_KEY) || '0', 10);
}

export function incrementTipCounter() {
    const count = getConversationCount() + 1;
    localStorage.setItem(TIP_COUNT_KEY, String(count));
}

export function shouldShowTip(): boolean {
    // Only show in hosted mode
    if (import.meta.env.VITE_SELF_HOSTED === 'true') return false;

    // Never show again once they've clicked the tip link
    if (localStorage.getItem(TIP_CLICKED_KEY) === 'true') return false;

    const count = getConversationCount();

    // Start showing after 3 conversations, then every 3rd conversation
    return count > 0 && count % 3 === 0;
}

export default function TipPrompt({ onClose }: { onClose: () => void }) {
    const handleTipClick = () => {
        // Mark as clicked — never show again
        localStorage.setItem(TIP_CLICKED_KEY, 'true');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-sm glass rounded-xl p-6 animate-slide-up text-center">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="w-12 h-12 rounded-full bg-error-muted flex items-center justify-center mx-auto mb-4">
                    <Heart size={24} className="text-error" />
                </div>

                <h3 className="text-base font-semibold text-text-primary mb-2">Enjoying SketchVibe?</h3>
                <p className="text-sm text-text-secondary mb-5">
                    SketchVibe is free and open source. Your tips help keep it running and growing.
                </p>

                <div className="space-y-2">
                    <a
                        href={TIP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleTipClick}
                        className="block w-full px-4 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        Buy Me a Coffee ☕
                    </a>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}
