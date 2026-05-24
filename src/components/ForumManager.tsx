import React, { useEffect, useState, useCallback } from 'react';
import {
    Trash2, Eye, Search,
    Pin, Flame, Loader2,
    ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { forumService, IForumThread } from '../services/forum';

const ACCENT        = '#FF8C00';
const ACCENT_BORDER = 'rgba(255,140,0,0.3)';
const ACCENT_MUTED  = 'rgba(255,140,0,0.08)';
const MONO          = '"Courier New", Courier, monospace';
const FONT          = 'Georgia, serif';

// ─── Theme hook ───────────────────────────────────────────────────────────────
function useTheme() {
    const [isDark, setIsDark] = useState<boolean>(
        () => !document.documentElement.classList.contains('light-mode')
    );
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(!document.documentElement.classList.contains('light-mode'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    return isDark;
}

const CATEGORY_TABS = [
    { label: 'All Categories',    value: ''                 },
    { label: 'News',              value: 'News'             },
    { label: 'Rare Media',        value: 'Rare Media'       },
    { label: 'Music Discussion',  value: 'Music Discussion' },
    { label: 'Family',            value: 'Family'           },
    { label: 'Memories',          value: 'Memories'         },
    { label: 'Tribute',           value: 'Tribute'          },
];

interface ForumManagerProps {
    onView: (id: string) => void;
}

export default function ForumManager({ onView }: ForumManagerProps) {
    const isDark = useTheme();

    const bg       = isDark ? '#0A0A0A' : '#F8F9FA';
    const cardBg   = isDark ? '#111111' : '#FFFFFF';
    const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const text     = isDark ? '#FFFFFF'  : '#000000';
    const inputBg  = isDark ? '#0D0D0D'  : '#F0F0F0';
    const rowHover = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    const divider  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    const [threads,        setThreads]        = useState<IForumThread[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [page,           setPage]           = useState(1);
    const [totalPages,     setTotalPages]     = useState(1);
    const [search,         setSearch]         = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [actionId,       setActionId]       = useState<string | null>(null);

    const loadThreads = useCallback(async () => {
        setLoading(true);
        try {
            const data = await forumService.getThreads({
                page,
                limit: 12,
                category: activeCategory || undefined,
                search:   search         || undefined,
            });
            setThreads(data.threads);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            console.error('Failed to load threads:', err);
        } finally {
            setLoading(false);
        }
    }, [page, activeCategory, search]);

    useEffect(() => { loadThreads(); }, [loadThreads]);

    const handleTogglePin = async (id: string) => {
        setActionId(id);
        try {
            await forumService.togglePinThread(id);
            setThreads(prev => prev.map(t => t._id === id ? { ...t, pinned: !t.pinned } : t));
        } catch (err) { console.error(err); }
        finally { setActionId(null); }
    };

    const handleToggleHot = async (id: string) => {
        setActionId(id);
        try {
            await forumService.toggleHotThread(id);
            setThreads(prev => prev.map(t => t._id === id ? { ...t, hot: !t.hot } : t));
        } catch (err) { console.error(err); }
        finally { setActionId(null); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Soft-delete this thread? All replies will be hidden.')) return;
        try {
            await forumService.deleteThread(id);
            setThreads(prev => prev.filter(t => t._id !== id));
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen w-full space-y-6" style={{ backgroundColor: bg }}>

            {/* ── Header Bar ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

                    {/* Title */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {/* <div className="w-1 h-6 rounded-full" style={{ backgroundColor: ACCENT }} /> */}
                            <h2 className="text-2xl font-bold" style={{ color: text, fontFamily: FONT }}>
                                Forum Moderation
                            </h2>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] pl-3" style={{ color: text, fontFamily: MONO }}>
                            Manage community discussions and visibility
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-wrap">

                        {/* Category filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: text }} />
                            <select
                                value={activeCategory}
                                onChange={(e) => { setActiveCategory(e.target.value); setPage(1); }}
                                className="appearance-none py-2.5 pl-9 pr-4 text-sm font-bold uppercase tracking-widest rounded-xl outline-none transition-all cursor-pointer"
                                style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                            >
                                {CATEGORY_TABS.map(tab => (
                                    <option key={tab.value} value={tab.value}>{tab.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: text }} />
                            <input
                                type="text"
                                placeholder="Search discussions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="py-2.5 pl-9 pr-4 text-sm rounded-xl outline-none w-full md:w-56 transition-all"
                                style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                                onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                                onBlur={e  => (e.currentTarget.style.borderColor = border)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                {['Discussion', 'Author', 'Engagement', 'Actions'].map((h, i) => (
                                    <th
                                        key={h}
                                        className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] ${i === 2 ? 'text-center' : i === 3 ? 'text-right' : 'text-left'}`}
                                        style={{ color: text, fontFamily: MONO }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <Loader2 className="animate-spin inline" style={{ color: ACCENT }} size={24} />
                                    </td>
                                </tr>
                            ) : threads.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <p className="text-sm uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                            No discussions found
                                        </p>
                                    </td>
                                </tr>
                            ) : threads.map((thread, idx) => (
                                <tr
                                    key={thread._id}
                                    className="group transition-colors duration-150"
                                    style={{ borderBottom: idx < threads.length - 1 ? `1px solid ${divider}` : 'none' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    {/* Discussion */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            {/* Status icons */}
                                            <div className="mt-0.5 flex flex-col gap-1 shrink-0">
                                                {thread.pinned && <Pin size={13} style={{ color: ACCENT }} fill={ACCENT} />}
                                                {thread.hot    && <Flame size={13} style={{ color: '#EF4444' }} fill="#EF4444" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate max-w-[280px]" style={{ color: text, fontFamily: FONT }}>
                                                    {thread.title}
                                                </p>
                                                <p className="text-xs mt-0.5 font-bold uppercase tracking-wider" style={{ color: text, fontFamily: MONO, opacity: 0.5 }}>
                                                    {thread.category} · {new Date(thread.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Author */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={thread.author.avatar}
                                                className="w-7 h-7 rounded-full object-cover border"
                                                style={{ borderColor: border }}
                                                alt=""
                                            />
                                            <span className="text-sm font-bold" style={{ color: text, fontFamily: MONO }}>
                                                @{thread.author.username}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Engagement */}
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-6">
                                            <div className="text-center">
                                                <p className="text-sm font-black" style={{ color: text, fontFamily: MONO }}>
                                                    {thread.replyCount}
                                                </p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: text, fontFamily: MONO, opacity: 0.5 }}>
                                                    Replies
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black" style={{ color: text, fontFamily: MONO }}>
                                                    {thread.viewCount}
                                                </p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: text, fontFamily: MONO, opacity: 0.5 }}>
                                                    Views
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">

                                            {/* Pin */}
                                            <button
                                                onClick={() => handleTogglePin(thread._id)}
                                                disabled={actionId === thread._id}
                                                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-40"
                                                style={{
                                                    border: `1px solid ${thread.pinned ? ACCENT_BORDER : border}`,
                                                    backgroundColor: thread.pinned ? ACCENT_MUTED : 'transparent',
                                                    color: thread.pinned ? ACCENT : text,
                                                }}
                                                onMouseEnter={e => {
                                                    if (!thread.pinned) {
                                                        (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT_BORDER;
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!thread.pinned) {
                                                        (e.currentTarget as HTMLButtonElement).style.color = text;
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = border;
                                                    }
                                                }}
                                            >
                                                {actionId === thread._id
                                                    ? <Loader2 size={15} className="animate-spin" />
                                                    : <Pin size={15} fill={thread.pinned ? ACCENT : 'none'} />
                                                }
                                            </button>

                                            {/* Hot */}
                                            <button
                                                onClick={() => handleToggleHot(thread._id)}
                                                disabled={actionId === thread._id}
                                                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-40"
                                                style={{
                                                    border: `1px solid ${thread.hot ? 'rgba(239,68,68,0.4)' : border}`,
                                                    backgroundColor: thread.hot ? 'rgba(239,68,68,0.08)' : 'transparent',
                                                    color: thread.hot ? '#EF4444' : text,
                                                }}
                                                onMouseEnter={e => {
                                                    if (!thread.hot) {
                                                        (e.currentTarget as HTMLButtonElement).style.color = '#EF4444';
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!thread.hot) {
                                                        (e.currentTarget as HTMLButtonElement).style.color = text;
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = border;
                                                    }
                                                }}
                                            >
                                                {actionId === thread._id
                                                    ? <Loader2 size={15} className="animate-spin" />
                                                    : <Flame size={15} fill={thread.hot ? '#EF4444' : 'none'} />
                                                }
                                            </button>

                                            {/* View */}
                                            <button
                                                onClick={() => onView(thread._id)}
                                                className="p-2 rounded-lg transition-all duration-200"
                                                style={{ border: `1px solid ${border}`, color: text }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
                                                    (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT_BORDER;
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLButtonElement).style.color = text;
                                                    (e.currentTarget as HTMLButtonElement).style.borderColor = border;
                                                }}
                                            >
                                                <Eye size={15} />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(thread._id)}
                                                className="p-2 rounded-lg transition-all duration-200"
                                                style={{ border: `1px solid ${border}`, color: text }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                                                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#f87171';
                                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(248,113,113,0.1)';
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLButtonElement).style.color = text;
                                                    (e.currentTarget as HTMLButtonElement).style.borderColor = border;
                                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ──────────────────────────────────────────────── */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${divider}` }}>
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: text, fontFamily: MONO }}>
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-xl transition-all duration-200 disabled:opacity-30"
                            style={{ border: `1px solid ${border}`, color: text }}
                            onMouseEnter={e => { if (page !== 1) (e.currentTarget as HTMLButtonElement).style.color = ACCENT; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = text; }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-xl transition-all duration-200 disabled:opacity-30"
                            style={{ border: `1px solid ${border}`, color: text }}
                            onMouseEnter={e => { if (page < totalPages) (e.currentTarget as HTMLButtonElement).style.color = ACCENT; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = text; }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}