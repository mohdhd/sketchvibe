import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { getApiKey, getVoiceApiKey, getSTTProvider } from '../lib/providers';
import { startRecording, transcribeWhisper, transcribeElevenLabs } from '../lib/voice/stt';

interface VoiceButtonProps {
    onResult: (transcript: string) => void;
}

export default function VoiceButton({ onResult }: VoiceButtonProps) {
    const [recording, setRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const stopRef = useRef<(() => Promise<Blob>) | null>(null);

    const sttProvider = getSTTProvider();
    const apiKey = sttProvider === 'whisper'
        ? getApiKey('openai')
        : getVoiceApiKey('stt', 'elevenlabs');

    if (!apiKey) return null;

    const handleToggle = async () => {
        if (processing) return;

        if (recording) {
            // Stop recording
            setRecording(false);
            if (stopRef.current) {
                setProcessing(true);
                try {
                    const blob = await stopRef.current();
                    stopRef.current = null;

                    const text = sttProvider === 'whisper'
                        ? await transcribeWhisper(blob, apiKey)
                        : await transcribeElevenLabs(blob, apiKey);

                    if (text) onResult(text);
                } catch (err) {
                    console.error('STT error:', err);
                } finally {
                    setProcessing(false);
                }
            }
        } else {
            // Start recording
            try {
                const recorder = await startRecording();
                stopRef.current = recorder.stop;
                setRecording(true);
            } catch (err) {
                console.error('Mic access error:', err);
            }
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={processing}
            className={`p-1.5 rounded-md transition-all ${recording
                    ? 'text-error bg-error-muted animate-pulse-glow'
                    : processing
                        ? 'text-text-tertiary'
                        : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover'
                }`}
            title={recording ? 'Stop recording' : processing ? 'Processing…' : 'Voice input'}
        >
            {processing ? (
                <Loader2 size={14} className="animate-spin" />
            ) : recording ? (
                <MicOff size={14} />
            ) : (
                <Mic size={14} />
            )}
        </button>
    );
}
