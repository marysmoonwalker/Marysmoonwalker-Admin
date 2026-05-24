import React, { useState, useEffect, useRef } from 'react';
import {
    Trash2, Image as ImageIcon, Save, X, Loader2,
    ChevronDown, AlignLeft, Film, Mic, FileText,
    Video, Music, Link, Info, Hash,
} from 'lucide-react';
import { postApi, ICategory, IPostSection, PostType, PostStatus, EmbedType } from '../services/post';

const ACCENT        = '#FF8C00';
const ACCENT_BORDER = 'rgba(255,140,0,0.3)';
const ACCENT_MUTED  = 'rgba(255,140,0,0.08)';
const MONO          = '"Courier New", Courier, monospace';
const FONT          = 'Georgia, serif';

/* ─── Theme hook ─────────────────────────────────────────────────────────── */
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

/* ─── Label — defined OUTSIDE to prevent remount on re-render ───────────── */
const Label = ({ children, color }: { children: React.ReactNode; color: string }) => (
    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color, fontFamily: MONO }}>
        {children}
    </p>
);

/* ─── Card — defined OUTSIDE to prevent remount on re-render ────────────── */
const Card = ({
    children, className = '', bg, border,
}: {
    children: React.ReactNode; className?: string; bg: string; border: string;
}) => (
    <div className={`rounded-2xl p-5 sm:p-6 ${className}`} style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
        {children}
    </div>
);

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface PostEditorProps {
    postSlug?: string;
    onSave:    () => void;
    onCancel:  () => void;
}

const generateId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

type SectionWithMeta = IPostSection & { _localId: string };

const SECTION_ICONS: Record<string, React.ReactNode> = {
    text:  <AlignLeft size={14} />,
    image: <ImageIcon size={14} />,
    video: <Film      size={14} />,
    audio: <Mic       size={14} />,
};

const TYPE_CONFIG: Record<PostType, { icon: React.ReactNode; label: string; description: string; color: string }> = {
    article: { icon: <FileText size={16} />, label: 'Article', description: 'Written content with rich text and images', color: '#7dd3fc' },
    video:   { icon: <Video    size={16} />, label: 'Video',   description: 'YouTube video with optional description',  color: '#f9a8d4' },
    audio:   { icon: <Music    size={16} />, label: 'Audio',   description: 'Spotify track, album or podcast episode',  color: '#86efac' },
};

const EMBED_HINTS: Record<PostType, string> = {
    article: '',
    video:   'https://www.youtube.com/watch?v=…',
    audio:   'https://open.spotify.com/track/…',
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function PostEditor({ postSlug, onSave, onCancel }: PostEditorProps) {
    const isDark = useTheme();

    const bg      = isDark ? '#0A0A0A' : '#F8F9FA';
    const cardBg  = isDark ? '#111111' : '#FFFFFF';
    const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const text    = isDark ? '#FFFFFF'  : '#000000';
    const inputBg = isDark ? '#0A0A0A'  : '#F0F0F0';
    const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    const [categories,       setCategories]       = useState<ICategory[]>([]);
    const [loading,          setLoading]          = useState(true);
    const [saving,           setSaving]           = useState(false);
    const [error,            setError]            = useState('');
    const [postId,           setPostId]           = useState('');
    const [title,            setTitle]            = useState('');
    const [excerpt,          setExcerpt]          = useState('');
    const [category,         setCategory]         = useState('');
    const [type,             setType]             = useState<PostType>('article');
    const [status,           setStatus]           = useState<PostStatus>('draft');
    const [tagInput,         setTagInput]         = useState('');
    const [tags,             setTags]             = useState<string[]>([]);
    const [mediaUrl,         setMediaUrl]         = useState('');
    const [embedType,        setEmbedType]        = useState<EmbedType>('youtube');
    const [duration,         setDuration]         = useState('');
    const [episodeNumber,    setEpisodeNumber]    = useState('');
    const [sections,         setSections]         = useState<SectionWithMeta[]>([]);
    const [sectionImages,    setSectionImages]    = useState<Record<string, File>>({});
    const [thumbnailFile,    setThumbnailFile]    = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');

    const titleRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { fetchData(); }, [postSlug]);

    /* ── Auto-resize title — preserves scroll position to prevent jump ── */
    useEffect(() => {
        if (titleRef.current) {
            const scrollY = window.scrollY;
            titleRef.current.style.height = 'auto';
            titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
            window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
        }
    }, [title]);

    useEffect(() => {
        if (type === 'video') setEmbedType('youtube');
        if (type === 'audio') setEmbedType('spotify');
    }, [type]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const cats = await postApi.getCategories();
            setCategories(cats);
            if (postSlug) {
                const post = await postApi.getPostBySlug(postSlug);
                setPostId(post._id);
                setTitle(post.title);
                setExcerpt(post.excerpt ?? '');
                setCategory(post.category._id);
                setType(post.type);
                setStatus(post.status);
                setTags(post.tags ?? []);
                setThumbnailPreview(post.thumbnail ?? '');
                setMediaUrl(post.mediaUrl ?? '');
                setEmbedType(post.embedType ?? 'youtube');
                setDuration(post.duration ? String(post.duration) : '');
                setEpisodeNumber(post.mediaMeta?.episodeNumber ? String(post.mediaMeta.episodeNumber) : '');
                setSections(post.sections.map((s, i) => ({ ...s, _localId: generateId(), id: s.id ?? generateId(), order: i })));
            }
        } catch {
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addSection = (sectionType: IPostSection['type']) => {
        setSections(prev => [...prev, {
            _localId: generateId(), id: generateId(),
            type: sectionType, content: '', mediaUrl: '', caption: '', order: prev.length,
        }]);
    };

    const updateSection = (_localId: string, updates: Partial<SectionWithMeta>) => {
        setSections(prev => prev.map(s => s._localId === _localId ? { ...s, ...updates } : s));
    };

    const removeSection = (_localId: string) => {
        setSections(prev => prev.filter(s => s._localId !== _localId));
        setSectionImages(prev => { const n = { ...prev }; delete n[_localId]; return n; });
    };

    const handleSectionImage = (_localId: string, file: File) => {
        setSectionImages(prev => ({ ...prev, [_localId]: file }));
        updateSection(_localId, { mediaUrl: URL.createObjectURL(file) });
    };

    const commitTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
        setTagInput('');
    };

    const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag(); }
        if (e.key === 'Backspace' && !tagInput && tags.length) setTags(prev => prev.slice(0, -1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return setError('Title is required.');
        if (!category)     return setError('Please select a category.');
        if ((type === 'video' || type === 'audio') && !mediaUrl.trim()) {
            return setError(`Please provide a ${type === 'video' ? 'YouTube' : 'Spotify'} URL.`);
        }
        setError('');
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('title',    title.trim());
            fd.append('excerpt',  excerpt);
            fd.append('category', category);
            fd.append('type',     type);
            fd.append('status',   status);
            tags.forEach(tag => fd.append('tags[]', tag));

            if (type === 'video' || type === 'audio') {
                fd.append('mediaUrl',  mediaUrl.trim());
                fd.append('embedType', embedType);
                if (duration)      fd.append('duration',                 duration);
                if (episodeNumber) fd.append('mediaMeta[episodeNumber]', episodeNumber);
            }

            if (type === 'article' || sections.length > 0) {
                const serialised = sections.map(s => ({
                    type:     s.type,
                    content:  s.content  ?? '',
                    caption:  s.caption  ?? '',
                    mediaUrl: s.type === 'image' && sectionImages[s._localId] ? '' : (s.mediaUrl ?? ''),
                }));
                fd.append('sections', JSON.stringify(serialised));
                sections.forEach(s => {
                    if (s.type === 'image' && sectionImages[s._localId]) fd.append('sectionImages', sectionImages[s._localId]);
                });
            }

            if (thumbnailFile) fd.append('thumbnail', thumbnailFile);

            if (postSlug && postId) await postApi.updatePost(postId, fd);
            else                    await postApi.createPost(fd);

            onSave();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /* ── Shared input style ──────────────────────────────────────────────── */
    const inputStyle: React.CSSProperties = {
        backgroundColor: inputBg,
        border:          `1px solid ${border}`,
        color:           text,
        fontFamily:      MONO,
        outline:         'none',
    };

    /* ── Loading ─────────────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor: bg }}>
                <Loader2 className="animate-spin" style={{ color: ACCENT }} size={26} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: text, fontFamily: MONO }}>
                    Loading Editor
                </p>
            </div>
        );
    }

    const cfg = TYPE_CONFIG[type];

    return (
        <div className="min-h-screen w-full transition-colors duration-300" style={{ backgroundColor: bg }}>

            {/* ── Sticky Top Bar ───────────────────────────────────────────── */}
            <header
                className="sticky top-0 z-50 backdrop-blur-xl"
                style={{
                    backgroundColor: isDark ? 'rgba(10,10,10,0.92)' : 'rgba(248,249,250,0.92)',
                    borderBottom:    `1px solid ${border}`,
                }}
            >
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

                    {/* Left */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all shrink-0"
                            style={{ border: `1px solid ${border}`, color: text }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color        = ACCENT;
                                e.currentTarget.style.borderColor  = ACCENT_BORDER;
                                e.currentTarget.style.backgroundColor = ACCENT_MUTED;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color        = text;
                                e.currentTarget.style.borderColor  = border;
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <X size={14} />
                        </button>
                        <span
                            className="text-[10px] font-black uppercase tracking-[0.25em] truncate"
                            style={{ color: text, fontFamily: MONO }}
                        >
                            {postSlug ? 'Edit Post' : 'New Post'}
                        </span>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as PostStatus)}
                            className="rounded-xl px-3 py-1.5 text-[10px] font-black tracking-widest uppercase cursor-pointer outline-none appearance-none"
                            style={{
                                backgroundColor: status === 'published' ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)',
                                border:          `1px solid ${status === 'published' ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                color:           status === 'published' ? '#34d399' : '#f59e0b',
                                fontFamily:      MONO,
                            }}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all hover:opacity-90"
                            style={{ backgroundColor: ACCENT, color: '#000000', fontFamily: MONO }}
                        >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4 pb-24">

                {/* Error banner */}
                {error && (
                    <div
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                        style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}
                    >
                        <p className="text-xs font-bold" style={{ color: '#f87171', fontFamily: MONO }}>{error}</p>
                        <button type="button" onClick={() => setError('')}>
                            <X size={14} style={{ color: '#f87171' }} />
                        </button>
                    </div>
                )}

                {/* ── Title ────────────────────────────────────────────────── */}
                <div>
                    <textarea
                        ref={titleRef}
                        placeholder="Post title…"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        rows={1}
                        className="w-full bg-transparent border-none outline-none text-3xl sm:text-4xl font-bold leading-tight resize-none overflow-hidden block p-0"
                        style={{ color: text, fontFamily: FONT }}
                    />
                    <div className="mt-4 h-px" style={{ backgroundColor: divider }} />
                </div>

                {/* ── Content Type ─────────────────────────────────────────── */}
                <Card bg={cardBg} border={border}>
                    <Label color={text}>Content Type</Label>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                        {(Object.entries(TYPE_CONFIG) as [PostType, typeof TYPE_CONFIG[PostType]][]).map(([t, c]) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200"
                                style={{
                                    border:          `1px solid ${type === t ? ACCENT_BORDER : border}`,
                                    backgroundColor: type === t ? ACCENT_MUTED : inputBg,
                                }}
                            >
                                <span style={{ color: type === t ? c.color : text }}>{c.icon}</span>
                                <span
                                    className="text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: text, fontFamily: MONO, opacity: type === t ? 1 : 0.45 }}
                                >
                                    {c.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    {type !== 'article' && (
                        <p className="mt-3 text-xs flex items-center gap-1.5 font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.45 }}>
                            <Info size={12} /> {cfg.description}
                        </p>
                    )}
                </Card>

                {/* ── Media URL ────────────────────────────────────────────── */}
                {(type === 'video' || type === 'audio') && (
                    <Card bg={cardBg} border={border}>
                        <Label color={text}>
                            {type === 'video' ? 'YouTube URL' : 'Spotify URL'}
                            <span style={{ color: ACCENT }}> *</span>
                        </Label>
                        <div
                            className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                            style={{ backgroundColor: inputBg, border: `1px solid ${border}` }}
                            onFocusCapture={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                            onBlurCapture={e  => (e.currentTarget.style.borderColor = border)}
                        >
                            <Link size={14} className="shrink-0" style={{ color: text, opacity: 0.4 }} />
                            <input
                                type="url"
                                placeholder={EMBED_HINTS[type]}
                                value={mediaUrl}
                                onChange={e => setMediaUrl(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-sm"
                                style={{ color: text, fontFamily: MONO }}
                            />
                        </div>
                        {type === 'video' && mediaUrl && (
                            <p className="mt-2 text-xs flex items-center gap-1.5 font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.45 }}>
                                <Info size={11} /> Thumbnail auto-generated from YouTube if none uploaded.
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div>
                                <Label color={text}>Duration (seconds)</Label>
                                <input
                                    type="number"
                                    placeholder="e.g. 243"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                                    style={inputStyle}
                                    onFocus={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                                    onBlur={e  => (e.currentTarget.style.borderColor = border)}
                                />
                            </div>
                            {type === 'audio' && (
                                <div>
                                    <Label color={text}>Episode No.</Label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 5"
                                        value={episodeNumber}
                                        onChange={e => setEpisodeNumber(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm"
                                        style={inputStyle}
                                        onFocus={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                                        onBlur={e  => (e.currentTarget.style.borderColor = border)}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* ── Thumbnail ─────────────────────────────────────────────── */}
                <Card bg={cardBg} border={border}>
                    <div className="flex items-center justify-between mb-3">
                        <Label color={text}>Thumbnail</Label>
                        {type === 'video' && (
                            <span className="text-[10px] font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                                Optional — auto from YouTube
                            </span>
                        )}
                    </div>
                    <div
                        className="relative w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200"
                        style={{ backgroundColor: inputBg, border: `1px dashed ${border}` }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
                    >
                        {thumbnailPreview
                            ? <img src={thumbnailPreview} className="w-full h-full object-cover" alt="" />
                            : (
                                <div className="flex flex-col items-center gap-2 pointer-events-none">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: ACCENT_MUTED, border: `1px solid ${ACCENT_BORDER}` }}
                                    >
                                        <ImageIcon size={18} style={{ color: ACCENT }} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                                        Upload thumbnail
                                    </span>
                                </div>
                            )
                        }
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setThumbnailFile(file);
                                setThumbnailPreview(URL.createObjectURL(file));
                            }}
                        />
                        {thumbnailPreview && (
                            <button
                                type="button"
                                className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)', border: `1px solid ${border}`, color: text }}
                                onClick={e => { e.stopPropagation(); setThumbnailFile(null); setThumbnailPreview(''); }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = text;      e.currentTarget.style.borderColor = border; }}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </Card>

                {/* ── Details ───────────────────────────────────────────────── */}
                <Card bg={cardBg} border={border}>
                    <Label color={text}>Details</Label>
                    <div className="space-y-5 mt-3">

                        {/* Category */}
                        <div>
                            <Label color={text}>
                                Category <span style={{ color: ACCENT }}>*</span>
                            </Label>
                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none cursor-pointer"
                                    style={inputStyle}
                                    onFocus={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                                    onBlur={e  => (e.currentTarget.style.borderColor = border)}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: text, opacity: 0.4 }} />
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label color={text}>Excerpt</Label>
                                <span className="text-[10px] font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                                    {excerpt.length}/500
                                </span>
                            </div>
                            <textarea
                                value={excerpt}
                                onChange={e => setExcerpt(e.target.value.slice(0, 500))}
                                placeholder="Brief summary…"
                                rows={3}
                                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none leading-relaxed"
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                                onBlur={e  => (e.currentTarget.style.borderColor = border)}
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label color={text}>
                                    <span className="flex items-center gap-1.5"><Hash size={11} /> Tags</span>
                                </Label>
                                <span className="text-[10px] font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                                    Enter or comma to add
                                </span>
                            </div>
                            <div
                                className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 rounded-xl min-h-[46px] transition-colors"
                                style={{ backgroundColor: inputBg, border: `1px solid ${border}` }}
                                onFocusCapture={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                                onBlurCapture={e  => (e.currentTarget.style.borderColor = border)}
                            >
                                {tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black"
                                        style={{ backgroundColor: ACCENT_MUTED, border: `1px solid ${ACCENT_BORDER}`, color: ACCENT, fontFamily: MONO }}
                                    >
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)}>
                                            <X size={10} style={{ color: ACCENT }} />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    onBlur={commitTag}
                                    placeholder={tags.length === 0 ? 'Add tags…' : ''}
                                    className="flex-1 min-w-[100px] bg-transparent outline-none text-sm py-0.5"
                                    style={{ color: text, fontFamily: MONO }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* ── Sections ──────────────────────────────────────────────── */}
                <Card bg={cardBg} border={border}>
                    <div className="flex items-center justify-between mb-4">
                        <Label color={text}>
                            {type === 'article' ? 'Content' : 'Description / Show Notes'}
                        </Label>
                        <span className="text-[10px] font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                            {sections.length} section{sections.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {sections.length === 0 && (
                        <div className="py-10 flex flex-col items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: ACCENT_MUTED, border: `1px solid ${ACCENT_BORDER}` }}
                            >
                                <AlignLeft size={16} style={{ color: ACCENT }} />
                            </div>
                            <p className="text-xs text-center font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.35 }}>
                                {type === 'article'
                                    ? 'No sections yet. Add blocks below to build your article.'
                                    : 'Optionally add text or images to describe this content.'}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3 mb-5">
                        {sections.map((section, idx) => (
                            <div
                                key={section._localId}
                                className="rounded-xl overflow-hidden"
                                style={{ backgroundColor: inputBg, border: `1px solid ${border}` }}
                            >
                                {/* Section header */}
                                <div
                                    className="flex items-center justify-between px-4 py-2.5"
                                    style={{ borderBottom: `1px solid ${divider}` }}
                                >
                                    <div
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"
                                        style={{ color: text, fontFamily: MONO }}
                                    >
                                        <span style={{ color: ACCENT }}>{SECTION_ICONS[section.type]}</span>
                                        {section.type} <span style={{ color: ACCENT }}>#{idx + 1}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeSection(section._localId)}
                                        className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                                        style={{ color: text, opacity: 0.4 }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.opacity = '1'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = text;      e.currentTarget.style.opacity = '0.4'; }}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                {/* Section body */}
                                <div className="p-4">
                                    {section.type === 'text' && (
                                        <textarea
                                            placeholder="Write something…"
                                            value={section.content}
                                            onChange={e => updateSection(section._localId, { content: e.target.value })}
                                            rows={5}
                                            className="w-full bg-transparent outline-none text-sm leading-relaxed resize-none"
                                            style={{ color: text, fontFamily: FONT }}
                                        />
                                    )}

                                    {section.type === 'image' && (
                                        <div className="space-y-3">
                                            <div
                                                className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200"
                                                style={{ backgroundColor: cardBg, border: `1px dashed ${border}` }}
                                                onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                                                onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
                                            >
                                                {section.mediaUrl
                                                    ? <img src={section.mediaUrl} className="w-full h-full object-contain" alt="" />
                                                    : (
                                                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                            <div
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                                style={{ backgroundColor: ACCENT_MUTED, border: `1px solid ${ACCENT_BORDER}` }}
                                                            >
                                                                <ImageIcon size={14} style={{ color: ACCENT }} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                                                                Click to upload
                                                            </span>
                                                        </div>
                                                    )
                                                }
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    onChange={e => e.target.files?.[0] && handleSectionImage(section._localId, e.target.files[0])}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Caption (optional)"
                                                value={section.caption}
                                                onChange={e => updateSection(section._localId, { caption: e.target.value })}
                                                className="w-full bg-transparent pl-3 text-xs italic outline-none"
                                                style={{ borderLeft: `2px solid ${ACCENT_BORDER}`, color: text, fontFamily: FONT, opacity: 0.7 }}
                                            />
                                        </div>
                                    )}

                                    {(section.type === 'video' || section.type === 'audio') && (
                                        <div
                                            className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                                            style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                                        >
                                            {section.type === 'video'
                                                ? <Film size={14} style={{ color: text, opacity: 0.4 }} className="shrink-0" />
                                                : <Mic  size={14} style={{ color: text, opacity: 0.4 }} className="shrink-0" />
                                            }
                                            <input
                                                type="url"
                                                placeholder={`Paste ${section.type} URL…`}
                                                value={section.mediaUrl}
                                                onChange={e => updateSection(section._localId, { mediaUrl: e.target.value })}
                                                className="flex-1 bg-transparent outline-none text-sm"
                                                style={{ color: text, fontFamily: MONO }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add section buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['text', 'image', 'video', 'audio'] as const).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => addSection(t)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200"
                                style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color           = ACCENT;
                                    e.currentTarget.style.borderColor     = ACCENT_BORDER;
                                    e.currentTarget.style.backgroundColor = ACCENT_MUTED;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color           = text;
                                    e.currentTarget.style.borderColor     = border;
                                    e.currentTarget.style.backgroundColor = inputBg;
                                }}
                            >
                                {SECTION_ICONS[t]}
                                {t}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* ── Bottom Actions ─────────────────────────────────────────── */}
                <div className="space-y-3 pt-2">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full h-[52px] flex items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-widest disabled:opacity-50 transition-all active:scale-[0.99] hover:opacity-90"
                        style={{ backgroundColor: ACCENT, color: '#000000', fontFamily: MONO }}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Saving…' : postSlug ? 'Update Post' : 'Create Post'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
                        style={{ border: `1px solid ${border}`, color: text, backgroundColor: 'transparent', fontFamily: MONO }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor     = ACCENT_BORDER;
                            e.currentTarget.style.backgroundColor = ACCENT_MUTED;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor     = border;
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
}