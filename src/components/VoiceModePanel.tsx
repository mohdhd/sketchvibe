import { useState, useRef, useCallback } from 'react';
import { Mic, X, Loader2 } from 'lucide-react';
import { getApiKey, getVoiceApiKey, getSTTProvider } from '../lib/providers';
import { startRecording, transcribeWhisper, transcribeElevenLabs } from '../lib/voice/stt';

interface VoiceModePanelProps {
    onResult: (transcript: string) => void;
    onExit: () => void;
}

type VoiceState = 'idle' | 'recording' | 'processing';

export default function VoiceModePanel({ onResult, onExit }: VoiceModePanelProps) {
    const [state, setState] = useState<VoiceState>('idle');
    const stopRef = useRef<(() => Promise<Blob>) | null>(null);

    const sttProvider = getSTTProvider();
    const apiKey = sttProvider === 'whisper'
        ? getApiKey('openai')
        : getVoiceApiKey('stt', 'elevenlabs');

    const handlePointerDown = useCallback(async () => {
        if (state !== 'idle' || !apiKey) return;
        try {
            const recorder = await startRecording();
            stopRef.current = recorder.stop;
            setState('recording');
        } catch (err) {
            console.error('Mic access error:', err);
        }
    }, [state, apiKey]);

    const handlePointerUp = useCallback(async () => {
        if (state !== 'recording' || !stopRef.current || !apiKey) return;
        setState('processing');
        try {
            const blob = await stopRef.current();
            stopRef.current = null;

            const text = sttProvider === 'whisper'
                ? await transcribeWhisper(blob, apiKey)
                : await transcribeElevenLabs(blob, apiKey);

            if (text) {
                onResult(text);
            }
        } catch (err) {
            console.error('STT error:', err);
        } finally {
            setState('idle');
        }
    }, [state, sttProvider, apiKey, onResult]);

    return (
        <div className="voice-mode-panel">
            {/* Exit button */}
            <button
                onClick={onExit}
                className="voice-mode-exit"
                title="Back to text input"
            >
                <X size={18} />
            </button>

            {/* Status text */}
            <span className="voice-mode-label">
                {state === 'idle' && 'Hold to talk'}
                {state === 'recording' && 'Listening…'}
                {state === 'processing' && 'Processing…'}
            </span>

            {/* Big mic button */}
            <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={state === 'recording' ? handlePointerUp : undefined}
                disabled={state === 'processing' || !apiKey}
                className={`voice-mode-mic ${state === 'recording' ? 'voice-mode-mic-active' : ''}`}
            >
                {state === 'processing' ? (
                    <Loader2 size={28} className="animate-spin" />
                ) : (
                    <Mic size={28} />
                )}
                {state === 'recording' && (
                    <>
                        <span className="voice-pulse-ring voice-pulse-ring-1" />
                        <span className="voice-pulse-ring voice-pulse-ring-2" />
                        <span className="voice-pulse-ring voice-pulse-ring-3" />
                    </>
                )}
            </button>
        </div>
    );
}
