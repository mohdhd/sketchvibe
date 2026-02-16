import { db } from './db';

export async function exportAllData(): Promise<void> {
    const [conversations, messages, canvases] = await Promise.all([
        db.conversations.toArray(),
        db.messages.toArray(),
        db.canvases.toArray(),
    ]);

    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        conversations,
        messages,
        canvases,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sketchvibe-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export async function importAllData(file: File): Promise<{ imported: number; skipped: number }> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.version || !data.conversations || !data.messages) {
        throw new Error('Invalid SketchVibe export file');
    }

    let imported = 0;
    let skipped = 0;

    await db.transaction('rw', [db.conversations, db.messages, db.canvases], async () => {
        for (const conv of data.conversations) {
            const existing = await db.conversations.get(conv.id);
            if (existing) { skipped++; continue; }
            await db.conversations.add(conv);
            imported++;
        }

        for (const msg of data.messages) {
            const existing = await db.messages.get(msg.id);
            if (existing) continue;
            await db.messages.add(msg);
        }

        if (data.canvases) {
            for (const canvas of data.canvases) {
                const existing = await db.canvases.get(canvas.id);
                if (existing) continue;
                await db.canvases.add(canvas);
            }
        }
    });

    return { imported, skipped };
}

export async function clearAllData(): Promise<void> {
    await db.transaction('rw', [db.conversations, db.messages, db.canvases], async () => {
        await db.conversations.clear();
        await db.messages.clear();
        await db.canvases.clear();
    });
}
