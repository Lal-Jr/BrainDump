import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BASE } from '../../base';
import { fetchPost, updatePost, togglePublish, deletePost } from '../../lib/api';
import PostEditor from '../../components/admin/PostEditor';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [post, setPost] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPost(id).then(setPost).catch((e) => {
      toast.error(`Failed to load post: ${e.message}`);
      navigate('/admin');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Returns true on success, so the editor knows the changes are safe
  async function handleSave(fields) {
    setSaving(true);
    try {
      setPost(await updatePost(id, fields));
      toast.success('Saved');
      return true;
    } catch (e) {
      toast.error(`Save failed: ${e.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    try {
      const updated = await togglePublish(id);
      setPost((p) => ({ ...p, published: updated.published }));
      toast.success(updated.published ? 'Published' : 'Unpublished');
    } catch (e) {
      toast.error(`Publish failed: ${e.message}`);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await deletePost(id);
      navigate('/admin');
    } catch (e) {
      toast.error(`Delete failed: ${e.message}`);
    }
  }

  if (!post) return <LoadingSpinner text="Loading" />;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Link to="/admin" className="label transition-colors hover:text-brand-300">&larr; Posts</Link>

      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className={post.published ? 'badge-live' : 'badge-draft'}>{post.published ? 'Live' : 'Draft'}</span>
        <div className="flex flex-wrap items-center gap-2">
          {post.published && <a href={`${BASE}${post.slug}`} target="_blank" rel="noopener" className="btn-ghost">View ↗</a>}
          <button onClick={handlePublish} className={post.published ? 'btn-secondary' : 'btn-success'}>{post.published ? 'Unpublish' : 'Publish'}</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </div>

      {/* key: switching posts remounts the editor with fresh initial values */}
      <PostEditor key={post.id} initial={post} onSave={handleSave} saving={saving} />
    </div>
  );
}
