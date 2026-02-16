import Dexie, { type Table } from 'dexie';

export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    canvasId: string | null;
    providerId: string;
    modelId: string;
    webSearchEnabled: boolean;
}

export interface Attachment {
    type: 'image' | 'file';
    name: string;
    mimeType: string;
    dataUrl: string; // data:mime;base64,...
}

export interface Message {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: Attachment[];
    sources?: SearchSource[];
    createdAt: number;
}

export interface Canvas {
    id: string;
    name: string;
    spec: CanvasSpec;
    createdAt: number;
    updatedAt: number;
}

export interface SearchSource {
    title: string;
    url: string;
    content: string;
    score?: number;
}

export interface CanvasSpec {
    tokens: {
        colors: Record<string, string>;
        typography: {
            fontFamily: string;
            fontFamilyMono: string;
            scale: Record<string, string>;
        };
        spacing: Record<string, string>;
        radius: Record<string, string>;
        shadows: Record<string, string>;
    };
    components: {
        card: Record<string, string>;
        callout: Record<string, Record<string, string>>;
        table: Record<string, string>;
        codeBlock: Record<string, string>;
        input: Record<string, string>;
        button: Record<string, Record<string, string>>;
    };
    decorations?: {
        backgroundGradient?: string;
        backgroundPattern?: 'dots' | 'grid' | 'none';
        messageGlow?: boolean;
        animatedAccents?: boolean;
    };
}

class SketchVibeDB extends Dexie {
    conversations!: Table<Conversation>;
    messages!: Table<Message>;
    canvases!: Table<Canvas>;

    constructor() {
        super('sketchvibe-db');
        this.version(1).stores({
            conversations: 'id, updatedAt',
            messages: 'id, conversationId, createdAt',
            canvases: 'id, updatedAt',
        });
    }
}

export const db = new SketchVibeDB();
