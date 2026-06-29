import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublishedPosts } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PublicFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchPublishedPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFavorites(JSON.parse(window.localStorage.getItem('brain-dump-favorites') || '[]'));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-surface-50">
      <LoadingSpinner text="Loading..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 noise">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-5 py-16 sm:py-24">
        <header className="mb-8 animate-fade-in">
          <div className="retro-panel mb-6 overflow-hidden p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="retro-pill mb-3">Retro archive</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight">Brain Dump</h1>
                <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-500 leading-relaxed">
                  Long-form notes, experiments, and late-night thoughts presented in a dark, tactile interface.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800/60 bg-surface-200/70 px-4 py-3 text-sm text-zinc-400">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-600">Favorites</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100">{favorites.length}</p>
              </div>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-zinc-800 via-zinc-800/50 to-transparent" />
        </header>

        <div className="mb-10 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="retro-panel p-5">
            <p className="retro-pill mb-3">Timeline</p>
            <div className="space-y-3">
              {posts.slice(0, 5).map((post, i) => {
                const date = new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <Link key={post.id} to={`/${post.slug}`} className="flex items-center justify-between rounded-2xl border border-zinc-800/50 bg-surface-200/60 px-3 py-3 transition hover:border-brand-500/30 hover:bg-surface-200">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-600">{date}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{post.title}</p>
                    </div>
                    <span className="text-sm text-zinc-500">0{i + 1}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="retro-panel p-5">
            <p className="retro-pill mb-3">Author card</p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">
                HD
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Harish Lal</p>
                <p className="text-sm text-zinc-500">Publishing thoughts with a pixelated pulse.</p>
              </div>
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <p className="text-zinc-600 font-medium">No published posts yet.</p>
            <p className="text-zinc-700 text-sm mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map((post, i) => {
              const date = new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <article
                  key={post.id}
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <Link to={`/${post.slug}`} className="block py-8 -mx-4 px-4 rounded-2xl hover:bg-white/[0.02] transition-all duration-300">
                    <div className="flex items-start gap-6">
                      <div className="hidden sm:block w-24 shrink-0 pt-1">
                        <time className="text-xs text-zinc-700 font-medium">{date}</time>
                      </div>

                      <div className="flex-1 min-w-0">
                        <time className="text-xs text-zinc-700 font-medium sm:hidden">{date}</time>
                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1 sm:mt-0 group-hover:text-brand-400 transition-colors duration-300 tracking-tight">
                          {post.title}
                        </h2>
                        {post.summary && (
                          <p className="text-zinc-500 mt-2 leading-relaxed text-[15px] line-clamp-2">{post.summary}</p>
                        )}
                        {post.tags?.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {post.tags.map(tag => (
                              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-600 ring-1 ring-white/[0.06]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-700 group-hover:text-brand-400 mt-4 font-medium transition-colors">
                          Read more
                          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="h-px bg-zinc-800/40 ml-0 sm:ml-[7.5rem]" />
                </article>
              );
            })}
          </div>
        )}

        <footer className="mt-24 pt-8 border-t border-zinc-800/40 text-center">
          <p className="text-xs text-zinc-800 font-medium">Built with Brain Dump</p>
        </footer>
      </div>
    </div>
  );
}
