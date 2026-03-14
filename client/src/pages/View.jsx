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
      <div className="text-center py-20">
        <p className="text-slate-500">{error || 'Post not found'}</p>
        <Link to={isPublicView ? '/blog' : '/'} className="text-brand-400 text-sm mt-4 inline-block">
          ← Go back
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
    <div className={isPublicView ? 'min-h-screen bg-slate-950' : ''}>
      <article className={`max-w-3xl mx-auto ${isPublicView ? 'px-4 py-12' : ''}`}>
        {/* Back link */}
        <Link
          to={isPublicView ? '/blog' : '/'}
          className="text-sm text-slate-500 hover:text-slate-300 mb-8 inline-flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isPublicView ? 'All posts' : 'Dashboard'}
        </Link>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 mt-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 mb-8">
          <span className="text-sm text-slate-500">{date}</span>
          {post.tags?.length > 0 && (
            <div className="flex gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-brand-600/10 text-brand-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {post.summary && (
          <p className="text-lg text-slate-400 mb-8 border-l-4 border-brand-600 pl-4 italic">
            {post.summary}
          </p>
        )}

        {/* Content */}
        <MarkdownRenderer content={post.content} />

        {/* Edit link (only for admin preview) */}
        {!isPublicView && (
          <div className="mt-12 pt-6 border-t border-slate-800">
            <Link to={`/edit/${post.id}`} className="btn-secondary text-sm">
              ← Edit this post
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
