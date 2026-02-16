export async function startRecording(): Promise<{ stop: () => Promise<Blob> }> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.start();

    return {
        stop: () =>
            new Promise<Blob>((resolve) => {
                mediaRecorder.onstop = () => {
                    stream.getTracks().forEach((t) => t.stop());
                    resolve(new Blob(chunks, { type: 'audio/webm' }));
                };
                mediaRecorder.stop();
            }),
    };
}

export async function transcribeWhisper(blob: Blob, apiKey: string): Promise<string> {
    const form = new FormData();
    form.append('file', blob, 'audio.webm');
    form.append('model', 'whisper-1');

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
    });

    if (!resp.ok) throw new Error(`Whisper error (${resp.status})`);
    const data = await resp.json();
    return data.text || '';
}

export async function transcribeElevenLabs(blob: Blob, apiKey: string): Promise<string> {
    const form = new FormData();
    form.append('file', blob, 'audio.webm');
    form.append('model_id', 'scribe_v1');

    const resp = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form,
    });

    if (!resp.ok) throw new Error(`ElevenLabs STT error (${resp.status})`);
    const data = await resp.json();
    return data.text || '';
}
