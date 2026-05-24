import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Loader2, Layers, Tag } from 'lucide-react';
import { postApi, ICategory } from '../services/post';

const ACCENT        = '#FF8C00';
const ACCENT_BORDER = 'rgba(255,140,0,0.3)';
const ACCENT_MUTED  = 'rgba(255,140,0,0.08)';
const MONO          = '"Courier New", Courier, monospace';
const FONT          = 'Georgia, serif';

const PRESET_COLORS = [
    '#FF8C00', '#E05C5C', '#5C9BE0', '#5CE07A',
    '#C05CE0', '#E0A35C', '#5CDCE0', '#E05CA3',
];

const INITIAL_FORM = { name: '', description: '', color: '#FF8C00' };

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

export default function CategoryManager() {
    const isDark = useTheme();

    const bg       = isDark ? '#0A0A0A' : '#F8F9FA';
    const cardBg   = isDark ? '#111111' : '#FFFFFF';
    const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const text     = isDark ? '#FFFFFF'  : '#000000';
    const inputBg  = isDark ? '#0D0D0D'  : '#F0F0F0';
    const divider  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const rowHover = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

    const [categories, setCategories] = useState<ICategory[]>([]);
    const [loading, setLoading]       = useState(true);
    const [isOpen, setIsOpen]         = useState(false);
    const [editingId, setEditingId]   = useState<string | null>(null);
    const [form, setForm]             = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError]           = useState<string | null>(null);

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await postApi.getCategories();
            setCategories(data);
        } catch {
            setError('Failed to load categories.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            if (editingId) {
                await postApi.updateCategory(editingId, form);
            } else {
                await postApi.createCategory(form);
            }
            resetForm();
            loadCategories();
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this category? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            await postApi.deleteCategory(id);
            setCategories(prev => prev.filter(c => c._id !== id));
        } catch {
            setError('Could not delete. It may still have posts assigned.');
        } finally {
            setDeletingId(null);
        }
    };

    const startEdit = (cat: ICategory) => {
        setEditingId(cat._id);
        setForm({ name: cat.name, description: cat.description || '', color: cat.color || ACCENT });
        setIsOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setIsOpen(false);
        setEditingId(null);
        setError(null);
    };

    return (
        <div className="min-h-screen w-full space-y-6" style={{ backgroundColor: bg }}>

            {/* ── Header Bar ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {/* <div className="w-1 h-6 rounded-full" style={{ backgroundColor: ACCENT }} /> */}
                            <h2 className="text-2xl font-bold" style={{ color: text, fontFamily: FONT }}>
                                Category Manager
                            </h2>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] pl-3" style={{ color: text, fontFamily: MONO }}>
                            {categories.length} {categories.length === 1 ? 'category' : 'categories'} total
                        </p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:opacity-90 hover:scale-[1.02] w-fit"
                        style={{ backgroundColor: ACCENT, color: '#000000', fontFamily: MONO }}
                    >
                        <Plus size={15} strokeWidth={3} />
                        New Category
                    </button>
                </div>
            </div>

            {/* ── Error Banner ───────────────────────────────────────────────── */}
            {error && (
                <div
                    className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}
                >
                    <p className="text-sm font-bold" style={{ color: '#f87171', fontFamily: MONO }}>{error}</p>
                    <button onClick={() => setError(null)}>
                        <X size={15} style={{ color: '#f87171' }} />
                    </button>
                </div>
            )}

            {/* ── Grid ───────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                {/* Form Panel */}
                {isOpen && (
                    <div
                        className="xl:col-span-4 rounded-2xl overflow-hidden sticky top-6"
                        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                    >
                        {/* Form Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4"
                            style={{ borderBottom: `1px solid ${divider}` }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: ACCENT }} />
                                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: text, fontFamily: MONO }}>
                                    {editingId ? 'Edit Category' : 'New Category'}
                                </span>
                            </div>
                            <button
                                onClick={resetForm}
                                className="p-1.5 rounded-lg transition-all"
                                style={{ color: text }}
                                onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                                onMouseLeave={e => (e.currentTarget.style.color = text)}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            {/* Name */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: text, fontFamily: MONO }}>
                                    Name <span style={{ color: ACCENT }}>*</span>
                                </label>
                                <input
                                    required
                                    placeholder="e.g. Concerts"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all"
                                    style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                                    onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                                    onBlur={e  => (e.currentTarget.style.borderColor = border)}
                                />
                            </div>

                            {/* Color */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: text, fontFamily: MONO }}>
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setForm({ ...form, color: c })}
                                            className="w-7 h-7 rounded-full transition-all duration-200"
                                            style={{
                                                backgroundColor: c,
                                                border: `2px solid ${form.color === c ? '#fff' : 'transparent'}`,
                                                transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={form.color}
                                        onChange={e => setForm({ ...form, color: e.target.value })}
                                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                                    />
                                    <input
                                        value={form.color}
                                        onChange={e => setForm({ ...form, color: e.target.value })}
                                        className="flex-1 px-4 py-2.5 text-sm rounded-xl outline-none transition-all"
                                        style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                                        onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                                        onBlur={e  => (e.currentTarget.style.borderColor = border)}
                                        placeholder="#FF8C00"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: text, fontFamily: MONO }}>
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="What kind of content lives here..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none resize-none transition-all"
                                    style={{ backgroundColor: inputBg, border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                                    onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                                    onBlur={e  => (e.currentTarget.style.borderColor = border)}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200"
                                    style={{ border: `1px solid ${border}`, color: text, fontFamily: MONO }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex justify-center items-center gap-2"
                                    style={{ backgroundColor: ACCENT, color: '#000000', fontFamily: MONO }}
                                >
                                    {submitting
                                        ? <Loader2 size={15} className="animate-spin" />
                                        : editingId ? 'Save Changes' : 'Create'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Table ──────────────────────────────────────────────────── */}
                <div className={isOpen ? 'xl:col-span-8' : 'xl:col-span-12'}>
                    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                        {['Category', 'Slug', 'Description', 'Actions'].map((h, i) => (
                                            <th
                                                key={h}
                                                className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] ${i === 3 ? 'text-right' : 'text-left'}`}
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
                                    ) : categories.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-24 text-center">
                                                <p className="text-sm uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                                    No categories yet
                                                </p>
                                            </td>
                                        </tr>
                                    ) : categories.map((cat, idx) => (
                                        <tr
                                            key={cat._id}
                                            className="group transition-colors duration-150"
                                            style={{ borderBottom: idx < categories.length - 1 ? `1px solid ${divider}` : 'none' }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            {/* Name */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{ backgroundColor: cat.color }}
                                                    />
                                                    <p className="text-sm font-bold" style={{ color: text, fontFamily: FONT }}>
                                                        {cat.name}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Slug */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.5 }}>
                                                    /{cat.slug}
                                                </span>
                                            </td>

                                            {/* Description */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm line-clamp-1 max-w-xs" style={{ color: text, fontFamily: FONT }}>
                                                    {cat.description || '—'}
                                                </p>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => startEdit(cat)}
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
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cat._id)}
                                                        disabled={deletingId === cat._id}
                                                        className="p-2 rounded-lg transition-all duration-200 disabled:opacity-40"
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
                                                        {deletingId === cat._id
                                                            ? <Loader2 size={15} className="animate-spin" />
                                                            : <Trash2 size={15} />
                                                        }
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}