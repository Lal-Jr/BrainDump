import { withBase } from '../../base';
import { categoryOf } from '../../lib/categories';
import { formatDate, readingLabel, plural } from '../../lib/format';
import { prefetchPost } from '../../lib/api';
import { loadPost } from '../../lib/routes';
import SmoothLink from '../ui/SmoothLink';
import { CategoryLabel } from '../ui/Labels';

// A post in the list: category, date, title, summary. A hairline between rows, the title warms
// to the accent on hover, and the whole row is the link. (An optional cover sits to the right.)
export default function PostCard({ post, index = 0, compact = false }) {
  const { color } = categoryOf(post.category);

  return (
    <article className="animate-fade-in-up border-b border-white/10 first:border-t" style={{ animationDelay: `${Math.min(index, 6) * 40}ms`, '--cat': color }}>
      <SmoothLink
        to={`/${post.slug}`}
        prefetch={() => {
          prefetchPost(post.slug);
          loadPost();
        }}
        className="group -mx-3 flex items-start justify-between gap-6 px-3 py-6 transition-colors hover:bg-white/[0.025] sm:py-7"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-zinc-400">
            <CategoryLabel category={post.category} />
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
            <span>{readingLabel(post.readingTime)}</span>
          </div>

          <h2 className={`mt-3 font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-brand-300 ${compact ? 'text-[17px]' : 'text-xl sm:text-[22px]'}`}>
            {post.title}
          </h2>
          {!compact && post.summary && <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-zinc-400">{post.summary}</p>}

          {!compact && (post.tags?.length > 0 || post.commentCount > 0) && (
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-zinc-400">
              {post.tags?.slice(0, 3).map((t) => (
                <span key={t}>#{t}</span>
              ))}
              {post.commentCount > 0 && <span className="text-zinc-400">{plural(post.commentCount, 'comment')}</span>}
            </p>
          )}
        </div>

        {post.cover && !compact && (
          <img src={withBase(post.cover.slice(1))} alt="" loading="lazy" decoding="async" className="hidden aspect-[4/3] w-32 shrink-0 border border-white/10 object-cover sm:block" />
        )}
      </SmoothLink>
    </article>
  );
}
