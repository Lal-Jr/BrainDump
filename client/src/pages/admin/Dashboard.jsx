import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, togglePublish, deletePost, fetchAnalytics, removeComment } from '../../lib/api';
import { BASE } from '../../base';
import { formatDate, plural } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CategoryLabel } from '../../components/ui/Labels';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'draft', label: 'Drafts' },
];

export default function Dashboard() {
  const toast = useToast();
  const [posts, setPosts] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');

  async function load() {
    try {
      const [p, s] = await Promise.all([fetchPosts(), fetchAnalytics().catch(() => null)]);
      setPosts(p);
      setStats(s);
    } catch (e) {
      toast.error(`Failed to load: ${e.message}`);
      setPosts((prev) => prev ?? []);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(fn, label) {
    try {
      await fn();
      await load();
    } catch (e) {
      toast.error(`${label}: ${e.message}`);
    }
  }

  if (!posts) return <LoadingSpinner text="Loading" />;

  const live = posts.filter((p) => p.published).length;
  const visible = posts.filter((p) => filter === 'all' || (filter === 'live') === p.published);
  const counts = { all: posts.length, live, draft: posts.length - live };
  const comments = stats?.recentComments ?? [];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Posts</h1>
          <p className="mt-3 text-[13px] text-zinc-500">
            {live} live · {plural(posts.length - live, 'draft')}
            {stats && <> · {plural(stats.totalViews, 'view')} · {plural(stats.totalComments, 'comment')}</>}
          </p>
        </div>
        <Link to="/admin/create" className="btn-primary">New post</Link>
      </div>

      <div className="tab-group mt-8">
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} className={filter === key ? 'tab-item-active' : 'tab-item'}>
            {label} {counts[key]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-500">{posts.length === 0 ? 'No posts yet.' : 'Nothing here.'}</p>
          {posts.length === 0 && <Link to="/admin/create" className="mt-3 inline-block text-[13px] text-brand-300 hover:underline">Write your first post →</Link>}
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/10">
          {visible.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <Link to={`/admin/edit/${post.id}`} className="block truncate font-semibold text-zinc-100 transition-colors hover:text-brand-300">{post.title}</Link>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500">
                  <CategoryLabel category={post.category} />
                  <span>{formatDate(post.createdAt)}</span>
                  {stats && <span>{plural(stats.viewsPerPost[post.id] ?? 0, 'view')} · {plural(post.commentCount ?? 0, 'comment')}</span>}
                </p>
              </div>
              <span className={post.published ? 'badge-live' : 'badge-draft'}>{post.published ? 'Live' : 'Draft'}</span>
              <div className="flex items-center gap-1 text-[12px]">
                {post.published && <a href={`${BASE}${post.slug}`} target="_blank" rel="noopener" className="px-2.5 py-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100">View</a>}
                <button onClick={() => act(() => togglePublish(post.id), 'Publish failed')} className="px-2.5 py-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100">
                  {post.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => confirm('Delete this post? This cannot be undone.') && act(() => deletePost(post.id), 'Delete failed')} className="px-2.5 py-2 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {comments.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-zinc-50">Recent comments</h2>
          <ul className="mt-4 divide-y divide-white/10 border border-white/10">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-3 p-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]">
                    <span className="font-semibold text-zinc-200">{c.name || 'Anonymous'}</span>
                    <span className="text-zinc-600">{c.parentId ? ' replied on ' : ' on '}</span>
                    <Link to={`/admin/edit/${c.postId}`} className="text-zinc-400 transition-colors hover:text-brand-300">{c.postTitle}</Link>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[13px] text-zinc-500">{c.text}</p>
                </div>
                <button onClick={() => act(() => removeComment(c.postId, c.id), 'Delete failed')} className="shrink-0 px-2.5 py-2 text-[12px] text-zinc-600 transition-colors hover:text-red-400">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
