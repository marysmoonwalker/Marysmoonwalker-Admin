import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    RefreshCw, Loader2, Search, ChevronLeft,
    ChevronRight, Shield, MapPin, ArrowLeft, Users,
} from 'lucide-react';
import {
    analyticsApi, UserRole, IAdminUser, IPaginatedUsers,
} from '../services/analytics';

const ACCENT        = '#FF8C00';
const ACCENT_BORDER = 'rgba(255,140,0,0.3)';
const ACCENT_MUTED  = 'rgba(255,140,0,0.08)';
const MONO          = '"Courier New", Courier, monospace';
const FONT          = 'Georgia, serif';

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

function useCountUp(target: number, duration = 1000) {
    const [count, setCount] = useState(0);
    const prev = useRef(0);
    useEffect(() => {
        if (target === prev.current) return;
        prev.current = target;
        let val = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
            val += step;
            if (val >= target) { setCount(target); clearInterval(t); }
            else setCount(Math.floor(val));
        }, 16);
        return () => clearInterval(t);
    }, [target, duration]);
    return count;
}

interface Props {
    onBack?: () => void;
}

export default function UserRegistry({ onBack }: Props) {
    const isDark   = useTheme();
    const bg       = isDark ? '#0A0A0A' : '#F8F9FA';
    const cardBg   = isDark ? '#111111' : '#FFFFFF';
    const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const text     = isDark ? '#FFFFFF'  : '#000000';
    const inputBg  = isDark ? '#0D0D0D'  : '#F0F0F0';
    const rowHover = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    const divider  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    const [data,       setData]       = useState<IPaginatedUsers | null>(null);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [page,       setPage]       = useState(1);
    const [search,     setSearch]     = useState('');
    const [role,       setRole]       = useState<UserRole | ''>('');
    const [verified,   setVerified]   = useState<'' | 'true' | 'false'>('');

    const debounce = useRef<ReturnType<typeof setTimeout>>();

    const totalUsers    = useCountUp(data?.pagination.total ?? 0);
    const totalVerified = useCountUp(
        data?.users.filter(u => u.isVerified).length ?? 0
    );

    const loadUsers = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await analyticsApi.getAllUsers({
                page,
                limit:      15,
                search:     search || undefined,
                role:       (role as UserRole) || undefined,
                isVerified: verified === '' ? undefined : verified === 'true',
            });
            setData(res);
        } catch (err) {
            console.error('[UserRegistry] Load failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, search, role, verified]);

    useEffect(() => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => loadUsers(), search ? 400 : 0);
    }, [loadUsers, search]);

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const LIMIT = 15;

    return (
        <div className="min-h-screen w-full space-y-5" style={{ backgroundColor: bg }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center flex-shrink-0"
                                style={{ borderColor: border, color: text, backgroundColor: 'transparent' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = ACCENT_BORDER;
                                    e.currentTarget.style.color = ACCENT;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = border;
                                    e.currentTarget.style.color = text;
                                }}
                            >
                                <ArrowLeft size={14} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold mb-1" style={{ color: text, fontFamily: FONT }}>
                                User Registry
                            </h2>
                            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: text, fontFamily: MONO }}>
                                Registered Accounts · Roles · Location · Verification
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => loadUsers(true)}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center disabled:opacity-40 self-start md:self-auto"
                        style={{ backgroundColor: cardBg, borderColor: border, color: text }}
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
                {([
                    { label: 'Total Users',    value: totalUsers,    sub: 'All Registered',  icon: <Users size={15} /> },
                    { label: 'Verified',       value: totalVerified, sub: 'This Page',        icon: <Shield size={15} /> },
                ] as const).map(card => (
                    <div
                        key={card.label}
                        className="rounded-2xl p-5 relative overflow-hidden"
                        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                    >
                        <div className="absolute top-0 right-0 w-14 h-14 rounded-bl-[36px]" style={{ backgroundColor: ACCENT_MUTED }} />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: text, fontFamily: MONO }}>
                                    {card.label}
                                </span>
                                <span style={{ color: ACCENT }}>{card.icon}</span>
                            </div>
                            <p className="text-3xl font-black tabular-nums leading-none mb-1.5" style={{ color: text, fontFamily: MONO }}>
                                {card.value.toLocaleString()}
                            </p>
                            <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                {card.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters ────────────────────────────────────────────────── */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="flex flex-col md:flex-row gap-3">

                    {/* Search */}
                    <div
                        className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border"
                        style={{ backgroundColor: inputBg, borderColor: border }}
                    >
                        <Search size={13} style={{ color: text, flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search name, email or username..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-xs font-bold placeholder:opacity-40"
                            style={{ color: text, fontFamily: MONO, caretColor: ACCENT }}
                        />
                        {search && (
                            <button
                                onClick={() => handleSearch('')}
                                className="text-[10px] font-black uppercase tracking-wider flex-shrink-0"
                                style={{ color: ACCENT, fontFamily: MONO }}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Role filter */}
                    <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: inputBg, borderColor: border }}>
                        {(['', 'user', 'admin'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => { setRole(r); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
                                style={{
                                    backgroundColor: role === r ? ACCENT : 'transparent',
                                    color:           role === r ? '#000' : text,
                                    fontFamily:      MONO,
                                }}
                            >
                                {r === '' ? 'All' : r}
                            </button>
                        ))}
                    </div>

                    {/* Verified filter */}
                    <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: inputBg, borderColor: border }}>
                        {(['', 'true', 'false'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => { setVerified(v); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
                                style={{
                                    backgroundColor: verified === v ? ACCENT : 'transparent',
                                    color:           verified === v ? '#000' : text,
                                    fontFamily:      MONO,
                                }}
                            >
                                {v === '' ? 'All' : v === 'true' ? 'Verified' : 'Unverified'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="overflow-x-auto w-full">
                    <table className="w-full" style={{ minWidth: '760px' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                {['#', 'User', 'Email', 'Location', 'Role', 'Status', 'Joined'].map(h => (
                                    <th
                                        key={h}
                                        className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap"
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
                            ) : !data || data.users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <p className="text-xs uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                            No registry entries found
                                        </p>
                                    </td>
                                </tr>
                            ) : data.users.map((user: IAdminUser, idx, arr) => (
                                <tr
                                    key={user._id}
                                    className="transition-colors duration-150"
                                    style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${divider}` : 'none' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    {/* Index */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className="text-xs font-black" style={{ color: ACCENT, fontFamily: MONO }}>
                                            {String((page - 1) * LIMIT + idx + 1).padStart(2, '0')}
                                        </span>
                                    </td>

                                    {/* User */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar}
                                                alt={user.fullName}
                                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                style={{ border: `1px solid ${border}` }}
                                            />
                                            <div>
                                                <p className="text-sm font-bold leading-tight" style={{ color: text, fontFamily: FONT }}>
                                                    {user.fullName}
                                                </p>
                                                <p className="text-[10px] font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <p className="text-xs font-bold" style={{ color: text, fontFamily: MONO }}>{user.email}</p>
                                    </td>

                                    {/* Location */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={11} style={{ color: ACCENT, flexShrink: 0 }} />
                                            <div>
                                                <p className="text-xs font-bold leading-tight" style={{ color: text, fontFamily: MONO }}>
                                                    {(user as any).country ?? 'Unknown'}
                                                </p>
                                                {(user as any).city && (user as any).city !== 'Unknown' && (
                                                    <p className="text-[10px] font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                                                        {(user as any).city}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border"
                                            style={{
                                                borderColor:     user.role === 'admin' ? ACCENT_BORDER : border,
                                                backgroundColor: user.role === 'admin' ? ACCENT_MUTED  : 'transparent',
                                                color:           user.role === 'admin' ? ACCENT        : text,
                                                fontFamily:      MONO,
                                            }}
                                        >
                                            {user.role === 'admin' && <Shield size={9} />}
                                            {user.role}
                                        </span>
                                    </td>

                                    {/* Verified */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className="flex items-center gap-1.5">
                                            <span
                                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: user.isVerified ? '#22C55E' : '#6B7280' }}
                                            />
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider"
                                                style={{ color: user.isVerified ? '#22C55E' : text, fontFamily: MONO }}
                                            >
                                                {user.isVerified ? 'Verified' : 'Pending'}
                                            </span>
                                        </span>
                                    </td>

                                    {/* Joined */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <p className="text-xs font-bold leading-tight" style={{ color: text, fontFamily: MONO }}>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-[10px] font-bold" style={{ color: text, fontFamily: MONO, opacity: 0.4 }}>
                                            {new Date(user.createdAt).toLocaleTimeString()}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ─────────────────────────────────────────── */}
                {data && data.pagination.totalPages > 1 && (
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderTop: `1px solid ${divider}` }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: text, fontFamily: MONO }}>
                            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.pagination.total)} of {data.pagination.total} users
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border transition-all disabled:opacity-30"
                                style={{ borderColor: border, color: text }}
                            >
                                <ChevronLeft size={14} />
                            </button>

                            {(() => {
                                const total = data.pagination.totalPages;
                                const delta = 2;
                                const range: (number | '...')[] = [];
                                let prev = 0;
                                for (let i = 1; i <= total; i++) {
                                    if (i === 1 || i === total || (i >= page - delta && i <= page + delta)) {
                                        if (prev && i - prev > 1) range.push('...');
                                        range.push(i);
                                        prev = i;
                                    }
                                }
                                return range.map((item, i) =>
                                    item === '...' ? (
                                        <span key={`dot-${i}`} className="px-1 text-xs font-bold" style={{ color: text, fontFamily: MONO }}>
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={item}
                                            onClick={() => setPage(item as number)}
                                            className="w-8 h-8 rounded-lg text-[11px] font-bold transition-all"
                                            style={{
                                                backgroundColor: page === item ? ACCENT : 'transparent',
                                                color:           page === item ? '#000' : text,
                                                border:          `1px solid ${page === item ? ACCENT : border}`,
                                                fontFamily:      MONO,
                                            }}
                                        >
                                            {item}
                                        </button>
                                    )
                                );
                            })()}

                            <button
                                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                                disabled={!data.pagination.hasMore}
                                className="p-2 rounded-lg border transition-all disabled:opacity-30"
                                style={{ borderColor: border, color: text }}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}