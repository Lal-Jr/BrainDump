import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublishedPosts } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PublicFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading..." />;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Blog header */}
        <header className="mb-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xl font-bold mx-auto mb-4">
            BD
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">Brain Dump</h1>
          <p className="text-slate-500 mt-2">Thoughts, ideas, and random musings</p>
        </header>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-600">No published posts yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map(post => {
              const date = new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <article key={post.id} className="group">
                  <Link to={`/blog/${post.slug}`}>
                    <time className="text-xs text-slate-600 uppercase tracking-wider">{date}</time>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 group-hover:text-brand-400 transition-colors">
                      {post.title}
                    </h2>
                    {post.summary && (
                      <p className="text-slate-400 mt-2 leading-relaxed">{post.summary}</p>
                    )}
                    {post.tags?.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {post.tags.map(tag => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-slate-900 text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-700">Powered by Brain Dump</p>
        </footer>
      </div>
    </div>
  );
}
