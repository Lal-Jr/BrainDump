import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { fetchPost, fetchPostBySlug } from '../api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import LoadingSpinner from '../components/LoadingSpinner';

export default function View() {
  const { id, slug } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isPublicView = location.pathname.startsWith('/blog/');

  useEffect(() => {
    loadPost();
  }, [id, slug]);

  async function loadPost() {
    try {
      setLoading(true);
      const data = slug ? await fetchPostBySlug(slug) : await fetchPost(id);
      setPost(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading post..." />;

  if (error || !post) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-200 flex items-center justify-center">
          <svg className="w-7 h-7 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-zinc-500 font-medium">{error || 'Post not found'}</p>
        <Link to={isPublicView ? '/blog' : '/'} className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm mt-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Go back
        </Link>
      </div>
    );
  }

  const date = new Date(post.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={isPublicView ? 'min-h-screen bg-surface-50' : ''}>
      {/* Ambient glow for public view */}
      {isPublicView && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-brand-600/[0.03] rounded-full blur-[100px]" />
        </div>
      )}

      <article className={`relative max-w-3xl mx-auto animate-fade-in ${isPublicView ? 'px-5 py-16' : ''}`}>
        {/* Back link */}
        <Link
          to={isPublicView ? '/blog' : '/'}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-300 transition-colors mb-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {isPublicView ? 'All posts' : 'Dashboard'}
        </Link>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-50 leading-[1.15] tracking-tight animate-fade-in-up">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-6 mb-10">
          <span className="text-sm text-zinc-600 font-medium">{date}</span>
          {post.tags?.length > 0 && (
            <div className="flex gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="badge-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {post.summary && (
          <div className="mb-10 relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-500 via-brand-500/50 to-transparent rounded-full" />
            <p className="text-lg text-zinc-400 pl-5 italic leading-relaxed">
              {post.summary}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-zinc-800 via-zinc-700/30 to-transparent mb-10" />

        {/* Content */}
        <MarkdownRenderer content={post.content} />

        {/* Edit link (only for admin preview) */}
        {!isPublicView && (
          <div className="mt-16 pt-8 border-t border-zinc-800/50">
            <Link to={`/edit/${post.id}`} className="btn-secondary text-sm inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              Edit this post
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
