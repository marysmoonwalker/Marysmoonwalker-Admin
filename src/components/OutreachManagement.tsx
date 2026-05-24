import React, { useEffect, useState, useCallback } from 'react';
import { 
    RefreshCw, Loader2, Check, ExternalLink, 
    Mail, MessageSquare, Eye, X 
} from 'lucide-react';
import { outreachApi, ISubscriber, IContactMessage } from '../services/outreach';

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

export default function OutreachManagement() {
    const isDark = useTheme();

    const bg       = isDark ? '#0A0A0A' : '#F8F9FA';
    const cardBg   = isDark ? '#111111' : '#FFFFFF';
    const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
    const text     = isDark ? '#FFFFFF'  : '#000000';
    const inputBg  = isDark ? '#0D0D0D'  : '#F0F0F0';
    const rowHover = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    const divider  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    const [activeTab, setActiveTab] = useState<'messages' | 'subscribers'>('messages');
    const [subscribers, setSubscribers] = useState<ISubscriber[]>([]);
    const [messages, setMessages] = useState<IContactMessage[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [readFilter, setReadFilter] = useState<'all' | 'true' | 'false'>('all');
    
    // Modal state controllers
    const [selectedMessage, setSelectedMessage] = useState<IContactMessage | null>(null);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            if (activeTab === 'subscribers') {
                const res = await outreachApi.getSubscribers();
                setSubscribers(res.data.subscribers);
            } else {
                const apiFilter = readFilter === 'all' ? undefined : readFilter;
                const res = await outreachApi.getContactMessages(apiFilter);
                setMessages(res.data.messages);
            }
        } catch (err) {
            console.error('Data loading failure:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, readFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await outreachApi.markAsRead(id);
            setMessages(prev => prev.map(msg => msg._id === id ? { ...msg, read: true } : msg));
            if (selectedMessage && selectedMessage._id === id) {
                setSelectedMessage(prev => prev ? { ...prev, read: true } : null);
            }
        } catch (err) {
            console.error('Status upgrade failed:', err);
        }
    };

    const handleOpenModal = (msg: IContactMessage) => {
        setSelectedMessage(msg);
        if (!msg.read) {
            handleMarkAsRead(msg._id);
        }
    };

    const handleGmailReply = (msg: IContactMessage, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const subject = encodeURIComponent(`Re: Inquiry from ${msg.name}`);
        const body = encodeURIComponent(`Hi ${msg.name},\n\nThank you for reaching out. Regarding your message:\n"${msg.message}"\n\nBest regards,\n`);
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${msg.email}&su=${subject}&body=${body}`;
        window.open(gmailUrl, '_blank');
    };

    return (
        <div className="min-h-screen w-full space-y-6" style={{ backgroundColor: bg }}>
            
            {/* ── Header Layout Panel ────────────────────────────────────────── */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold" style={{ color: text, fontFamily: FONT }}>
                                Outreach Hub
                            </h2>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] pl-1" style={{ color: text, fontFamily: MONO }}>
                            Communication Sync · {activeTab === 'messages' ? messages.length : subscribers.length} logs captured
                        </p>
                    </div>

                    {/* Navigation Tab Systems */}
                    <div className="flex flex-wrap items-center gap-3">
                        {activeTab === 'messages' && (
                            <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: inputBg, borderColor: border }}>
                                {(['all', 'false', 'true'] as const).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setReadFilter(filter)}
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
                                        style={{
                                            backgroundColor: readFilter === filter ? ACCENT : 'transparent',
                                            color: readFilter === filter ? '#000000' : text,
                                            fontFamily: MONO
                                        }}
                                    >
                                        {filter === 'all' ? 'All' : filter === 'false' ? 'Unread' : 'Read'}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: inputBg, borderColor: border }}>
                            {(['messages', 'subscribers'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setLoading(true); }}
                                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200"
                                    style={{
                                        backgroundColor: activeTab === tab ? ACCENT : 'transparent',
                                        color: activeTab === tab ? '#000000' : text,
                                        fontFamily: MONO,
                                    }}
                                >
                                    {tab === 'messages' ? <MessageSquare size={13} /> : <Mail size={13} />}
                                    {tab}
                                </button>
                            ))}
                        </div>

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

            {/* ── Dynamic Table Framework Workspace ───────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                <div className="overflow-x-auto w-full">
                    {activeTab === 'messages' ? (
                        <table className="w-full min-w-[768px]">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                    {['Status', 'Sender', 'Email', 'Timestamp Log', 'Actions'].map((h) => {
                                        const isRight = h === 'Actions';
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
                                        <td colSpan={5} className="py-24 text-center">
                                            <Loader2 className="animate-spin inline" style={{ color: ACCENT }} size={24} />
                                        </td>
                                    </tr>
                                ) : messages.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <p className="text-sm uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                                No communication logs found
                                            </p>
                                        </td>
                                    </tr>
                                ) : messages.map((msg, idx) => (
                                    <tr
                                        key={msg._id}
                                        onClick={() => handleOpenModal(msg)}
                                        className="group transition-colors duration-150 cursor-pointer"
                                        style={{ borderBottom: idx < messages.length - 1 ? `1px solid ${divider}` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <td className="px-6 py-4">
                                            <span
                                                className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border font-mono"
                                                style={{
                                                    borderColor: msg.read ? border : ACCENT_BORDER,
                                                    backgroundColor: msg.read ? 'transparent' : ACCENT_MUTED,
                                                    color: msg.read ? text : ACCENT
                                                }}
                                            >
                                                {msg.read ? 'Read' : 'New'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold truncate max-w-[180px]" style={{ color: text, fontFamily: FONT }}>
                                                {msg.name}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold tracking-wide" style={{ color: text, fontFamily: MONO }}>
                                                {msg.email}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold" style={{ color: text, fontFamily: MONO }}>
                                                {new Date(msg.createdAt).toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleOpenModal(msg)}
                                                    title="View Message Payload"
                                                    className="p-2 rounded-lg transition-all duration-200 border"
                                                    style={{ borderColor: border, backgroundColor: 'transparent', color: text }}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleGmailReply(msg, e)}
                                                    title="Redirect Mail Pipeline"
                                                    className="p-2 rounded-lg transition-all duration-200 border"
                                                    style={{ borderColor: border, backgroundColor: 'transparent', color: text }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.color = ACCENT;
                                                        e.currentTarget.style.borderColor = ACCENT_BORDER;
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.color = text;
                                                        e.currentTarget.style.borderColor = border;
                                                    }}
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* Newsletter Table Roster */
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${divider}` }}>
                                    {['Index', 'Subscriber Email Matrix', 'Timestamp Metric'].map((h, i) => {
                                        const isRight = h === 'Timestamp Metric';
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
                                        <td colSpan={3} className="py-24 text-center">
                                            <Loader2 className="animate-spin inline" style={{ color: ACCENT }} size={24} />
                                        </td>
                                    </tr>
                                ) : subscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-24 text-center">
                                            <p className="text-sm uppercase tracking-widest font-bold" style={{ color: text, fontFamily: MONO }}>
                                                No active records registered
                                            </p>
                                        </td>
                                    </tr>
                                ) : subscribers.map((sub, idx) => (
                                    <tr
                                        key={sub._id}
                                        className="transition-colors duration-150"
                                        style={{ borderBottom: idx < subscribers.length - 1 ? `1px solid ${divider}` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHover)}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black" style={{ color: ACCENT, fontFamily: MONO }}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold" style={{ color: text, fontFamily: MONO }}>
                                                {sub.email}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-xs font-bold" style={{ color: text, fontFamily: MONO }}>
                                                {new Date(sub.createdAt).toLocaleString()}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── Overlay Reader View Modal Component ─────────────────────────── */}
            {selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border flex flex-col max-h-[85vh]"
                        style={{ backgroundColor: cardBg, borderColor: border }}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex items-start justify-between" style={{ borderBottom: `1px solid ${divider}` }}>
                            <div>
                                <span 
                                    className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border font-mono mb-2 inline-block"
                                    style={{ borderColor: ACCENT_BORDER, color: ACCENT, backgroundColor: ACCENT_MUTED }}
                                >
                                    Transmission Log File
                                </span>
                                <h3 className="text-xl font-bold tracking-tight" style={{ color: text, fontFamily: FONT }}>
                                    Message from {selectedMessage.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="p-1.5 rounded-lg border transition-all duration-200"
                                style={{ borderColor: border, color: text }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Data Fields */}
                        <div className="p-6 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/10 dark:bg-white/[0.02] p-4 rounded-xl border" style={{ borderColor: border }}>
                                <div>
                                    <p className="uppercase opacity-40 font-bold tracking-wider mb-0.5">Sender Email</p>
                                    <p className="text-sm font-bold break-all" style={{ color: text }}>{selectedMessage.email}</p>
                                </div>
                                <div>
                                    <p className="uppercase opacity-40 font-bold tracking-wider mb-0.5">Timestamp Matrix</p>
                                    <p className="text-sm font-bold" style={{ color: text }}>{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <p className="uppercase opacity-40 font-bold tracking-wider">Payload Content</p>
                                <div 
                                    className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap font-sans border min-h-[120px]" 
                                    style={{ backgroundColor: inputBg, borderColor: border, color: text, fontFamily: FONT }}
                                >
                                    {selectedMessage.message}
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Controls Footer */}
                        <div className="p-4 flex items-center justify-end gap-3 bg-black/5 dark:bg-white/[0.01]" style={{ borderTop: `1px solid ${divider}` }}>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all"
                                style={{ borderColor: border, color: text, fontFamily: MONO }}
                            >
                                Close
                            </button>
                            <button
                                onClick={(e) => { handleGmailReply(selectedMessage, e); setSelectedMessage(null); }}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-black transition-all"
                                style={{ backgroundColor: ACCENT }}
                            >
                                <ExternalLink size={13} />
                                Reply Mail
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}