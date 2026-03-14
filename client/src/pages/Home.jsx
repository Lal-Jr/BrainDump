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

  if (loading) return <LoadingSpinner text="Loading posts..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Your Posts</h1>
          <p className="text-sm text-slate-500 mt-1">{posts.length} total posts</p>
        </div>
        <Link to="/create" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New Post</span>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-xl p-1 w-fit">
        {['all', 'draft', 'published'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="text-slate-500">No posts yet</p>
          <Link to="/create" className="text-brand-400 hover:text-brand-300 text-sm mt-2 inline-block">
            Create your first brain dump →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onPublish={handlePublish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
