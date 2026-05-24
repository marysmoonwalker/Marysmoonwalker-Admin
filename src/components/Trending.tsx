import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, CreditCard as Edit2, BarChart2, Eye, RefreshCw } from 'lucide-react';

// Local interface since types.ts was removed
export interface TrendingTopic {
  id: string;
  title: string;
  views: number;
  change_percent: number;
  category: string;
  created_at: string;
}

const DUMMY_TOPICS: TrendingTopic[] = [
  { id: '1', title: 'Afrobeats Global Takeover', views: 150200, change_percent: 12.5, category: 'Music', created_at: new Date().toISOString() },
  { id: '2', title: 'No-Code Revolution 2026', views: 85400, change_percent: 8.2, category: 'Tech', created_at: new Date().toISOString() },
  { id: '3', title: 'Legacy of MJ', views: 62100, change_percent: -2.4, category: 'Legacy', created_at: new Date().toISOString() },
  { id: '4', title: 'Street Dance Finals', views: 45000, change_percent: 15.0, category: 'Dance', created_at: new Date().toISOString() },
];

export default function Trending() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TrendingTopic | null>(null);
  const [form, setForm] = useState({ title: '', views: 0, change_percent: 0, category: 'General' });
  const [saving, setSaving] = useState(false);

  const CATEGORIES = ['Music', 'Dance', 'Legacy', 'Media', 'News', 'Tours', 'Fashion', 'General'];

  useEffect(() => {
    fetchTopics();
  }, []);

  async function fetchTopics() {
    setLoading(true);
    // Simulating API Fetch
    setTimeout(() => {
      setTopics(DUMMY_TOPICS);
      setLoading(false);
      setIsLoaded(true);
    }, 500);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);

    // DUMMY SAVE LOGIC
    setTimeout(() => {
      if (editing) {
        setTopics(prev => prev.map(t => t.id === editing.id ? { ...t, ...form } : t));
      } else {
        const newTopic: TrendingTopic = {
          ...form,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        };
        setTopics(prev => [...prev, newTopic].sort((a, b) => b.views - a.views));
      }
      setSaving(false);
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', views: 0, change_percent: 0, category: 'General' });
    }, 600);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this trending topic?')) return;
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }

  function startEdit(topic: TrendingTopic) {
    setEditing(topic);
    setForm({ title: topic.title, views: topic.views, change_percent: topic.change_percent, category: topic.category });
    setShowForm(true);
  }

  const totalViews = topics.reduce((sum, t) => sum + t.views, 0);
  const topTopic = topics[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-[#C9A84C]/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={16} className="text-[#C9A84C]" />
            <span className="text-gray-400 text-xs uppercase tracking-wider">Total Topics</span>
          </div>
          <p className="text-3xl font-bold text-white">{topics.length}</p>
        </div>
        <div className="bg-[#111] border border-[#C9A84C]/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-[#C9A84C]" />
            <span className="text-gray-400 text-xs uppercase tracking-wider">Combined Views</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-[#111] border border-[#C9A84C]/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#C9A84C]" />
            <span className="text-gray-400 text-xs uppercase tracking-wider">Top Topic</span>
          </div>
          <p className="text-white font-semibold text-sm truncate">{topTopic?.title || '—'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <TrendingUp size={18} className="text-[#C9A84C]" /> Trending Topics
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchTopics} className="w-8 h-8 rounded-lg bg-[#111] border border-[#C9A84C]/15 flex items-center justify-center text-gray-400 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all duration-200">
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', views: 0, change_percent: 0, category: 'General' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-black font-bold rounded-lg hover:from-[#F0C040] hover:to-[#C9A84C] transition-all duration-300 hover:scale-105 text-sm shadow-lg shadow-[#C9A84C]/20"
          >
            <Plus size={16} /> Add Topic
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#111] border border-[#C9A84C]/30 rounded-xl p-5 animate-fade-in">
          <h3 className="text-[#C9A84C] font-semibold text-sm mb-4">{editing ? 'Edit Topic' : 'New Trending Topic'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Topic title..."
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#0d0d0d] border border-[#C9A84C]/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 text-sm"
              />
            </div>
            <input
              type="number"
              placeholder="Views"
              value={form.views}
              onChange={(e) => setForm((f) => ({ ...f, views: Number(e.target.value) }))}
              className="bg-[#0d0d0d] border border-[#C9A84C]/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 text-sm"
            />
            <input
              type="number"
              placeholder="Change %"
              value={form.change_percent}
              onChange={(e) => setForm((f) => ({ ...f, change_percent: Number(e.target.value) }))}
              className="bg-[#0d0d0d] border border-[#C9A84C]/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="bg-[#0d0d0d] border border-[#C9A84C]/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#C9A84C]/50 text-sm"
            >
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-black font-bold rounded-lg hover:from-[#F0C040] hover:to-[#C9A84C] transition-all duration-300 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Add Topic'}
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
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-[#111] border border-[#C9A84C]/10 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic, i) => {
            const maxViews = topics[0]?.views || 1;
            const pct = (topic.views / maxViews) * 100;
            return (
              <div
                key={topic.id}
                className={`bg-[#111] border border-[#C9A84C]/10 rounded-xl p-4 hover:border-[#C9A84C]/30 transition-all duration-300 group ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A84C]/20 to-[#8B6914]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#C9A84C] font-bold text-sm">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-white font-medium text-sm truncate group-hover:text-[#C9A84C] transition-colors duration-200">{topic.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C]/80">{topic.category}</span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${topic.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {topic.change_percent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {Math.abs(topic.change_percent)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#C9A84C] to-[#8B6914] rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs flex items-center gap-1 flex-shrink-0">
                        <Eye size={10} /> {topic.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => startEdit(topic)} className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(topic.id)} className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}