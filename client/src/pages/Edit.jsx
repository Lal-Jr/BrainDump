import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPost, updatePost, togglePublish, deletePost, fetchRawMarkdown, saveRawMarkdown } from '../api';
import PostEditor from '../components/PostEditor';
import MarkdownRenderer from '../components/MarkdownRenderer';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('edit'); // edit | raw | preview
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadPost();
  }, [id]);

  async function loadPost() {
    try {
      setLoading(true);
      const data = await fetchPost(id);
      setPost(data);
      const raw = await fetchRawMarkdown(id);
      setRawMarkdown(raw);
    } catch (e) {
      alert('Failed to load post: ' + e.message);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function handleSave({ title, content, tags }) {
    try {
      setSaving(true);
      const updated = await updatePost(id, { title, content, tags });
      setPost(updated);
      showToast('Changes saved');
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRaw() {
    try {
      setSaving(true);
      const updated = await saveRawMarkdown(id, rawMarkdown);
      setPost(updated);
      showToast('Raw markdown saved');
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    try {
      const updated = await togglePublish(id);
      setPost(updated);
      showToast(updated.published ? 'Published!' : 'Unpublished');
    } catch (e) {
      alert('Publish failed: ' + e.message);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await deletePost(id);
      navigate('/admin');
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  }

  if (loading) return <LoadingSpinner text="Loading post..." />;
  if (!post) return null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] toast-enter">
          <div className="flex items-center gap-2.5 bg-surface-300 border border-zinc-800/60 text-zinc-100 px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl shadow-black/40 backdrop-blur-xl">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {toast}
          </div>
        </div>
      )}

      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Link to="/admin" className="p-2 -ml-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-zinc-100 truncate">{post.title}</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="tab-group">
            {[
              { key: 'edit', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /> },
              { key: 'raw', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /> },
              { key: 'preview', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /> },
            ].map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 ${view === key ? 'tab-item-active' : 'tab-item'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">{icon}</svg>
                {key}
              </button>
            ))}
          </div>

          {/* Status */}
          <span className={post.published ? 'badge-live' : 'badge-draft'}>
            {post.published ? 'Live' : 'Draft'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {post.published && post.slug && (
            <a
              href={`/${post.slug}`}
              target="_blank"
              rel="noopener"
              className="btn-ghost text-sm flex items-center gap-1.5 text-zinc-500 hover:text-brand-400"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              View
            </a>
          )}
          <button onClick={handlePublish} className={post.published ? 'btn-secondary text-sm' : 'btn-success text-sm'}>
            {post.published ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={handleDelete} className="btn-danger text-sm">
            Delete
          </button>
        </div>
      </div>

      {/* Updated timestamp */}
      <p className="text-xs text-zinc-700 font-medium">
        Last updated {new Date(post.updatedAt).toLocaleString()}
      </p>

      {/* Content area */}
      <div className="card p-6 sm:p-8">
        {view === 'edit' && (
          <PostEditor
            initialTitle={post.title}
            initialContent={post.content}
            initialTags={post.tags || []}
            onSave={handleSave}
            saving={saving}
          />
        )}

        {view === 'raw' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-600 font-medium">
                Full markdown with frontmatter
              </p>
              <span className="text-[11px] text-zinc-700 font-mono">{rawMarkdown.length} chars</span>
            </div>
            <textarea
              value={rawMarkdown}
              onChange={(e) => setRawMarkdown(e.target.value)}
              rows={25}
              className="w-full bg-surface-200 border border-zinc-800/60 rounded-xl px-5 py-4 text-sm text-zinc-200 font-mono leading-[1.8] outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all duration-200 resize-y min-h-[400px]"
            />
            <div className="flex justify-end">
              <button onClick={handleSaveRaw} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Saving...' : 'Save raw'}
              </button>
            </div>
          </div>
        )}

        {view === 'preview' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-50 mb-3 tracking-tight">{post.title}</h1>
            {post.summary && <p className="text-zinc-400 mb-6 text-lg leading-relaxed">{post.summary}</p>}
            {post.tags?.length > 0 && (
              <div className="flex gap-2 mb-8">
                {post.tags.map(tag => (
                  <span key={tag} className="badge-tag">{tag}</span>
                ))}
              </div>
            )}
            <div className="h-px bg-gradient-to-r from-zinc-800 via-zinc-700/30 to-transparent mb-8" />
            <MarkdownRenderer content={post.content} />
          </div>
        )}
      </div>
    </div>
  );
}
