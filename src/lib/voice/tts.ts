let currentAudio: HTMLAudioElement | null = null;

export function stopPlayback() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

export async function speakOpenAI(
    text: string,
    apiKey: string,
    voice: string = 'alloy'
): Promise<HTMLAudioElement> {
    stopPlayback();

    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: 'tts-1', input: text, voice }),
    });

    if (!resp.ok) throw new Error(`OpenAI TTS error (${resp.status})`);

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
    };

    await audio.play();
    return audio;
}

export async function speakElevenLabs(
    text: string,
    apiKey: string,
    voiceId: string = 'EXAVITQu4vr4xnSDxMaL'
): Promise<HTMLAudioElement> {
    stopPlayback();

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
        },
        body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
        }),
    });

    if (!resp.ok) throw new Error(`ElevenLabs TTS error (${resp.status})`);

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
    };

    await audio.play();
    return audio;
}
