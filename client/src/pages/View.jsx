import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { fetchPost, fetchPostBySlug, fetchPublishedPosts } from '../api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import LoadingSpinner from '../components/LoadingSpinner';
import Comments from '../components/Comments';

export default function View() {
  const { id, slug } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [privateNote, setPrivateNote] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [noteSaved, setNoteSaved] = useState(false);

  const isPublicView = !location.pathname.startsWith('/admin');

  useEffect(() => {
    loadPost();
  }, [id, slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = JSON.parse(window.localStorage.getItem('brain-dump-favorites') || '[]');
    setFavorites(saved);
  }, []);

  useEffect(() => {
    if (!post?.id) return;
    const savedNote = window.localStorage.getItem(`brain-dump-note-${post.id}`) || '';
    setPrivateNote(savedNote);
  }, [post?.id]);

  useEffect(() => {
    if (!post?.id) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(`brain-dump-note-${post.id}`, privateNote);
      setNoteSaved(true);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [post?.id, privateNote]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const next = max > 0 ? (window.scrollY / max) * 100 : 0;
      setProgress(next);
      setShowBackToTop(window.scrollY > 650);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function loadPost() {
    try {
      setLoading(true);
      const [data, publishedPosts] = await Promise.all([
        slug ? fetchPostBySlug(slug) : fetchPost(id),
        fetchPublishedPosts().catch(() => []),
      ]);
      setPost(data);
      setTimeline((publishedPosts || []).filter(item => item.id !== data.id).slice(0, 5));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleFavorite = () => {
    if (!post?.id) return;
    const next = favorites.includes(post.id)
      ? favorites.filter(id => id !== post.id)
      : [...favorites, post.id];
    setFavorites(next);
    window.localStorage.setItem('brain-dump-favorites', JSON.stringify(next));
  };

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
        <Link to={isPublicView ? '/' : '/admin'} className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm mt-4 transition-colors">
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
  const isFavorite = favorites.includes(post.id);

  return (
    <div className={isPublicView ? 'min-h-screen bg-surface-50' : ''}>
      {isPublicView && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-brand-600/[0.03] rounded-full blur-[100px]" />
        </div>
      )}

      {isPublicView && (
        <div className="fixed top-0 left-0 z-[60] h-1 w-full bg-zinc-950/80">
          <div className="h-full rounded-r-full bg-gradient-to-r from-brand-400 via-cyan-400 to-fuchsia-500 transition-all duration-200" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 rounded-full border border-zinc-800/60 bg-surface-200/90 p-3 text-zinc-300 shadow-lg shadow-black/20 backdrop-blur"
          aria-label="Back to top"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5V4.5m0 0l-6 6m6-6l6 6" />
          </svg>
        </button>
      )}

      <article className={`relative max-w-4xl mx-auto animate-fade-in ${isPublicView ? 'px-5 py-14 sm:py-16' : ''}`}>
        <Link
          to={isPublicView ? '/' : '/admin'}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-300 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {isPublicView ? 'All posts' : 'Dashboard'}
        </Link>

        <div className="retro-panel mb-8 overflow-hidden p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="retro-pill mb-3">Retro notebook • {date}</p>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-50 leading-[1.15] tracking-tight animate-fade-in-up">
                {post.title}
              </h1>
              {post.summary && (
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
                  {post.summary}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={toggleFavorite}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${isFavorite ? 'border-brand-500/40 bg-brand-500/10 text-brand-300' : 'border-zinc-800/60 bg-surface-200/70 text-zinc-400 hover:text-zinc-100'}`}
            >
              {isFavorite ? '★ Favorited' : '☆ Favorite'}
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="retro-panel p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">
                HD
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Harish Lal</p>
                <p className="text-sm text-zinc-500">Writer, tinkerer, and collector of noisy thoughts.</p>
              </div>
            </div>
          </div>

          <div className="retro-panel p-5">
            <p className="retro-pill mb-3">Reading progress</p>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800/70">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-400 via-cyan-400 to-fuchsia-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <p className="mt-3 text-sm text-zinc-500">You are at about {Math.round(progress)}% of this article.</p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm">
          <span className="retro-pill">{date}</span>
          {post.tags?.length > 0 && post.tags.map(tag => <span key={tag} className="retro-chip">{tag}</span>)}
        </div>

        <div className="mb-10 rounded-3xl border border-zinc-800/60 bg-surface-200/50 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Private notes</p>
              <p className="text-sm text-zinc-500">Saved only in this browser.</p>
            </div>
            <span className="text-xs text-zinc-600">{noteSaved ? 'Saved' : 'Saving...'}</span>
          </div>
          <textarea
            value={privateNote}
            onChange={(e) => {
              setPrivateNote(e.target.value);
              setNoteSaved(false);
            }}
            rows={5}
            placeholder="Keep a private note for this article..."
            className="w-full rounded-2xl border border-zinc-800/60 bg-surface-100/70 px-4 py-3 text-sm text-zinc-200 outline-none transition focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20"
          />
        </div>

        <div className="mb-10 h-px bg-gradient-to-r from-zinc-800 via-zinc-700/30 to-transparent" />

        <MarkdownRenderer content={post.content} />

        <div className="mt-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="retro-panel p-5">
            <p className="retro-pill mb-3">Timeline</p>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <p className="text-sm text-zinc-500">No other posts yet.</p>
              ) : timeline.map(item => (
                <Link key={item.id} to={`/${item.slug}`} className="block rounded-2xl border border-zinc-800/50 bg-surface-200/60 p-3 transition hover:border-brand-500/30 hover:bg-surface-200">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-600">{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-200">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="retro-panel p-5">
            <p className="retro-pill mb-3">Reader notes</p>
            <p className="text-sm leading-relaxed text-zinc-400">
              The layout now leans into a retro terminal palette, with whisper-soft highlights, compact cards, and a more tactile reading experience for long-form writing.
            </p>
          </div>
        </div>

        {(isPublicView || post.published) && (
          <Comments postId={post.id} isAdmin={!isPublicView} />
        )}

        {!isPublicView && (
          <div className="mt-16 pt-8 border-t border-zinc-800/50">
            <Link to={`/admin/edit/${post.id}`} className="btn-secondary text-sm inline-flex items-center gap-2">
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
