import { useEffect, useMemo, useState } from 'react';
import { fetchPostBySlug, fetchPublishedPosts, recordHit } from '../lib/api';
import { categoryOf } from '../lib/categories';
import { formatDate, readingLabel, plural } from '../lib/format';
import { renderMarkdown } from '../lib/markdown';
import { useSWR } from '../hooks/useSWR';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MarkdownContent from '../components/public/MarkdownContent';
import ReadingProgress from '../components/public/ReadingProgress';
import Toc from '../components/public/Toc';
import Reactions from '../components/public/Reactions';
import Comments from '../components/public/Comments';
import PostCard from '../components/public/PostCard';
import SmoothLink from '../components/ui/SmoothLink';
import { CategoryLabel } from '../components/ui/Labels';
import { Empty } from './Feed';

const jumpToComments = () => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });

// A single post, built for reading: one column, generous type, nothing between you and the text.
export default function Post({ slug }) {
  const { authenticated } = useAuth();
  const toast = useToast();
  const { data: post, error, loading } = useSWR(`post:${slug}`, () => fetchPostBySlug(slug));
  const { data: all } = useSWR('posts', fetchPublishedPosts);
  const rendered = useMemo(() => (post ? renderMarkdown(post.content) : null), [post]);

  useDocumentMeta(post ? `${post.title} · Brain Dump` : 'Brain Dump · Harish Lal', post?.summary);

  // Count a view once per browser session (the server ignores the admin and drafts)
  useEffect(() => {
    if (!post?.published) return;
    try {
      const flag = `bd:viewed:${post.id}`;
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
    } catch {
      /* storage blocked: count it anyway */
    }
    recordHit(post.id);
  }, [post?.id, post?.published]);

  // Related = most shared tags, then newest (the list is already newest-first)
  const related = useMemo(() => {
    if (!post || !all) return [];
    const mine = new Set(post.tags ?? []);
    return all
      .filter((p) => p.id !== post.id)
      .map((p, i) => ({ p, i, score: (p.tags ?? []).filter((t) => mine.has(t)).length + (p.category === post.category ? 0.5 : 0) }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, 2)
      .map((x) => x.p);
  }, [post, all]);

  if (error) {
    return (
      <Empty title="Post not found" body="That post doesn't exist, or it isn't published yet.">
        <SmoothLink to="/" className="btn-secondary mt-6">
          Back to all posts
        </SmoothLink>
      </Empty>
    );
  }
  if (loading || !post) return <PostSkeleton />;

  const headings = rendered.headings;

  return (
    <div className="animate-fade-in">
      <ReadingProgress />

      <article className="max-w-[46rem]">
        <SmoothLink to="/" className="text-[12px] text-zinc-400 transition-colors hover:text-zinc-100">
          &larr; All posts
        </SmoothLink>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-zinc-400">
            <SmoothLink to={`/?cat=${post.category}`} aria-label={`More in ${categoryOf(post.category).label}`}>
              <CategoryLabel category={post.category} />
            </SmoothLink>
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
            <span>{readingLabel(post.readingTime)}</span>
            {!post.published && <span className="badge-draft">Draft</span>}
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-4xl">{post.title}</h1>
          {post.summary && <p className="mt-5 text-[17px] leading-relaxed text-zinc-400">{post.summary}</p>}

          <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-white/10 py-3 text-[13px] text-zinc-400">
            <span>By Harish Lal</span>
            <button type="button" onClick={jumpToComments} className="transition-colors hover:text-brand-300">
              {post.commentCount ? plural(post.commentCount, 'comment') : 'Leave a comment'}
            </button>
            {authenticated && (
              <SmoothLink to={`/admin/edit/${post.id}`} className="ml-auto text-brand-300 hover:underline">
                Edit post
              </SmoothLink>
            )}
          </p>
        </header>

        {headings.length >= 3 && (
          <details className="group mt-6 border border-white/10 px-4 py-3">
            <summary className="label cursor-pointer select-none list-none transition-colors hover:text-zinc-300">
              On this page <span className="ml-1 inline-block transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="mt-4">
              <Toc headings={headings} />
            </div>
          </details>
        )}

        <div className="mt-10">
          <MarkdownContent html={rendered.html} />
        </div>

        {/* ---------- After the last line ---------- */}
        <footer className="mt-14 space-y-8 border-t border-white/10 pt-8">
          <Reactions postId={post.id} />
          <ShareBar post={post} onCopied={() => toast.success('Link copied')} />
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <SmoothLink key={t} to={`/?tag=${encodeURIComponent(t)}`} className="chip">
                  #{t}
                </SmoothLink>
              ))}
            </div>
          )}
        </footer>

        <Comments postId={post.id} isAdmin={authenticated} />

        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="keep-reading">
            <h2 id="keep-reading" className="text-lg font-semibold text-zinc-50">
              Keep reading
            </h2>
            <div className="mt-4">
              {related.map((p, i) => (
                <PostCard key={p.id} post={p} index={i} compact />
              ))}
            </div>
          </section>
        )}
      </article>

      <CommentFab count={post.commentCount} />
    </div>
  );
}

function ShareBar({ post, onCopied }) {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onCopied();
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={copy} className="btn-secondary">
        Copy link
      </button>
      {canShare && (
        <button type="button" onClick={() => navigator.share({ title: post.title, url: window.location.href }).catch(() => {})} className="btn-secondary">
          Share
        </button>
      )}
    </div>
  );
}

// A comment shortcut that follows you down the page until you reach the discussion itself
function CommentFab({ count }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById('comments');
    let scrolled = false;
    let nearComments = false;
    const update = () => setShow(scrolled && !nearComments);
    const onScroll = () => {
      scrolled = window.scrollY > 500;
      update();
    };
    const observer = new IntersectionObserver(([entry]) => {
      nearComments = entry.isIntersecting;
      update();
    });
    if (target) observer.observe(target);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!show) return null;
  return (
    <button
      type="button"
      onClick={jumpToComments}
      className="fixed bottom-5 right-5 z-40 animate-fade-in border border-white/20 bg-surface-50/95 px-3.5 py-2 text-[12px] text-zinc-200 backdrop-blur transition-colors hover:border-brand-300 hover:text-brand-300"
    >
      Comment{count ? ` (${count})` : ''}
    </button>
  );
}

function PostSkeleton() {
  return (
    <div className="max-w-[46rem] animate-pulse" aria-hidden>
      <div className="h-3 w-24 bg-white/10" />
      <div className="mt-10 h-5 w-48 bg-white/10" />
      <div className="mt-6 h-10 w-full bg-white/10" />
      <div className="mt-3 h-10 w-2/3 bg-white/10" />
      <div className="mt-10 space-y-3">
        {[100, 96, 92, 100, 60].map((w, i) => (
          <div key={i} className="h-4 bg-white/[0.06]" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
