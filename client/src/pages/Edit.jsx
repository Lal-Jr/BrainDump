import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      navigate('/');
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
      showToast('Saved!');
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
      showToast('Raw markdown saved!');
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
      showToast(updated.published ? 'Published! 🎉' : 'Unpublished');
    } catch (e) {
      alert('Publish failed: ' + e.message);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await deletePost(id);
      navigate('/');
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  }

  if (loading) return <LoadingSpinner text="Loading post..." />;
  if (!post) return null;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1">
          {['edit', 'raw', 'preview'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                view === v
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePublish} className={post.published ? 'btn-secondary' : 'btn-success'}>
            {post.published ? 'Unpublish' : '🚀 Publish'}
          </button>
          <button onClick={handleDelete} className="btn-danger">
            Delete
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className={`px-2 py-1 rounded-full font-medium ${
          post.published ? 'bg-emerald-600/20 text-emerald-400' : 'bg-amber-600/20 text-amber-400'
        }`}>
          {post.published ? 'Live' : 'Draft'}
        </span>
        {post.published && post.slug && (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener"
            className="text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            View live →
          </a>
        )}
        <span>Updated {new Date(post.updatedAt).toLocaleString()}</span>
      </div>

      {/* Content area */}
      <div className="card p-6">
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
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Edit the full markdown file including frontmatter
            </p>
            <textarea
              value={rawMarkdown}
              onChange={(e) => setRawMarkdown(e.target.value)}
              rows={25}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono leading-relaxed outline-none focus:border-brand-600 transition-colors resize-y min-h-[400px]"
            />
            <div className="flex justify-end">
              <button onClick={handleSaveRaw} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Raw'}
              </button>
            </div>
          </div>
        )}

        {view === 'preview' && (
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">{post.title}</h1>
            {post.summary && <p className="text-slate-400 mb-6">{post.summary}</p>}
            {post.tags?.length > 0 && (
              <div className="flex gap-2 mb-6">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-brand-600/10 text-brand-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <MarkdownRenderer content={post.content} />
          </div>
        )}
      </div>
    </div>
  );
}
