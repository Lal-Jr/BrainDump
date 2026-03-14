import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, togglePublish, deletePost, fetchAnalytics } from '../api';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | draft | published
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | posts | comments
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [postsData, analyticsData] = await Promise.all([
        fetchPosts(),
        fetchAnalytics().catch(() => null),
      ]);
      setPosts(postsData);
      setAnalytics(analyticsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(id) {
    try {
      await togglePublish(id);
      await loadData();
    } catch (e) {
      toast.error('Failed to toggle publish: ' + e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePost(id);
      await loadData();
    } catch (e) {
      toast.error('Failed to delete: ' + e.message);
    }
  }

  const filtered = posts.filter(p => {
    if (filter === 'draft') return !p.published;
    if (filter === 'published') return p.published;
    return true;
  });

  const counts = {
    all: posts.length,
    draft: posts.filter(p => !p.published).length,
    published: posts.filter(p => p.published).length,
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const stats = analytics?.stats || {};
  const chart = analytics?.chart || [];
  const maxChartVal = Math.max(...chart.map(d => d.views), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dashboard header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-600 mt-2 font-medium">
            Manage your blog, track performance
          </p>
        </div>
        <Link to="/admin/create" className="btn-primary flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">New Post</span>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Posts" value={stats.totalPosts ?? counts.all} icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        } />
        <StatCard label="Published" value={stats.published ?? counts.published} color="emerald" icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        } />
        <StatCard label="Drafts" value={stats.drafts ?? counts.draft} color="amber" icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
        } />
        <StatCard label="Total Views" value={stats.totalViews ?? 0} color="brand" icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        } />
        <StatCard label="Today" value={stats.todayViews ?? 0} color="violet" icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        } />
        <StatCard label="Comments" value={stats.totalComments ?? 0} color="sky" icon={
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        } />
      </div>

      {/* Views chart */}
      {chart.length > 0 && (
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Page Views</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Last 30 days</p>
            </div>
            <span className="text-xs text-zinc-700 font-medium">
              {stats.weekViews ?? 0} this week
            </span>
          </div>
          <div className="flex items-end gap-[3px] h-28">
            {chart.map((d, i) => {
              const height = maxChartVal > 0 ? (d.views / maxChartVal) * 100 : 0;
              const isToday = i === chart.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-surface-300 border border-zinc-800/60 px-2 py-1 rounded-lg text-[10px] text-zinc-300 font-medium whitespace-nowrap z-10 shadow-lg">
                    {d.views} view{d.views !== 1 ? 's' : ''} · {new Date(d.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${
                      isToday
                        ? 'bg-brand-500 shadow-sm shadow-brand-500/30'
                        : d.views > 0
                          ? 'bg-brand-500/40 group-hover:bg-brand-500/60'
                          : 'bg-zinc-800/40 group-hover:bg-zinc-700/40'
                    }`}
                    style={{ height: `${Math.max(height, 2)}%`, minHeight: '2px' }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-zinc-700">30d ago</span>
            <span className="text-[10px] text-zinc-700">Today</span>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="tab-group">
        <button
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'tab-item-active' : 'tab-item'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
          </svg>
          Overview
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={activeTab === 'posts' ? 'tab-item-active' : 'tab-item'}
        >
          Posts
          <span className="text-xs text-zinc-600 ml-1">({counts.all})</span>
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={activeTab === 'comments' ? 'tab-item-active' : 'tab-item'}
        >
          Comments
          <span className="text-xs text-zinc-600 ml-1">({stats.totalComments ?? 0})</span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Top posts */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Top Posts by Views
            </h3>
            {(analytics?.topPosts || []).length === 0 ? (
              <p className="text-sm text-zinc-700 py-4 text-center">No view data yet</p>
            ) : (
              <div className="space-y-2">
                {(analytics?.topPosts || []).map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/admin/edit/${p.id}`}
                    className="flex items-center gap-3 p-2.5 -mx-1 rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    <span className="w-6 h-6 rounded-lg bg-surface-300 flex items-center justify-center text-[11px] font-bold text-zinc-600 shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                      {p.title}
                    </span>
                    <span className="text-xs text-zinc-600 font-medium shrink-0">
                      {p.views} view{p.views !== 1 ? 's' : ''}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent comments */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Recent Comments
            </h3>
            {(analytics?.recentComments || []).length === 0 ? (
              <p className="text-sm text-zinc-700 py-4 text-center">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {(analytics?.recentComments || []).slice(0, 5).map(c => (
                  <div key={c.id} className="flex gap-3 p-2 -mx-1">
                    <div className="w-7 h-7 rounded-full bg-surface-300 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-semibold text-zinc-600 uppercase">
                        {(c.name || 'A')[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-zinc-400">{c.name || 'Anonymous'}</span>
                        <span className="text-[10px] text-zinc-700">
                          {timeAgo(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">{c.text}</p>
                      <Link
                        to={`/admin/edit/${c.postId}`}
                        className="text-[10px] text-zinc-700 hover:text-brand-400 transition-colors mt-1 inline-block"
                      >
                        on: {c.postTitle}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter tabs */}
          <div className="tab-group">
            {['all', 'draft', 'published'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'tab-item-active' : 'tab-item'}
              >
                {f}
                <span className="ml-1.5 text-zinc-600 text-xs">({counts[f]})</span>
              </button>
            ))}
          </div>

          {/* Posts list */}
          {filtered.length === 0 ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-surface-300 rotate-3" />
                <div className="absolute inset-0 rounded-2xl bg-surface-200 -rotate-2 flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h3m-3 0v3m0-3v-3m-9 3h.008v.008H3V15m0 2.25h.008v.008H3V17.25m0 2.25h.008v.008H3V19.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-zinc-500 font-medium">No posts yet</p>
              <p className="text-zinc-700 text-sm mt-1.5">Start by recording a brain dump</p>
              <Link to="/admin/create" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm mt-4 transition-colors">
                Create your first post
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((post, i) => (
                <div key={post.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in-up">
                  <PostCard
                    post={post}
                    onPublish={handlePublish}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-3 animate-fade-in">
          {(analytics?.recentComments || []).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-600 font-medium">No comments yet</p>
              <p className="text-zinc-700 text-sm mt-1">Comments will appear here once readers engage with your posts</p>
            </div>
          ) : (
            (analytics?.recentComments || []).map((c, i) => (
              <div
                key={c.id}
                className="card p-4 flex gap-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="w-9 h-9 rounded-full bg-surface-300 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-zinc-500 uppercase">
                    {(c.name || 'A')[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-300">{c.name || 'Anonymous'}</span>
                    <span className="text-xs text-zinc-700">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{c.text}</p>
                  <Link
                    to={`/admin/edit/${c.postId}`}
                    className="text-xs text-zinc-700 hover:text-brand-400 transition-colors mt-2 inline-flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    {c.postTitle}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'zinc', icon }) {
  const colorMap = {
    zinc: 'text-zinc-500 bg-zinc-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    brand: 'text-brand-400 bg-brand-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
  };
  const colors = colorMap[color] || colorMap.zinc;

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className={`w-8 h-8 rounded-lg ${colors} flex items-center justify-center`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</p>
        <p className="text-[11px] text-zinc-600 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
