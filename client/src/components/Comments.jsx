import { useState, useEffect } from 'react';
import { fetchComments, addComment, removeComment } from '../api';
import { useToast } from '../context/ToastContext';

export default function Comments({ postId, isAdmin }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    try {
      const data = await fetchComments(postId);
      setComments(data);
    } catch {
      // No comments file yet — ok
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const comment = await addComment(postId, { name, text });
      setComments(prev => [...prev, comment]);
      setName('');
      setText('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    try {
      const remaining = await removeComment(postId, commentId);
      setComments(remaining);
    } catch {
      // ignore
    }
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

  return (
    <section className="mt-16 pt-10 border-t border-zinc-800/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-surface-300 flex items-center justify-center">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-zinc-200">
          Comments
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-600">({comments.length})</span>
          )}
        </h2>
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-10">
        <div className="card p-5 space-y-4">
          <div className="flex gap-3">
            {/* Avatar placeholder */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500/30 to-brand-700/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="input w-full text-sm"
                maxLength={50}
              />
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Leave a comment..."
                rows={3}
                className="input w-full text-sm resize-none"
                maxLength={2000}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Posting...
                </span>
              ) : (
                'Post comment'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="w-5 h-5 animate-spin text-zinc-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-zinc-700 text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment, i) => (
            <div
              key={comment.id}
              className="group flex gap-3 p-4 rounded-xl hover:bg-surface-200/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-surface-300 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-zinc-500 uppercase">
                  {(comment.name || 'A')[0]}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-300">{comment.name || 'Anonymous'}</span>
                  <span className="text-xs text-zinc-700">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
                  {comment.text}
                </p>
              </div>

              {/* Admin delete */}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete comment"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
