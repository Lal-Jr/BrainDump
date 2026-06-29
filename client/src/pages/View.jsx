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
  const [inlineNotes, setInlineNotes] = useState({});
  const [activeNoteBlock, setActiveNoteBlock] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [progress, setProgress] = useState(0);

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
    if (!post?.id || typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(`brain-dump-inline-notes-${post.id}`);
      if (saved) {
        setInlineNotes(JSON.parse(saved));
      }
    } catch {
      setInlineNotes({});
    }
  }, [post?.id]);

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

  const openNoteEditor = (index) => {
    setActiveNoteBlock(index);
    setNoteDraft(inlineNotes[index] || '');
  };

  const saveNote = (index) => {
    const next = { ...inlineNotes };
    const trimmed = noteDraft.trim();
    if (trimmed) {
      next[index] = trimmed;
    } else {
      delete next[index];
    }

    setInlineNotes(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`brain-dump-inline-notes-${post.id}`, JSON.stringify(next));
    }
    setActiveNoteBlock(null);
    setNoteDraft('');
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
  const contentBlocks = (post.content || '').split(/\n{2,}/).map(block => block.trim()).filter(Boolean);

  return (
    <div className={isPublicView ? 'min-h-screen bg-surface-50' : ''}>
      {isPublicView && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-brand-600/[0.03] rounded-full blur-[100px]" />
        </div>
      )}

      {isPublicView && (
        <div className="fixed top-0 left-0 z-[60] w-full border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2 sm:px-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">Reading</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800/80">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-400 via-cyan-400 to-fuchsia-500 transition-all duration-200" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-zinc-300">{Math.round(progress)}%</span>
          </div>
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
            <div className="max-w-2xl">
              <p className="retro-pill mb-3">{date}</p>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-50 leading-[1.15] tracking-tight animate-fade-in-up">
                {post.title}
              </h1>
              {post.summary && (
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
                  {post.summary}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                onClick={toggleFavorite}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${isFavorite ? 'border-brand-500/40 bg-brand-500/10 text-brand-300' : 'border-zinc-800/60 bg-surface-200/70 text-zinc-400 hover:text-zinc-100'}`}
              >
                {isFavorite ? '★ Favorited' : '☆ Favorite'}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm">
          <span className="retro-pill">{date}</span>
          {post.tags?.length > 0 && post.tags.map(tag => <span key={tag} className="retro-chip">{tag}</span>)}
        </div>

        <div className="mb-10">
          <div className="mb-10 h-px bg-gradient-to-r from-zinc-800 via-zinc-700/30 to-transparent" />

          <div className="space-y-8">
            {contentBlocks.length > 0 ? contentBlocks.map((block, index) => (
              <div key={`${post.id}-${index}`} className="group relative">
                <button
                  type="button"
                  onClick={() => openNoteEditor(index)}
                  className="absolute -left-2 top-1 hidden rounded-full border border-zinc-800/70 bg-surface-200/80 p-1.5 text-sm text-zinc-400 transition hover:border-brand-500/40 hover:text-brand-300 md:block"
                  aria-label="Add note"
                >
                  +
                </button>
                <div className="rounded-2xl border border-transparent px-2 py-1 transition hover:border-zinc-800/50 hover:bg-white/[0.02] md:pl-4">
                  <MarkdownRenderer content={block} />
                  {inlineNotes[index] && (
                    <div className="mt-3 max-w-xl rounded-2xl border border-zinc-800/60 bg-zinc-950/70 p-3 text-sm text-zinc-400 opacity-0 shadow-lg shadow-black/20 transition group-hover:opacity-100">
                      {inlineNotes[index]}
                    </div>
                  )}
                  {activeNoteBlock === index && (
                    <div className="mt-3 max-w-xl rounded-2xl border border-zinc-800/60 bg-surface-200/70 p-3 shadow-lg shadow-black/20">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        rows={4}
                        placeholder="Add a tiny note here..."
                        className="w-full rounded-2xl border border-zinc-800/60 bg-surface-100/70 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNoteBlock(null);
                            setNoteDraft('');
                          }}
                          className="rounded-full border border-zinc-800/70 px-3 py-1.5 text-sm text-zinc-400 transition hover:text-zinc-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveNote(index)}
                          className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-sm text-brand-300 transition hover:bg-brand-500/20"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )) : <MarkdownRenderer content={post.content} />}
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1fr]">
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
        </div>
      </article>
    </div>
  );
}
