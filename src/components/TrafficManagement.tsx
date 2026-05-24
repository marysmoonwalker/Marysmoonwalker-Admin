import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    RefreshCw, Loader2, Globe, Users,
    Activity, BarChart2, TrendingUp, ArrowUpRight,
} from 'lucide-react';
import {
    analyticsApi, Period,
    IVisitorStats, IVisitorsByCountry, IUsersByCountry,
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

function CountryBar({
    label, value, max, sub, delay = 0, isDark, text,
}: {
    label: string; value: number; max: number;
    sub?: string; delay?: number; isDark: boolean; text: string;
}) {
    const [width, setWidth] = useState(0);
    const pct = max > 0 ? (value / max) * 100 : 0;
    useEffect(() => {
        const t = setTimeout(() => setWidth(pct), delay + 80);
        return () => clearTimeout(t);
    }, [pct, delay]);

    const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const track   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    return (
        <div className="py-3" style={{ borderBottom: `1px solid ${divider}` }}>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: text, fontFamily: FONT }}>{label}</span>
                    {sub && (
                        <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: text, fontFamily: MONO }}>
                            {sub}
                        </span>
                    )}
                </div>
                <span className="text-xs font-black tabular-nums" style={{ color: ACCENT, fontFamily: MONO }}>
                    {value.toLocaleString()}
                </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: track }}>
                <div style={{
                    width:        `${width}%`,
                    height:       '100%',
                    background:   `linear-gradient(90deg, ${ACCENT} 0%, rgba(255,140,0,0.45) 100%)`,
                    borderRadius: '9999px',
                    boxShadow:    width > 0 ? '0 0 8px rgba(255,140,0,0.35)' : 'none',
                    transition:   'width 0.85s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
            </div>
        </div>
    );
}

function TrafficBars({ data }: { data: { date: string; hits: number; unique: number }[] }) {
    const maxHits = Math.max(...data.map(d => d.hits), 1);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setReady(true), 120);
        return () => clearTimeout(t);
    }, [data]);

    return (
        <div className="flex items-end gap-[3px] w-full" style={{ height: '128px' }}>
            {data.map((d, i) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative" style={{ height: '128px' }}>
                    <div className="w-full flex flex-col justify-end" style={{ height: '108px' }}>
                        <div style={{
                            height:       ready ? `${(d.hits / maxHits) * 100}%` : '0%',
                            background:   `linear-gradient(180deg, ${ACCENT} 0%, rgba(255,140,0,0.4) 100%)`,
                            borderRadius: '3px 3px 0 0',
                            minHeight:    d.hits > 0 ? '3px' : '0',
                            transition:   `height 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 25}ms`,
                        }} />
                    </div>
                    <span className="text-[7px] font-bold truncate w-full text-center opacity-40" style={{ fontFamily: MONO }}>
                        {d.date.slice(-5)}
                    </span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                        <div
                            className="rounded px-2 py-1 text-[9px] font-bold whitespace-nowrap"
                            style={{ backgroundColor: ACCENT, color: '#000', fontFamily: MONO }}
                        >
                            {d.hits} hits · {d.unique} unique
                        </div>
                        <div className="w-0 h-0" style={{
                            borderLeft:  '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop:   `4px solid ${ACCENT}`,
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

type Tab = 'traffic' | 'geographic';

interface Props {
    onNavigateToUsers?: () => void;
}

const PERIOD_LABELS: Record<Period, string> = {
    daily:   'D',
    weekly:  'W',
    monthly: 'M',
    yearly:  'Y',
};

export default function TrafficIntelligence({ onNavigateToUsers }: Props) {
    const isDark   = useTheme();
    const bg       = isDark ? '#0A0A0A' : '#F8F9FA';
    const cardBg   = isDark ? '#111111' : '#FFFFFF';
    const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const text     = isDark ? '#FFFFFF'  : '#000000';
    const inputBg  = isDark ? '#0D0D0D'  : '#F0F0F0';
    const rowHover = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    const divider  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    const [activeTab,  setActiveTab]  = useState<Tab>('traffic');
    const [period,     setPeriod]     = useState<Period>('weekly');
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [visitorStats,     setVisitorStats]     = useState<IVisitorStats | null>(null);
    const [visitorCountries, setVisitorCountries] = useState<IVisitorsByCountry | null>(null);
    const [userCountries,    setUserCountries]    = useState<IUsersByCountry | null>(null);

    const totalVisits    = useCountUp(visitorStats?.totalAllTime ?? 0);
    const totalUnique    = useCountUp(visitorStats?.data.reduce((s, d) => s + d.unique, 0) ?? 0);
    const totalCountries = useCountUp(visitorCountries?.data.length ?? 0);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const [stats, vCountries, uCountries] = await Promise.all([
                analyticsApi.getVisitorStats(period),
                analyticsApi.getVisitorsByCountry(period),
                analyticsApi.getUsersByCountry(),
            ]);
            setVisitorStats(stats);
            setVisitorCountries(vCountries);
            setUserCountries(uCountries);
        } catch (err) {
            console.error('[TrafficIntelligence] Load failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period]);

    useEffect(() => { loadData(); }, [loadData]);

    const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'traffic',    label: 'Signal Traffic',   icon: <Activity size={12} /> },
        { key: 'geographic', label: 'Geographic Nodes', icon: <Globe size={12} /> },
    ];

    const PERIODS = Object.keys(PERIOD_LABELS) as Period[];

    return (
        <div className="min-h-screen w-full space-y-5" style={{ backgroundColor: bg }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-bold mb-1" style={{ color: text, fontFamily: FONT }}>
                            Traffic Intelligence
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: text, fontFamily: MONO }}>
                            Live Signal Capture · Geographic Dispersion Analysis
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">

                        {/* Period selector — single letters only */}
                        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: inputBg, borderColor: border }}>
                            {PERIODS.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className="w-8 h-8 rounded-lg text-[11px] font-black uppercase transition-all duration-200 flex items-center justify-center"
                                    style={{
                                        backgroundColor: period === p ? ACCENT : 'transparent',
                                        color:           period === p ? '#000000' : text,
                                        fontFamily:      MONO,
                                    }}
                                >
                                    {PERIOD_LABELS[p]}
                                </button>
                            ))}
                        </div>

                        {/* Tab switcher */}
                        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: inputBg, borderColor: border }}>
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
                                    style={{
                                        backgroundColor: activeTab === tab.key ? ACCENT : 'transparent',
                                        color:           activeTab === tab.key ? '#000000' : text,
                                        fontFamily:      MONO,
                                    }}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={() => loadData(true)}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center disabled:opacity-40"
                            style={{ backgroundColor: cardBg, borderColor: border, color: text }}
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                    { label: 'Total Visits',      value: totalVisits,    sub: 'All Time Hits',    icon: <BarChart2 size={15} /> },
                    { label: 'Unique Visitors',   value: totalUnique,    sub: period + ' period', icon: <TrendingUp size={15} /> },
                    { label: 'Countries Reached', value: totalCountries, sub: 'Distinct Nodes',   icon: <Globe size={15} /> },
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

            {/* ── Main Panel ─────────────────────────────────────────────── */}
            {loading ? (
                <div
                    className="rounded-2xl flex flex-col items-center justify-center gap-3"
                    style={{ backgroundColor: cardBg, border: `1px solid ${border}`, minHeight: '280px' }}
                >
                    <Loader2 className="animate-spin" style={{ color: ACCENT }} size={26} />
                    <p className="text-[10px] uppercase tracking-[0.35em] font-bold" style={{ color: text, fontFamily: MONO }}>
                        Acquiring Signal...
                    </p>
                </div>
            ) : (
                <>
                    {/* ══ TRAFFIC TAB ══════════════════════════════════════ */}
                    {activeTab === 'traffic' && visitorStats && (
                        <div className="space-y-4">
                            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-bold text-base mb-0.5" style={{ color: text, fontFamily: FONT }}>
                                            Visitor Signal Stream
                                        </h3>
                                        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                            Hit frequency · {period} resolution · {visitorStats.data.length} buckets
                                        </p>
                                    </div>
                                    {/* <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold" style={{ fontFamily: MONO, color: text }}>
                                        <span className="w-2 h-2 rounded-[2px] inline-block" style={{ backgroundColor: ACCENT }} />
                                        Page Hits
                                    </div> */}
                                </div>
                                {visitorStats.data.length === 0 ? (
                                    <div className="h-32 flex items-center justify-center">
                                        <p className="text-xs uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                            No signal data for this period
                                        </p>
                                    </div>
                                ) : (
                                    <TrafficBars data={visitorStats.data} />
                                )}
                            </div>

                            {visitorStats.data.length > 0 && (
                                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                                    {/* Horizontally scrollable on mobile */}
                                    <div className="overflow-x-auto w-full">
                                        <table className="w-full" style={{ minWidth: '500px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                                    {['Date Stamp', 'Total Hits', 'Unique IPs', 'Return Rate'].map(h => (
                                                        <th
                                                            key={h}
                                                            className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap"
                                                            style={{ color: text, fontFamily: MONO }}
                                                        >
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...visitorStats.data].reverse().slice(0, 10).map((row, idx, arr) => {
                                                    const rr = row.hits > 0
                                                        ? (((row.hits - row.unique) / row.hits) * 100).toFixed(1)
                                                        : '0.0';
                                                    return (
                                                        <tr
                                                            key={row.date}
                                                            className="transition-colors duration-150"
                                                            style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${divider}` : 'none' }}
                                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                        >
                                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                                <span className="text-xs font-bold" style={{ color: text, fontFamily: MONO }}>{row.date}</span>
                                                            </td>
                                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                                <span className="text-xs font-black" style={{ color: ACCENT, fontFamily: MONO }}>
                                                                    {row.hits.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                                <span className="text-xs font-bold" style={{ color: text, fontFamily: MONO }}>
                                                                    {row.unique.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                                                                        <div
                                                                            className="h-full rounded-full"
                                                                            style={{ width: `${rr}%`, backgroundColor: ACCENT }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-bold" style={{ color: text, fontFamily: MONO }}>{rr}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══ GEOGRAPHIC TAB ═══════════════════════════════════ */}
                    {activeTab === 'geographic' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="font-bold text-base mb-0.5" style={{ color: text, fontFamily: FONT }}>
                                            Visitor Origin Nodes
                                        </h3>
                                        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                            {visitorCountries?.data.length ?? 0} countries · {period}
                                        </p>
                                    </div>
                                    <span
                                        className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest"
                                        style={{ backgroundColor: ACCENT_MUTED, color: ACCENT, border: `1px solid ${ACCENT_BORDER}`, fontFamily: MONO }}
                                    >
                                        Visitors
                                    </span>
                                </div>
                                {!visitorCountries || visitorCountries.data.length === 0 ? (
                                    <p className="text-xs uppercase tracking-widest font-bold py-10 text-center" style={{ color: text, fontFamily: MONO }}>
                                        No geographic data for this period
                                    </p>
                                ) : (
                                    visitorCountries.data.slice(0, 15).map((item, i) => (
                                        <CountryBar
                                            key={item.country}
                                            label={item.country}
                                            value={item.hits}
                                            max={visitorCountries.data[0].hits}
                                            sub={`${item.unique} unique`}
                                            delay={i * 45}
                                            isDark={isDark}
                                            text={text}
                                        />
                                    ))
                                )}
                            </div>

                            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="font-bold text-base mb-0.5" style={{ color: text, fontFamily: FONT }}>
                                            Registered User Nodes
                                        </h3>
                                        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                            {userCountries?.data.length ?? 0} countries · All Time
                                        </p>
                                    </div>
                                    <span
                                        className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest"
                                        style={{ backgroundColor: ACCENT_MUTED, color: ACCENT, border: `1px solid ${ACCENT_BORDER}`, fontFamily: MONO }}
                                    >
                                        Users
                                    </span>
                                </div>
                                {!userCountries || userCountries.data.length === 0 ? (
                                    <p className="text-xs uppercase tracking-widest font-bold py-10 text-center" style={{ color: text, fontFamily: MONO }}>
                                        No user location data available
                                    </p>
                                ) : (
                                    userCountries.data.slice(0, 15).map((item, i) => (
                                        <CountryBar
                                            key={item.country}
                                            label={item.country}
                                            value={item.count}
                                            max={userCountries.data[0].count}
                                            delay={i * 45}
                                            isDark={isDark}
                                            text={text}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── User Registry Link Card ─────────────────────────── */}
                    <div
                        className="rounded-2xl p-6 flex items-center justify-between cursor-pointer transition-all duration-200"
                        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                        onClick={onNavigateToUsers}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT_BORDER)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: ACCENT_MUTED, border: `1px solid ${ACCENT_BORDER}` }}
                            >
                                <Users size={16} style={{ color: ACCENT }} />
                            </div>
                            <div>
                                <p className="text-sm font-bold" style={{ color: text, fontFamily: FONT }}>
                                    User Registry
                                </p>
                                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                    Manage registered accounts · roles · verification status
                                </p>
                            </div>
                        </div>
                        <div
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
                            style={{ backgroundColor: ACCENT_MUTED, color: ACCENT, border: `1px solid ${ACCENT_BORDER}`, fontFamily: MONO }}
                        >
                            Open
                            <ArrowUpRight size={12} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}