import React, { useEffect, useState } from 'react';
import { forumService, IForumThread, IForumReply } from '../services/forum';
import { ArrowLeft, Trash2, Shield, Heart, ImageIcon, Loader2 } from 'lucide-react';

interface ThreadModeratorProps {
    threadId: string;
    onBack: () => void;
}

export default function ThreadModerator({ threadId, onBack }: ThreadModeratorProps) {
    const [data, setData] = useState<{ thread: IForumThread; replies: IForumReply[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await forumService.getThreadDetails(threadId);
                setData(res);
            } finally { 
                setLoading(false); 
            }
        };
        fetch();
    }, [threadId]);

    const handleDeleteReply = async (replyId: string) => {
        if (!window.confirm("Remove this reply?")) return;
        try {
            await forumService.deleteReply(replyId);
            setData(prev => prev ? { ...prev, replies: prev.replies.filter(r => r._id !== replyId) } : null);
        } catch (err) { 
            alert("Failed to delete reply"); 
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" style={{ color: '#FF8C00' }} />
            </div>
        );
    }
    
    if (!data) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up px-1 md:px-0 w-full">
            {/* Back Navigation Trigger Button */}
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-xs uppercase tracking-widest transition-all focus:outline-none hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
            >
                <ArrowLeft size={14} /> Back to Dashboard
            </button>

            {/* Main Thread Content Card Frame Layout */}
            <div 
                className="p-5 md:p-8 rounded-2xl border transition-all"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
                <span 
                    className="text-[10px] font-bold uppercase tracking-[0.4em]"
                    style={{ color: '#FF8C00' }}
                >
                    {data.thread.category}
                </span>
                
                <h1 
                    className="text-2xl md:text-3xl font-bold mt-3 mb-5 md:mb-6 leading-tight" 
                    style={{ color: 'var(--text-primary)' }}
                >
                    {data.thread.title}
                </h1>
                
                <div 
                    className="flex flex-row items-center gap-3.5 py-4 border-y"
                    style={{ borderColor: 'var(--border)' }}
                >
                    <img src={data.thread.author.avatar} className="w-9 h-9 md:w-10 md:h-10 rounded-full border" style={{ borderColor: 'var(--border)' }} alt="" />
                    <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>@{data.thread.author.username}</p>
                        <p className="text-[10px] uppercase mt-0.5" style={{ color: 'var(--text-secondary)' }}>{new Date(data.thread.createdAt).toLocaleString()}</p>
                    </div>
                </div>
                
                <p 
                    className="leading-relaxed text-base md:text-lg whitespace-pre-wrap pt-2"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {data.thread.body}
                </p>
            </div>

            {/* Replies Stream Cluster Wrapper */}
            <div className="space-y-4 w-full">
                <h3 
                    className="text-xs font-bold uppercase tracking-[0.3em] px-2"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Replies ({data.replies.length})
                </h3>
                
                {data.replies.map((reply) => (
                    <div 
                        key={reply._id} 
                        className="p-5 md:p-6 rounded-2xl border relative group transition-all"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    >
                        <div className="flex justify-between items-start mb-4 gap-2">
                            <div className="flex items-center gap-3">
                                <img src={reply.author.avatar} className="w-8 h-8 rounded-full grayscale border" style={{ borderColor: 'var(--border)' }} alt="" />
                                <div>
                                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>@{reply.author.username}</p>
                                    <p className="text-[9px] uppercase mt-0.5" style={{ color: 'var(--text-secondary)' }}>{new Date(reply.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteReply(reply._id)}
                                className="p-2 rounded-lg border transition-all hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-500 shrink-0"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {reply.imageUrl && (
                            <div className="w-full mb-4 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                                <img src={reply.imageUrl} className="w-full max-h-80 object-cover" alt="" />
                            </div>
                        )}

                        <p 
                            className="text-sm leading-relaxed whitespace-pre-wrap"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {reply.body}
                        </p>
                        
                        <div className="mt-4 flex items-center gap-4">
                            <div 
                                className="flex items-center gap-1.5 text-[10px] uppercase font-medium tracking-wider"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <Heart size={12} style={{ color: '#FF8C00' }} fill="rgba(255,140,0,0.1)" />
                                <span>{reply.likes.length} Likes</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}