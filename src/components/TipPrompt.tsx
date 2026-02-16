import { X, Heart } from 'lucide-react';

const TIP_COUNT_KEY = 'sketchvibe_tip_count';
const TIP_DISMISSED_KEY = 'sketchvibe_tip_dismissed';
const STRIPE_LINK = 'https://buy.stripe.com/sketchvibe'; // Placeholder

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

    const count = getConversationCount();
    const dismissed = localStorage.getItem(TIP_DISMISSED_KEY);

    // Show every 3 conversations, but not if dismissed in last 3
    if (count > 0 && count % 3 === 0) {
        if (dismissed && parseInt(dismissed, 10) === count) return false;
        return true;
    }
    return false;
}

export default function TipPrompt({ onClose }: { onClose: () => void }) {
    const handleDismiss = () => {
        localStorage.setItem(TIP_DISMISSED_KEY, String(getConversationCount()));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={handleDismiss} />
            <div className="relative w-full max-w-sm glass rounded-xl p-6 animate-slide-up text-center">
                <button
                    onClick={handleDismiss}
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
                        href={STRIPE_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        Leave a Tip ☕
                    </a>
                    <button
                        onClick={handleDismiss}
                        className="w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}
