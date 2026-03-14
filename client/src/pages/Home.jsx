import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, togglePublish, deletePost } from '../api';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | draft | published

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await fetchPosts();
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(id) {
    try {
      await togglePublish(id);
      await loadPosts();
    } catch (e) {
      alert('Failed to toggle publish: ' + e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (e) {
      alert('Failed to delete: ' + e.message);
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

  if (loading) return <LoadingSpinner text="Loading posts..." />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight">
            Your Posts
          </h1>
          <p className="text-sm text-zinc-600 mt-2 font-medium">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} · {counts.published} live · {counts.draft} drafts
          </p>
        </div>
        <Link to="/create" className="btn-primary flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">New Post</span>
        </Link>
      </div>

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
          <Link to="/create" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm mt-4 transition-colors">
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
  );
}
