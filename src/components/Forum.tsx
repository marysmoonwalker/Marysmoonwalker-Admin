import { useEffect, useState } from 'react';
import { MessageSquare, Pin, Plus, Trash2, CreditCard as Edit2, Clock, User, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// Local interface since types.ts was removed
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  replies_count: number;
  is_pinned: boolean;
  created_at: string;
}

const DUMMY_POSTS: ForumPost[] = [
  {
    id: '1',
    title: 'Welcome to the Creative Hub!',
    content: 'This is a space for African creators to share their work and collaborate. Feel free to introduce yourself!',
    author: 'Admin',
    replies_count: 24,
    is_pinned: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'How to use the new Music Marketplace?',
    content: 'I am having some trouble uploading my beats. Can anyone guide me through the process?',
    author: 'Heritage',
    replies_count: 5,
    is_pinned: false,
    created_at: new Date().toISOString(),
  }
];

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ForumPost | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', author: 'Admin', replies_count: 0, is_pinned: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    // Simulating API call
    setTimeout(() => {
      setPosts(DUMMY_POSTS);
      setLoading(false);
      setIsLoaded(true);
    }, 500);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);

    // DUMMY SAVE LOGIC
    setTimeout(() => {
      if (editing) {
        setPosts(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p));
      } else {
        const newPost: ForumPost = {
          ...form,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
        };
        setPosts(prev => [newPost, ...prev]);
      }
      setSaving(false);
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', content: '', author: 'Admin', replies_count: 0, is_pinned: false });
    }, 600);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this forum thread?')) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function togglePin(post: ForumPost) {
    setPosts((prev) =>
      prev.map((p) => p.id === post.id ? { ...p, is_pinned: !p.is_pinned } : p)
        .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
    );
  }

  function startEdit(post: ForumPost) {
    setEditing(post);
    setForm({ title: post.title, content: post.content, author: post.author, replies_count: post.replies_count, is_pinned: post.is_pinned });
    setShowForm(true);
  }

  const pinned = posts.filter((p) => p.is_pinned);
  const total = posts.length;
  const totalReplies = posts.reduce((sum, p) => sum + p.replies_count, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-[#C9A84C]/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-[#C9A84C]" />
            <span className="text-gray-400 text-xs uppercase tracking-wider">Total Threads</span>
          </div>
          <p className="text-3xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-[#111] border border-[#C9A84C]/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Pin size={16} className="text-[#C9A84C]" />
            <span className="text-gray-400 text-xs uppercase tracking-wider">Pinned</span>
          </div>
          <p className="text-3xl font-bold text-white">{pinned.length}</p>
        </div>
        <div className="bg-[#111] border border-[#C9A84C]/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-[#C9A84C]" />
            <span className="text-gray-400 text-xs uppercase tracking-wider">Total Replies</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalReplies.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <MessageSquare size={18} className="text-[#C9A84C]" /> Forum Threads
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchPosts} className="w-8 h-8 rounded-lg bg-[#111] border border-[#C9A84C]/15 flex items-center justify-center text-gray-400 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all duration-200">
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', content: '', author: 'Admin', replies_count: 0, is_pinned: false }); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-black font-bold rounded-lg hover:from-[#F0C040] hover:to-[#C9A84C] transition-all duration-300 hover:scale-105 text-sm shadow-lg shadow-[#C9A84C]/20"
          >
            <Plus size={16} /> New Thread
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#111] border border-[#C9A84C]/30 rounded-xl p-5 animate-fade-in">
          <h3 className="text-[#C9A84C] font-semibold text-sm mb-4">{editing ? 'Edit Thread' : 'New Forum Thread'}</h3>
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Thread title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-[#0d0d0d] border border-[#C9A84C]/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 text-sm"
            />
            <textarea
              placeholder="Thread content..."
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={3}
              className="w-full bg-[#0d0d0d] border border-[#C9A84C]/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 text-sm resize-none"
            />
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Author name"
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                className="flex-1 bg-[#0d0d0d] border border-[#C9A84C]/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 text-sm"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors duration-300 ${form.is_pinned ? 'bg-[#C9A84C]' : 'bg-gray-700'} relative`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${form.is_pinned ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-gray-400 text-xs">Pin thread</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-black font-bold rounded-lg hover:from-[#F0C040] hover:to-[#C9A84C] transition-all duration-300 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Create Thread'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-5 py-2 border border-gray-700 text-gray-400 rounded-lg hover:text-white hover:border-gray-500 transition-all duration-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-[#111] border border-[#C9A84C]/10 rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <div
              key={post.id}
              className={`bg-[#111] border rounded-xl overflow-hidden transition-all duration-300 group ${post.is_pinned ? 'border-[#C9A84C]/40' : 'border-[#C9A84C]/10 hover:border-[#C9A84C]/25'
                } ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer relative"
                onClick={() => setExpanded(expanded === post.id ? null : post.id)}
              >
                {post.is_pinned && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C9A84C] to-[#8B6914]" />
                )}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A84C]/20 to-[#5a4208]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C9A84C] font-bold text-sm">{post.author[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {post.is_pinned && (
                      <span className="flex items-center gap-1 text-xs text-[#C9A84C] font-medium">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    <p className="text-white font-medium text-sm group-hover:text-[#C9A84C] transition-colors duration-200 line-clamp-1">{post.title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><User size={10} /> {post.author}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={10} /> {post.replies_count} replies</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(post); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${post.is_pinned ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-gray-800 text-gray-600 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10'
                      }`}
                  >
                    <Pin size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(post); }}
                    className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                    className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                  {expanded === post.id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                </div>
              </div>
              {expanded === post.id && (
                <div className="px-4 pb-4 border-t border-[#C9A84C]/10 pt-3 ml-13">
                  <p className="text-gray-400 text-sm leading-relaxed">{post.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}