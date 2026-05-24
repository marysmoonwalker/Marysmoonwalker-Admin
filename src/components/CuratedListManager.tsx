import React, { useEffect, useState } from 'react';
import {
    Star, TrendingUp, ArrowUpRight, Award,
    Loader2, Flame, Eye, ImageIcon
} from 'lucide-react';
import { postApi, IPost } from '../services/post';

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

export default function CuratedListManager() {
    const isDark = useTheme();

    const bg       = isDark ? '#0A0A0A' : '#F8F9FA';
    const cardBg   = isDark ? '#111111' : '#FFFFFF';
    const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const text     = isDark ? '#FFFFFF'  : '#000000';
    const inputBg  = isDark ? '#0D0D0D'  : '#F0F0F0';
    const rowHover = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    const divider  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    const [activeTab,      setActiveTab]      = useState<'featured' | 'trending'>('featured');
    const [featuredPosts,  setFeaturedPosts]  = useState<IPost[]>([]);
    const [trendingPosts,  setTrendingPosts]  = useState<IPost[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [actionId,       setActionId]       = useState<string | null>(null);

    useEffect(() => { loadCuratedData(); }, []);

    const loadCuratedData = async () => {
        setLoading(true);
        try {
            const [featured, trending] = await Promise.all([
                postApi.getFeaturedPosts(),
                postApi.getTrendingPosts(),
            ]);
            setFeaturedPosts(featured);
            setTrendingPosts(trending);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleToggleFeatured = async (id: string) => {
        setActionId(id);
        try { await postApi.toggleFeatured(id); await loadCuratedData(); }
        catch (err) { console.error(err); }
        finally { setActionId(null); }
    };

    const handleToggleTrending = async (id: string) => {
        setActionId(id);
        try { await postApi.toggleTrending(id); await loadCuratedData(); }
        catch (err) { console.error(err); }
        finally { setActionId(null); }
    };

    const currentPosts = activeTab === 'featured' ? featuredPosts : trendingPosts;

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
                                Curation Hub
                            </h2>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] pl-3" style={{ color: text, fontFamily: MONO }}>
                            Algorithm overrides · {currentPosts.length} streams flagged
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div
                        className="flex items-center gap-1 p-1 rounded-xl"
                        style={{ backgroundColor: inputBg, border: `1px solid ${border}` }}
                    >
                        {(['featured', 'trending'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200"
                                style={{
                                    backgroundColor: activeTab === tab ? ACCENT : 'transparent',
                                    color: activeTab === tab ? '#000000' : text,
                                    fontFamily: MONO,
                                }}
                            >
                                {tab === 'featured' ? <Award size={13} /> : <Flame size={13} />}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                {activeTab === 'trending' && (
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-left w-16" style={{ color: text, fontFamily: MONO }}>
                                        Rank
                                    </th>
                                )}
                                {['Post', 'Category', ...(activeTab === 'trending' ? ['Views', 'Score'] : []), 'Action'].map((h, i) => {
                                    const isRight = h === 'Action' || h === 'Views' || h === 'Score';
                                    return (
                                        <th
                                            key={h}
                                            className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] ${isRight ? 'text-right' : 'text-left'}`}
                                            style={{ color: text, fontFamily: MONO }}
                                        >
                                            {h}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={activeTab === 'trending' ? 6 : 3} className="py-24 text-center">
                                        <Loader2 className="animate-spin inline" style={{ color: ACCENT }} size={24} />
                                    </td>
                                </tr>
                            ) : currentPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === 'trending' ? 6 : 3} className="py-24 text-center">
                                        <p className="text-sm uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                            No {activeTab} posts found
                                        </p>
                                    </td>
                                </tr>
                            ) : currentPosts.map((post, idx) => (
                                <tr
                                    key={post._id}
                                    className="group transition-colors duration-150"
                                    style={{ borderBottom: idx < currentPosts.length - 1 ? `1px solid ${divider}` : 'none' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    {/* Rank (trending only) */}
                                    {activeTab === 'trending' && (
                                        <td className="px-6 py-4">
                                            <span
                                                className="text-sm font-black"
                                                style={{ color: idx < 3 ? ACCENT : text, fontFamily: MONO }}
                                            >
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                        </td>
                                    )}

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
                                                <p className="text-sm font-bold truncate max-w-[280px]" style={{ color: text, fontFamily: FONT }}>
                                                    {post.title}
                                                </p>
                                                <p className="text-xs mt-0.5 font-bold uppercase" style={{ color: text, fontFamily: MONO, opacity: 0.5 }}>
                                                    {post.type}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="px-6 py-4">
                                        <span
                                            className="inline-flex items-center gap-1.5 text-sm font-bold"
                                            style={{ color: post.category?.color || text, fontFamily: MONO }}
                                        >
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: post.category?.color || text }} />
                                            {post.category?.name || 'Uncategorized'}
                                        </span>
                                    </td>

                                    {/* Views (trending only) */}
                                    {activeTab === 'trending' && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5" style={{ color: text }}>
                                                <Eye size={14} />
                                                <span className="text-sm font-bold" style={{ fontFamily: MONO }}>
                                                    {post.viewsCount?.toLocaleString() ?? 0}
                                                </span>
                                            </div>
                                        </td>
                                    )}

                                    {/* Score (trending only) */}
                                    {activeTab === 'trending' && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <ArrowUpRight size={14} style={{ color: '#34d399' }} />
                                                <span className="text-sm font-black" style={{ color: ACCENT, fontFamily: MONO }}>
                                                    {post.trendingScore?.toFixed(0) ?? 0}
                                                </span>
                                            </div>
                                        </td>
                                    )}

                                    {/* Action */}
                                    <td className="px-6 py-4 text-right">
                                        {activeTab === 'featured' ? (
                                            <button
                                                onClick={() => handleToggleFeatured(post._id)}
                                                disabled={actionId === post._id}
                                                title="Remove from Featured"
                                                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-40 ml-auto flex items-center justify-center"
                                                style={{
                                                    border: `1px solid ${ACCENT_BORDER}`,
                                                    backgroundColor: ACCENT_MUTED,
                                                    color: ACCENT,
                                                }}
                                            >
                                                {actionId === post._id
                                                    ? <Loader2 size={15} className="animate-spin" />
                                                    : <Star size={15} fill={ACCENT} />
                                                }
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleTrending(post._id)}
                                                disabled={actionId === post._id}
                                                title={post.pinnedTrending ? 'Unpin from Trending' : 'Pin to Trending'}
                                                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-40 ml-auto flex items-center justify-center"
                                                style={{
                                                    border: `1px solid ${post.pinnedTrending ? ACCENT_BORDER : border}`,
                                                    backgroundColor: post.pinnedTrending ? ACCENT_MUTED : 'transparent',
                                                    color: post.pinnedTrending ? ACCENT : text,
                                                }}
                                                onMouseEnter={e => {
                                                    if (!post.pinnedTrending) {
                                                        (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT_BORDER;
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!post.pinnedTrending) {
                                                        (e.currentTarget as HTMLButtonElement).style.color = text;
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = border;
                                                    }
                                                }}
                                            >
                                                {actionId === post._id
                                                    ? <Loader2 size={15} className="animate-spin" />
                                                    : <TrendingUp size={15} strokeWidth={post.pinnedTrending ? 2.5 : 1.5} />
                                                }
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}