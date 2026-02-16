import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db, type Conversation, type Message, type Canvas, type CanvasSpec } from './db';

// ─── Conversation Hooks ───

export function useConversations() {
    return useLiveQuery(
        () => db.conversations.orderBy('updatedAt').reverse().toArray(),
        [],
        []
    );
}

export function useConversation(id: string | null) {
    return useLiveQuery(
        () => (id ? db.conversations.get(id) : undefined),
        [id],
        undefined
    );
}

export function useMessages(conversationId: string | null) {
    return useLiveQuery(
        () =>
            conversationId
                ? db.messages.where('conversationId').equals(conversationId).sortBy('createdAt')
                : [],
        [conversationId],
        []
    );
}

export function useCanvases() {
    return useLiveQuery(
        () => db.canvases.orderBy('updatedAt').reverse().toArray(),
        [],
        []
    );
}

// ─── Conversation CRUD ───

export async function createConversation(
    providerId: string = 'openai',
    modelId: string = 'gpt-4o'
): Promise<string> {
    const id = nanoid();
    const now = Date.now();
    await db.conversations.add({
        id,
        title: 'New Chat',
        createdAt: now,
        updatedAt: now,
        canvasId: null,
        providerId,
        modelId,
        webSearchEnabled: false,
    });
    return id;
}

export async function deleteConversation(id: string) {
    await db.transaction('rw', [db.conversations, db.messages], async () => {
        await db.messages.where('conversationId').equals(id).delete();
        await db.conversations.delete(id);
    });
}

export async function renameConversation(id: string, title: string) {
    await db.conversations.update(id, { title, updatedAt: Date.now() });
}

export async function updateConversation(id: string, updates: Partial<Conversation>) {
    await db.conversations.update(id, { ...updates, updatedAt: Date.now() });
}

// ─── Message CRUD ───

export async function addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    sources?: Message['sources'],
    attachments?: Message['attachments']
): Promise<string> {
    const id = nanoid();
    await db.messages.add({
        id,
        conversationId,
        role,
        content,
        attachments,
        sources,
        createdAt: Date.now(),
    });
    await db.conversations.update(conversationId, { updatedAt: Date.now() });
    return id;
}

export async function updateMessage(id: string, content: string, sources?: Message['sources']) {
    const updates: Partial<Message> = { content };
    if (sources !== undefined) updates.sources = sources;
    await db.messages.update(id, updates);
}

export async function deleteAllMessages(conversationId: string) {
    await db.messages.where('conversationId').equals(conversationId).delete();
}

// ─── Auto-title ───

export async function autoTitleConversation(conversationId: string, firstMessage: string) {
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '…' : '');
    await renameConversation(conversationId, title);
}

// ─── Canvas CRUD ───

export async function saveCanvas(name: string, spec: CanvasSpec): Promise<string> {
    const id = nanoid();
    const now = Date.now();
    await db.canvases.add({ id, name, spec, createdAt: now, updatedAt: now });
    return id;
}

export async function updateCanvas(id: string, updates: Partial<Canvas>) {
    await db.canvases.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteCanvas(id: string) {
    await db.canvases.delete(id);
}

export async function duplicateCanvas(id: string): Promise<string | null> {
    const canvas = await db.canvases.get(id);
    if (!canvas) return null;
    return saveCanvas(`${canvas.name} (Copy)`, canvas.spec);
}
