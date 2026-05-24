import { useEffect, useState, useCallback } from 'react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import { RefreshCw, Loader2, Eye, ImageIcon } from 'lucide-react';
import {
    analyticsApi,
    IOverview,
    IViewsChart,
    IUserGrowth,
    IContentBreakdown,
    ITopPost,
    IForumStats,
    Period,
} from '../services/analytics';

const BRAND_ACCENT = '#FF8C00';
const ACCENT_MUTED = 'rgba(255,140,0,0.1)';
const MONO         = '"Courier New", Courier, monospace';
const FONT         = 'Georgia, serif';

const TYPE_COLORS: Record<string, string> = {
    article: '#FF8C00',
    video:   '#3B82F6',
    audio:   '#10B981',
};

const TYPE_BADGE: Record<string, { color: string; bg: string }> = {
    article: { color: '#7dd3fc', bg: 'rgba(125,211,252,0.1)' },
    video:   { color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)' },
    audio:   { color: '#86efac', bg: 'rgba(134,239,172,0.1)' },
};

const PERIODS: { label: string; value: Period }[] = [
    { label: 'D', value: 'daily'   },
    { label: 'W', value: 'weekly'  },
    { label: 'M', value: 'monthly' },
    { label: 'Y', value: 'yearly'  },
];

// ─── Theme hook ───────────────────────────────────────────────────────────────
function useThemeStatus() {
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

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="border rounded-xl p-4 shadow-2xl backdrop-blur-md"
            style={{
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            }}
        >
            <p className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: isDark ? '#FFFFFF' : '#000000', fontFamily: MONO }}>{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} className="text-sm font-medium flex items-center gap-2" style={{ color: entry.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}:{' '}
                    <span className="font-bold" style={{ color: isDark ? '#FFFFFF' : '#000000', fontFamily: MONO }}>
                        {Number(entry.value).toLocaleString()}
                    </span>
                </p>
            ))}
        </div>
    );
};

function PeriodSelector({ value, onChange, loading, isDark }: { value: Period; onChange: (p: Period) => void; loading?: boolean; isDark: boolean }) {
    return (
        <div
            className="flex items-center gap-1 border rounded-xl p-1"
            style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            }}
        >
            {PERIODS.map((p) => (
                <button
                    key={p.value}
                    onClick={() => onChange(p.value)}
                    disabled={loading}
                    className={`w-9 h-8 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-40 ${
                        value === p.value
                            ? 'bg-[#FF8C00] text-black shadow-md scale-[1.02]'
                            : isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
                    }`}
                    style={{ fontFamily: MONO }}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}

function ChartLoader() {
    return (
        <div className="flex items-center justify-center h-full w-full py-12">
            <Loader2 size={28} className="animate-spin" style={{ color: BRAND_ACCENT }} />
        </div>
    );
}

function TableLoader({ cols }: { cols: number }) {
    return (
        <tr>
            <td colSpan={cols} className="py-24 text-center">
                <Loader2 className="animate-spin inline" style={{ color: BRAND_ACCENT }} size={24} />
            </td>
        </tr>
    );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);
    return (
        <div
            className="transition-all duration-500"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
        >
            {children}
        </div>
    );
}

export default function AnalyticsDashboard() {
    const isDark = useThemeStatus();

    const mainText   = isDark ? '#FFFFFF'  : '#000000';
    const cardBg     = isDark ? '#111111'  : '#FFFFFF';
    const cardBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const divider    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const rowHover   = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    const inputBg    = isDark ? '#0D0D0D'  : '#F0F0F0';

    const [overview,      setOverview]      = useState<IOverview | null>(null);
    const [views,         setViews]         = useState<IViewsChart | null>(null);
    const [growth,        setGrowth]        = useState<IUserGrowth | null>(null);
    const [content,       setContent]       = useState<IContentBreakdown | null>(null);
    const [topPosts,      setTopPosts]      = useState<ITopPost[]>([]);
    const [forum,         setForum]         = useState<IForumStats | null>(null);

    const [pageLoading,   setPageLoading]   = useState(true);
    const [refreshing,    setRefreshing]    = useState(false);
    const [viewsLoading,  setViewsLoading]  = useState(false);
    const [growthLoading, setGrowthLoading] = useState(false);
    const [forumLoading,  setForumLoading]  = useState(false);

    const [viewsPeriod,  setViewsPeriod]  = useState<Period>('daily');
    const [growthPeriod, setGrowthPeriod] = useState<Period>('monthly');
    const [forumPeriod,  setForumPeriod]  = useState<Period>('weekly');

    const fetchAll = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else           setPageLoading(true);
        try {
            const [ov, vw, gr, ct, tp, fm] = await Promise.all([
                analyticsApi.getOverview(),
                analyticsApi.getViewsChart(viewsPeriod),
                analyticsApi.getUserGrowth(growthPeriod),
                analyticsApi.getContentBreakdown(),
                analyticsApi.getTopPosts(),
                analyticsApi.getForumStats(forumPeriod),
            ]);
            setOverview(ov); setViews(vw); setGrowth(gr);
            setContent(ct);  setTopPosts(tp); setForum(fm);
        } catch (err) { console.error(err); }
        finally { setPageLoading(false); setRefreshing(false); }
    }, [viewsPeriod, growthPeriod, forumPeriod]);

    useEffect(() => { fetchAll(); }, []);

    const handleViewsPeriod = async (p: Period) => {
        setViewsPeriod(p); setViewsLoading(true);
        try { setViews(await analyticsApi.getViewsChart(p)); }
        catch (err) { console.error(err); }
        finally { setViewsLoading(false); }
    };

    const handleGrowthPeriod = async (p: Period) => {
        setGrowthPeriod(p); setGrowthLoading(true);
        try { setGrowth(await analyticsApi.getUserGrowth(p)); }
        catch (err) { console.error(err); }
        finally { setGrowthLoading(false); }
    };

    const handleForumPeriod = async (p: Period) => {
        setForumPeriod(p); setForumLoading(true);
        try { setForum(await analyticsApi.getForumStats(p)); }
        catch (err) { console.error(err); }
        finally { setForumLoading(false); }
    };

    if (pageLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 w-full">
                <Loader2 className="animate-spin" style={{ color: BRAND_ACCENT }} size={40} />
                <p className="text-sm uppercase font-bold tracking-widest" style={{ color: mainText, fontFamily: MONO }}>
                    Loading Dashboard
                </p>
            </div>
        );
    }

    const pieTypeData = content?.byType.map(d => ({
        name:  d.type.charAt(0).toUpperCase() + d.type.slice(1),
        value: d.count,
        color: TYPE_COLORS[d.type] ?? BRAND_ACCENT,
    })) ?? [];

    const pieStatusData = content?.byStatus.map(d => ({
        name:  d.status.charAt(0).toUpperCase() + d.status.slice(1),
        value: d.count,
        color: d.status === 'published' ? BRAND_ACCENT : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'),
    })) ?? [];

    const forumActivity = forum?.activity ?? [];

    return (
        <div className="space-y-8 px-2 py-6 sm:p-4 max-w-[1600px] mx-auto pb-24 transition-colors duration-300">

            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <FadeIn delay={0}>
                <div className="flex items-center justify-between gap-4 border-b pb-6" style={{ borderColor: cardBorder }}>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: mainText, fontFamily: FONT }}>Analytics</h1>
                        <p className="text-sm uppercase tracking-widest mt-1.5 font-bold" style={{ color: mainText, fontFamily: MONO }}>Operational Dashboard</p>
                    </div>
                    <button
                        onClick={() => fetchAll(true)}
                        disabled={refreshing}
                        className="flex items-center justify-center px-5 py-3 rounded-xl border font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95"
                        style={{ backgroundColor: cardBg, borderColor: cardBorder, color: mainText, fontFamily: MONO }}
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} style={{ color: BRAND_ACCENT }} />
                    </button>
                </div>
            </FadeIn>

            {/* ── KPI Cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FadeIn delay={40}>
                    <div className="border rounded-2xl p-6" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                        <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: mainText, fontFamily: MONO }}>Content Operations</p>
                        <div className="grid grid-cols-2 gap-4" style={{ borderColor: cardBorder }}>
                            <div>
                                <p className="text-sm font-bold" style={{ color: mainText, fontFamily: MONO }}>Total Posts</p>
                                <p className="text-4xl font-black tracking-tight leading-none mt-2" style={{ color: mainText, fontFamily: MONO }}>
                                    {(overview?.totalPosts ?? 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="pl-4" style={{ borderLeft: `1px solid ${divider}` }}>
                                <p className="text-sm font-bold" style={{ color: mainText, fontFamily: MONO }}>Total Views</p>
                                <p className="text-4xl font-black tracking-tight leading-none mt-2" style={{ color: mainText, fontFamily: MONO }}>
                                    {(overview?.totalViews ?? 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </FadeIn>
                <FadeIn delay={80}>
                    <div className="border rounded-2xl p-6" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                        <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: mainText, fontFamily: MONO }}>Community</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-bold" style={{ color: mainText, fontFamily: MONO }}>Platform Users</p>
                                <p className="text-4xl font-black tracking-tight leading-none mt-2" style={{ color: mainText, fontFamily: MONO }}>
                                    {(overview?.totalUsers ?? 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="pl-4" style={{ borderLeft: `1px solid ${divider}` }}>
                                <p className="text-sm font-bold" style={{ color: mainText, fontFamily: MONO }}>Forum Threads</p>
                                <p className="text-4xl font-black tracking-tight leading-none mt-2" style={{ color: mainText, fontFamily: MONO }}>
                                    {(overview?.totalForumThreads ?? 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>

            {/* ── Traffic + Growth Charts ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FadeIn delay={150}>
                    <div className="border rounded-2xl p-5 sm:p-6" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider" style={{ color: mainText, fontFamily: FONT }}>Traffic Streams</h3>
                                <p className="text-sm font-bold" style={{ color: mainText, fontFamily: MONO }}>Platform hit mapping</p>
                            </div>
                            <PeriodSelector value={viewsPeriod} onChange={handleViewsPeriod} loading={viewsLoading} isDark={isDark} />
                        </div>
                        <div className="w-full h-[240px] sm:h-[300px]">
                            {viewsLoading ? <ChartLoader /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={views?.data ?? []} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
                                        <defs>
                                            <linearGradient id="brandG" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#FF8C00" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#FF8C00" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: mainText, fontFamily: 'monospace', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: mainText, fontFamily: 'monospace', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '13px', paddingTop: '16px', fontFamily: 'monospace', color: mainText }} />
                                        <Area type="monotone" dataKey="total"    name="Total Hits"     stroke="#FF8C00" strokeWidth={2.5} fill="url(#brandG)" dot={false} />
                                        <Area type="monotone" dataKey="guests"   name="Guests"         stroke="#3B82F6" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 3" />
                                        <Area type="monotone" dataKey="loggedIn" name="Authenticated"  stroke="#10B981" strokeWidth={1.5} fill="none" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={180}>
                    <div className="border rounded-2xl p-5 sm:p-6" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider" style={{ color: mainText, fontFamily: FONT }}>User Acquisition</h3>
                                <p className="text-sm font-bold" style={{ color: mainText, fontFamily: MONO }}>Verified onboarding analytics</p>
                            </div>
                            <PeriodSelector value={growthPeriod} onChange={handleGrowthPeriod} loading={growthLoading} isDark={isDark} />
                        </div>
                        <div className="w-full h-[240px] sm:h-[300px]">
                            {growthLoading ? <ChartLoader /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={growth?.data ?? []} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: mainText, fontFamily: 'monospace', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: mainText, fontFamily: 'monospace', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '13px', paddingTop: '16px', fontFamily: 'monospace', color: mainText }} />
                                        <Line type="monotone" dataKey="total"      name="Total Roster" stroke="#FF8C00" strokeWidth={2.5} dot={false} />
                                        <Line type="monotone" dataKey="verified"   name="Verified"     stroke="#10B981" strokeWidth={1.5} dot={false} />
                                        <Line type="monotone" dataKey="unverified" name="Pending"      stroke="#EF4444" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </FadeIn>
            </div>

            {/* ── Content Breakdown Pies ───────────────────────────────────── */}
            <FadeIn delay={220}>
                <div className="border rounded-2xl p-5 sm:p-6" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                    <div className="mb-4">
                        <h3 className="text-base font-black uppercase tracking-wider" style={{ color: mainText, fontFamily: FONT }}>Content Structuring Models</h3>
                        <p className="text-sm font-bold" style={{ color: mainText, fontFamily: MONO }}>Ratios by type and post state</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {[
                            { data: pieTypeData,   label: 'Distribution by Medium' },
                            { data: pieStatusData, label: 'Lifecycle Processing State' },
                        ].map(({ data, label }) => (
                            <div key={label} className="border rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6" style={{ borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                                <div className="flex-shrink-0">
                                    <PieChart width={130} height={130}>
                                        <Pie data={data} cx={60} cy={60} innerRadius={40} outerRadius={56} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                    </PieChart>
                                </div>
                                <div className="flex flex-col gap-3 flex-1 w-full">
                                    <p className="text-xs uppercase tracking-widest font-bold border-b pb-1.5" style={{ color: mainText, borderColor: cardBorder, fontFamily: MONO }}>{label}</p>
                                    {data.map((d) => (
                                        <div key={d.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                                                <span className="font-bold" style={{ color: mainText, fontFamily: MONO }}>{d.name}</span>
                                            </div>
                                            <span className="font-black" style={{ color: mainText, fontFamily: MONO }}>{d.value}</span>
                                        </div>
                                    ))}
                                    {data.length === 0 && <p className="text-sm font-bold py-2" style={{ color: mainText, fontFamily: MONO }}>No data</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeIn>

            {/* ── Discussions Room Metrics — PostManager-style table ────────── */}
            <FadeIn delay={260}>
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>

                    {/* Table Header */}
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: `1px solid ${divider}` }}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {/* <div className="w-1 h-6 rounded-full" style={{ backgroundColor: BRAND_ACCENT }} /> */}
                                <h3 className="text-xl font-bold" style={{ color: mainText, fontFamily: FONT }}>Discussions Room Metrics</h3>
                            </div>
                            {/* <p className="text-xs font-bold uppercase tracking-[0.25em] pl-3" style={{ color: mainText, fontFamily: MONO }}>
                                Thread generations vs interaction replies
                            </p> */}
                        </div>
                        <PeriodSelector value={forumPeriod} onChange={handleForumPeriod} loading={forumLoading} isDark={isDark} />
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[500px]">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                    {['Date', 'Discussions Created', 'User Responses'].map((h, i) => (
                                        <th
                                            key={h}
                                            className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] ${i > 0 ? 'text-center' : 'text-left'}`}
                                            style={{ color: mainText, fontFamily: MONO }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {forumLoading ? (
                                    <TableLoader cols={3} />
                                ) : forumActivity.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-24 text-center">
                                            <p className="text-sm uppercase tracking-widest font-bold" style={{ color: mainText, fontFamily: MONO }}>No forum activity</p>
                                        </td>
                                    </tr>
                                ) : forumActivity.map((row: any, idx: number) => (
                                    <tr
                                        key={idx}
                                        className="transition-colors duration-150"
                                        style={{ borderBottom: idx < forumActivity.length - 1 ? `1px solid ${divider}` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold" style={{ color: mainText, fontFamily: MONO }}>{row.date}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
                                                style={{ color: BRAND_ACCENT, backgroundColor: ACCENT_MUTED, fontFamily: MONO }}
                                            >
                                                {row.threads?.toLocaleString() ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
                                                style={{ color: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)', fontFamily: MONO }}
                                            >
                                                {row.replies?.toLocaleString() ?? 0}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </FadeIn>

            {/* ── Top Performers Log — PostManager-style table ──────────────── */}
            <FadeIn delay={300}>
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>

                    {/* Table Header */}
                    <div className="px-6 py-5" style={{ borderBottom: `1px solid ${divider}` }}>
                        <div className="flex items-center gap-2 mb-1">
                            {/* <div className="w-1 h-6 rounded-full" style={{ backgroundColor: BRAND_ACCENT }} /> */}
                            <h3 className="text-xl font-bold" style={{ color: mainText, fontFamily: FONT }}>Top Performers Log</h3>
                        </div>
                        {/* <p className="text-xs font-bold uppercase tracking-[0.25em] pl-3" style={{ color: mainText, fontFamily: MONO }}>
                            Platform posts sorted by traffic view hits
                        </p> */}
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                    {['Rank', 'Post', 'Type', 'Views', 'Trending Score'].map((h, i) => (
                                        <th
                                            key={h}
                                            className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] ${i >= 3 ? 'text-right' : 'text-left'}`}
                                            style={{ color: mainText, fontFamily: MONO }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topPosts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <p className="text-sm uppercase tracking-widest font-bold" style={{ color: mainText, fontFamily: MONO }}>No data</p>
                                        </td>
                                    </tr>
                                ) : topPosts.map((post, idx) => {
                                    const badge = TYPE_BADGE[post.type] ?? { color: BRAND_ACCENT, bg: ACCENT_MUTED };
                                    return (
                                        <tr
                                            key={post._id}
                                            className="group transition-colors duration-150"
                                            style={{ borderBottom: idx < topPosts.length - 1 ? `1px solid ${divider}` : 'none' }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            {/* Rank */}
                                            <td className="px-6 py-4">
                                                <span
                                                    className="text-sm font-black"
                                                    style={{ color: idx < 3 ? BRAND_ACCENT : mainText, fontFamily: MONO }}
                                                >
                                                    {String(idx + 1).padStart(2, '0')}
                                                </span>
                                            </td>

                                            {/* Post */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                                        style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}` }}
                                                    >
                                                        {post.thumbnail
                                                            ? <img src={post.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                                                            : <ImageIcon size={15} style={{ color: mainText }} />
                                                        }
                                                    </div>
                                                    <p className="text-sm font-bold truncate max-w-[280px]" style={{ color: mainText, fontFamily: FONT }}>
                                                        {post.title}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="px-6 py-4">
                                                <span
                                                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
                                                    style={{ color: badge.color, backgroundColor: badge.bg, fontFamily: MONO }}
                                                >
                                                    {post.type}
                                                </span>
                                            </td>

                                            {/* Views */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5" style={{ color: mainText }}>
                                                    <Eye size={14} />
                                                    <span className="text-sm font-bold" style={{ fontFamily: MONO }}>
                                                        {post.views.toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Trending Score */}
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black" style={{ color: BRAND_ACCENT, fontFamily: MONO }}>
                                                    {post.trendingScore.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </FadeIn>

        </div>
    );
}