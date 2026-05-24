import { useEffect, useState, useCallback } from 'react';
import {
    Edit2, Trash2, Eye, Plus, Search,
    Star, TrendingUp, Loader2,
    ChevronLeft, ChevronRight, ImageIcon,
    Filter,
} from 'lucide-react';
import { postApi, IPaginatedPosts, PostType, PostStatus } from '../services/post';

const ACCENT        = '#FF8C00';
const ACCENT_BORDER = 'rgba(255,140,0,0.3)';
const ACCENT_MUTED  = 'rgba(255,140,0,0.1)';
const MONO          = '"Courier New", Courier, monospace';
const FONT          = 'Georgia, serif';

// ─── Self-contained theme hook ────────────────────────────────────────────────
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

interface PostManagerProps {
    onEdit:   (slug: string) => void;
    onCreate: () => void;
}

const TYPE_TABS: { label: string; value: PostType | '' }[] = [
    { label: 'All',      value: ''        },
    { label: 'Articles', value: 'article' },
    { label: 'Videos',   value: 'video'   },
    { label: 'Audio',    value: 'audio'   },
];

const TYPE_BADGE: Record<PostType, { label: string; color: string; bg: string }> = {
    article: { label: 'Article', color: '#7dd3fc', bg: 'rgba(125,211,252,0.1)' },
    video:   { label: 'Video',   color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)' },
    audio:   { label: 'Audio',   color: '#86efac', bg: 'rgba(134,239,172,0.1)' },
};

export default function PostManager({ onEdit, onCreate }: PostManagerProps) {
    const isDark = useTheme();

    const [data, setData]                   = useState<IPaginatedPosts | null>(null);
    const [loading, setLoading]             = useState(true);
    const [search, setSearch]               = useState('');
    const [page, setPage]                   = useState(1);
    const [statusFilter, setStatusFilter]   = useState<PostStatus | ''>('');
    const [typeFilter, setTypeFilter]       = useState<PostType | ''>('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ── Theme tokens — pure black or pure white only, no greys ───────────────
    const bg          = isDark ? '#0A0A0A' : '#F8F9FA';
    const cardBg      = isDark ? '#111111' : '#FFFFFF';
    const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const text        = isDark ? '#FFFFFF'  : '#000000';   // pure white / pure black
    const inputBg     = isDark ? '#0D0D0D'  : '#F0F0F0';
    const rowHover    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    const divider     = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await postApi.getAllPosts({
                page, limit: 12,
                status: statusFilter || undefined,
                type:   typeFilter   || undefined,
                ...(search.trim() ? { search: search.trim() } : {}),
            });
            setData(response);
        } catch {
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, typeFilter, search]);

    useEffect(() => {
        const timer = setTimeout(loadPosts, search ? 400 : 0);
        return () => clearTimeout(timer);
    }, [loadPosts]);

    const handleAction = async (id: string, action: () => Promise<any>) => {
        setActionLoading(id);
        try { await action(); await loadPosts(); }
        finally { setActionLoading(null); }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete this post permanently?')) return;
        handleAction(id, () => postApi.deletePost(id));
    };

    const resetPage = () => setPage(1);

    const total      = data?.total      ?? 0;
    const totalPages = data?.totalPages ?? 1;
    const posts      = data?.posts      ?? [];

    return (
        // Full-page background wrapper — covers any dark band from parent
        <div className="min-h-screen w-full space-y-6" style={{ backgroundColor: bg, padding: '0' }}>

            {/* ── Header Card ─────────────────────────────────────────────── */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

                    {/* Title */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {/* <div className="w-1 h-6 rounded-full" style={{ backgroundColor: ACCENT }} /> */}
                            <h2 className="text-2xl font-bold" style={{ color: text, fontFamily: FONT }}>
                                Post Manager
                            </h2>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] pl-3" style={{ color: text, fontFamily: MONO }}>
                            {total} {typeFilter ? typeFilter + 's' : 'total posts'}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-wrap">

                        {/* Type filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: text }} />
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value as PostType | ''); resetPage(); }}
                                className="appearance-none py-2.5 pl-9 pr-4 text-sm font-bold uppercase tracking-widest rounded-xl outline-none transition-all cursor-pointer"
                                style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                            >
                                {TYPE_TABS.map(tab => (
                                    <option key={tab.value} value={tab.value}>{tab.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: text }} />
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value as PostStatus | ''); resetPage(); }}
                                className="appearance-none py-2.5 pl-9 pr-4 text-sm font-bold uppercase tracking-widest rounded-xl outline-none transition-all cursor-pointer"
                                style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                            >
                                <option value="">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: text }} />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); resetPage(); }}
                                className="py-2.5 pl-9 pr-4 text-sm rounded-xl outline-none w-full md:w-56 transition-all"
                                style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                                onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                                onBlur={e  => (e.currentTarget.style.borderColor = border)}
                            />
                        </div>

                        {/* New Post */}
                        <button
                            onClick={onCreate}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:opacity-90 hover:scale-[1.02]"
                            style={{ backgroundColor: ACCENT, color: '#000000', fontFamily: MONO }}
                        >
                            <Plus size={15} strokeWidth={3} />
                            New Post
                        </button>
                    </div>
                </div>

                {/* Type Tabs */}
                <div className="flex gap-2 mt-5 pt-5" style={{ borderTop: `1px solid ${divider}` }}>
                    {TYPE_TABS.map(tab => {
                        const isActive = typeFilter === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => { setTypeFilter(tab.value as PostType | ''); resetPage(); }}
                                className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-200"
                                style={{
                                    backgroundColor: isActive ? ACCENT : ACCENT_MUTED,
                                    color: isActive ? '#000000' : text,
                                    fontFamily: MONO,
                                    border: `1px solid ${isActive ? ACCENT : 'transparent'}`,
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[720px]">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                {['Post', 'Type', 'Category', 'Status', 'Views', 'Pin', 'Actions'].map((h, i) => (
                                    <th
                                        key={h}
                                        className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] ${i === 4 || i === 5 ? 'text-center' : i === 6 ? 'text-right' : 'text-left'}`}
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
                                    <td colSpan={7} className="py-24 text-center">
                                        <Loader2 className="animate-spin inline" style={{ color: ACCENT }} size={24} />
                                    </td>
                                </tr>
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <p className="text-sm uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                            No posts found
                                        </p>
                                    </td>
                                </tr>
                            ) : posts.map((post, idx) => {
                                const badge = TYPE_BADGE[post.type];
                                return (
                                    <tr
                                        key={post._id}
                                        className="group transition-colors duration-150"
                                        style={{ borderBottom: idx < posts.length - 1 ? `1px solid ${divider}` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        {/* Post */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                                    style={{ backgroundColor: inputBg, border: `1px solid ${border}` }}
                                                >
                                                    {post.thumbnail
                                                        ? <img src={post.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                                                        : <ImageIcon size={15} style={{ color: text }} />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate max-w-[220px]" style={{ color: text, fontFamily: FONT }}>
                                                        {post.title}
                                                    </p>
                                                    <p className="text-xs mt-0.5 truncate max-w-[220px]" style={{ color: text, fontFamily: MONO, opacity: 0.5 }}>
                                                        /{post.slug}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="px-6 py-4">
                                            <span
                                                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
                                                style={{ color: badge.color, backgroundColor: badge.bg, fontFamily: MONO }}
                                            >
                                                {badge.label}
                                            </span>
                                        </td>

                                        {/* Category */}
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: post.category?.color || text, fontFamily: MONO }}>
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: post.category?.color || text }} />
                                                {post.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span
                                                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
                                                style={{ color: post.status === 'published' ? '#34d399' : '#f59e0b', fontFamily: MONO }}
                                            >
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: post.status === 'published' ? '#34d399' : '#f59e0b' }} />
                                                {post.status === 'published' ? 'Live' : 'Draft'}
                                            </span>
                                        </td>

                                        {/* Views */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5" style={{ color: text }}>
                                                <Eye size={14} />
                                                <span className="text-sm font-bold" style={{ fontFamily: MONO }}>
                                                    {post.viewsCount?.toLocaleString() ?? 0}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Pin */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    disabled={actionLoading === post._id + 'f'}
                                                    onClick={() => handleAction(post._id + 'f', () => postApi.toggleFeatured(post._id))}
                                                    className="p-2 rounded-lg transition-all duration-200"
                                                    style={{
                                                        backgroundColor: post.featured ? ACCENT_MUTED : 'transparent',
                                                        border: `1px solid ${post.featured ? ACCENT_BORDER : border}`,
                                                        color: post.featured ? ACCENT : text,
                                                    }}
                                                >
                                                    <Star size={15} fill={post.featured ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    disabled={actionLoading === post._id + 't'}
                                                    onClick={() => handleAction(post._id + 't', () => postApi.toggleTrending(post._id))}
                                                    className="p-2 rounded-lg transition-all duration-200"
                                                    style={{
                                                        backgroundColor: post.pinnedTrending ? 'rgba(56,189,248,0.1)' : 'transparent',
                                                        border: `1px solid ${post.pinnedTrending ? 'rgba(56,189,248,0.5)' : border}`,
                                                        color: post.pinnedTrending ? '#38bdf8' : text,
                                                    }}
                                                >
                                                    <TrendingUp size={15} />
                                                </button>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onEdit(post.slug)}
                                                    className="p-2 rounded-lg transition-all duration-200"
                                                    style={{ border: `1px solid ${border}`, color: text }}
                                                    onMouseEnter={e => {
                                                        (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT;
                                                    }}
                                                    onMouseLeave={e => {
                                                        (e.currentTarget as HTMLButtonElement).style.color = text;
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = border;
                                                    }}
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post._id)}
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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