import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Settings, Palette, Trash2, Pencil, Check, X, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConversations, createConversation, deleteConversation, renameConversation } from '../lib/hooks';

function timeGroup(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const day = 86400000;
    if (diff < day) return 'Today';
    if (diff < day * 2) return 'Yesterday';
    if (diff < day * 7) return 'Last 7 Days';
    if (diff < day * 30) return 'Last 30 Days';
    return 'Older';
}

export default function Sidebar() {
    const { activeConversationId, setActiveConversationId, sidebarOpen, setSidebarOpen, setActiveModal, activeProviderId, activeModelId } = useApp();
    const conversations = useConversations();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter((c) => c.title.toLowerCase().includes(q));
    }, [conversations, searchQuery]);

    const grouped = useMemo(() => {
        const groups: Record<string, typeof filteredConversations> = {};
        for (const conv of filteredConversations) {
            const group = timeGroup(conv.updatedAt);
            if (!groups[group]) groups[group] = [];
            groups[group].push(conv);
        }
        return groups;
    }, [filteredConversations]);

    const handleNewChat = async () => {
        const id = await createConversation(activeProviderId, activeModelId);
        setActiveConversationId(id);
    };

    const handleStartEdit = (id: string, title: string) => {
        setEditingId(id);
        setEditTitle(title);
    };

    const handleSaveEdit = async () => {
        if (editingId && editTitle.trim()) {
            await renameConversation(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        await deleteConversation(id);
        if (activeConversationId === id) {
            setActiveConversationId(null);
        }
        setDeletingId(null);
    };

    // Deep search — search message content
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) return;
        // For deep search, we could search messages too
        // But for now title search is sufficient for performance
    };

    const groupOrder = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Older'];

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`
          fixed md:relative z-50 top-0 left-0 h-full
          w-72 md:w-72 lg:w-80
          bg-bg-secondary border-r border-border
          flex flex-col
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'}
          ${!sidebarOpen ? 'md:hidden' : ''}
        `}
            >
                {/* Header */}
                <div className="p-3 flex flex-col gap-2 border-b border-border">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNewChat}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
                        >
                            <Plus size={16} />
                            <span>New Chat</span>
                        </button>
                        <button
                            onClick={() => setActiveModal('canvas-library')}
                            className="p-2.5 rounded-lg bg-bg-surface hover:bg-bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-colors"
                            title="Canvas Library"
                        >
                            <Palette size={16} />
                        </button>
                        <button
                            onClick={() => setActiveModal('settings')}
                            className="p-2.5 rounded-lg bg-bg-surface hover:bg-bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-colors"
                            title="Settings"
                        >
                            <Settings size={16} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search conversations…"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoComplete="off"
                            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto py-2">
                    {filteredConversations.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <MessageSquare size={32} className="mx-auto mb-3 text-text-tertiary" />
                            <p className="text-sm text-text-tertiary">
                                {searchQuery ? 'No conversations found' : 'No conversations yet'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={handleNewChat}
                                    className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors"
                                >
                                    Start your first chat
                                </button>
                            )}
                        </div>
                    ) : (
                        groupOrder.map((group) =>
                            grouped[group] ? (
                                <div key={group} className="mb-2">
                                    <div className="px-4 py-1.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                                        {group}
                                    </div>
                                    {grouped[group].map((conv) => (
                                        <div
                                            key={conv.id}
                                            className={`
                        group relative mx-2 rounded-lg cursor-pointer transition-colors
                        ${conv.id === activeConversationId
                                                    ? 'bg-accent-subtle border border-accent/20'
                                                    : 'hover:bg-bg-surface-hover border border-transparent'
                                                }
                      `}
                                            onClick={() => {
                                                if (editingId !== conv.id) {
                                                    setActiveConversationId(conv.id);
                                                }
                                            }}
                                        >
                                            <div className="px-3 py-2.5 flex items-center gap-2">
                                                {editingId === conv.id ? (
                                                    <div className="flex-1 flex items-center gap-1">
                                                        <input
                                                            ref={editInputRef}
                                                            type="text"
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEdit();
                                                                if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                            className="flex-1 px-2 py-0.5 text-sm bg-bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                                                            className="p-1 rounded text-success hover:bg-success-muted transition-colors"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                                            className="p-1 rounded text-text-secondary hover:bg-bg-surface-hover transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : deletingId === conv.id ? (
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <span className="flex-1 text-sm text-error">Delete?</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                                                            className="px-2 py-0.5 text-xs rounded bg-error text-white hover:bg-error/80 transition-colors"
                                                        >
                                                            Yes
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                                            className="px-2 py-0.5 text-xs rounded bg-bg-surface text-text-secondary hover:bg-bg-surface-hover transition-colors"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 text-sm text-text-primary truncate">
                                                            {conv.title}
                                                        </span>
                                                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleStartEdit(conv.id, conv.title); }}
                                                                className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-colors"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDeletingId(conv.id); }}
                                                                className="p-1 rounded text-text-tertiary hover:text-error hover:bg-error-muted transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border">
                    <button
                        onClick={() => setActiveModal('export-import')}
                        className="w-full text-xs text-text-tertiary hover:text-text-secondary text-center py-1.5 transition-colors"
                    >
                        Export / Import Data
                    </button>
                </div>
            </aside>
        </>
    );
}
