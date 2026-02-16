let currentAudio: HTMLAudioElement | null = null;
let playbackCancelled = false;

export function stopPlayback() {
    playbackCancelled = true;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

/** Split text into chunks that fit within API limits */
function chunkText(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLen) {
            chunks.push(remaining);
            break;
        }

        // Try to split at sentence boundary
        let splitAt = -1;
        const searchRange = remaining.slice(0, maxLen);

        // Look for last sentence-ending punctuation
        for (let i = searchRange.length - 1; i >= Math.max(0, maxLen - 500); i--) {
            if (searchRange[i] === '.' || searchRange[i] === '!' || searchRange[i] === '?') {
                splitAt = i + 1;
                break;
            }
        }

        // Fallback: split at last space
        if (splitAt === -1) {
            splitAt = searchRange.lastIndexOf(' ');
        }

        // Last resort: hard split
        if (splitAt <= 0) {
            splitAt = maxLen;
        }

        chunks.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(splitAt).trim();
    }

    return chunks.filter(c => c.length > 0);
}

/** Play a single audio blob and return a promise that resolves when done */
function playAudioBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudio = audio;

        audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            resolve();
        };
        audio.onerror = (e) => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            reject(e);
        };

        audio.play().catch(reject);
    });
}

/** Fetch a single OpenAI TTS chunk */
async function fetchOpenAIChunk(chunk: string, apiKey: string, voice: string): Promise<Blob> {
    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: 'tts-1', input: chunk, voice }),
    });
    if (!resp.ok) throw new Error(`OpenAI TTS error (${resp.status})`);
    return resp.blob();
}

/** Fetch a single ElevenLabs TTS chunk */
async function fetchElevenLabsChunk(chunk: string, apiKey: string, voiceId: string): Promise<Blob> {
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
        },
        body: JSON.stringify({
            text: chunk,
            model_id: 'eleven_multilingual_v2',
        }),
    });
    if (!resp.ok) throw new Error(`ElevenLabs TTS error (${resp.status})`);
    return resp.blob();
}

/**
 * Play chunks with prefetch-ahead:
 *  1. Fetch chunk 0 → fire onFirstChunkReady → start playing
 *  2. While chunk N plays, fetch chunk N+1 in parallel
 *  3. When N ends, N+1 is likely already cached → play immediately
 */
async function playWithPrefetch(
    chunks: string[],
    fetchFn: (chunk: string) => Promise<Blob>,
    onFirstChunkReady?: () => void
): Promise<void> {
    if (chunks.length === 0) return;

    // Fetch first chunk
    let nextBlobPromise: Promise<Blob> | null = fetchFn(chunks[0]);
    let firstChunkBlob = await nextBlobPromise;

    if (playbackCancelled) return;

    // Signal that audio is about to start
    onFirstChunkReady?.();

    for (let i = 0; i < chunks.length; i++) {
        if (playbackCancelled) break;

        const blob = i === 0 ? firstChunkBlob : await nextBlobPromise!;
        if (playbackCancelled) break;

        // Kick off prefetch of the next chunk while current one plays
        nextBlobPromise = (i + 1 < chunks.length)
            ? fetchFn(chunks[i + 1])
            : null;

        await playAudioBlob(blob);
    }
}

export async function speakOpenAI(
    text: string,
    apiKey: string,
    voice: string = 'alloy',
    onFirstChunkReady?: () => void
): Promise<void> {
    stopPlayback();
    playbackCancelled = false;

    const chunks = chunkText(text, 4000);
    const fetchFn = (chunk: string) => fetchOpenAIChunk(chunk, apiKey, voice);

    await playWithPrefetch(chunks, fetchFn, onFirstChunkReady);
}

export async function speakElevenLabs(
    text: string,
    apiKey: string,
    voiceId: string = 'EXAVITQu4vr4xnSDxMaL',
    onFirstChunkReady?: () => void
): Promise<void> {
    stopPlayback();
    playbackCancelled = false;

    const chunks = chunkText(text, 5000);
    const fetchFn = (chunk: string) => fetchElevenLabsChunk(chunk, apiKey, voiceId);

    await playWithPrefetch(chunks, fetchFn, onFirstChunkReady);
}
