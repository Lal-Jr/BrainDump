import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPublishedPosts } from '../lib/api';
import { withBase } from '../base';
import { CATEGORIES, CATEGORY_KEYS } from '../lib/categories';
import { plural } from '../lib/format';
import { useSWR } from '../hooks/useSWR';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import PostCard from '../components/public/PostCard';
import { Doodle } from '../components/ui/Doodles';

const PAGE = 10;

export default function Feed() {
  useDocumentMeta('Brain Dump · Harish Lal', 'Thoughts, how I work, engineering notes and research.');

  const { data: posts, error, loading } = useSWR('posts', fetchPublishedPosts);
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat');
  const tag = params.get('tag');
  const urlQuery = params.get('q') ?? '';

  // typing updates instantly; the URL (shareable, back-button friendly) follows a beat later
  const [query, setQuery] = useState(urlQuery);
  const deferredQuery = useDeferredValue(query);
  const [visible, setVisible] = useState(PAGE);
  const searchRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query === urlQuery) return;
      const next = new URLSearchParams(params);
      query ? next.set('q', query) : next.delete('q');
      setParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // "/" jumps to search, like most docs sites
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
    setVisible(PAGE);
  };

  const counts = useMemo(() => {
    const c = {};
    (posts ?? []).forEach((p) => (c[p.category] = (c[p.category] ?? 0) + 1));
    return c;
  }, [posts]);

  const tags = useMemo(() => {
    const c = {};
    (posts ?? []).forEach((p) => p.tags?.forEach((t) => (c[t] = (c[t] ?? 0) + 1)));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [posts]);

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return (posts ?? []).filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!tag || p.tags?.includes(tag)) &&
        (!needle || `${p.title} ${p.summary} ${p.tags?.join(' ')}`.toLowerCase().includes(needle))
    );
  }, [posts, cat, tag, deferredQuery]);

  const filtered = !!(cat || tag || urlQuery);
  const clear = () => {
    setQuery('');
    setParams({}, { replace: true });
    setVisible(PAGE);
  };

  return (
    <div>
      {/* ---------- Intro ---------- */}
      <section className="relative mb-10 flex items-end justify-between gap-6 sm:mb-12">
        <div className="min-w-0">
          <p className="label">Harish Lal</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">Brain Dump</h1>
          <Doodle name="underline" className="mt-2 h-3 w-40 text-brand-300" stroke={2.5} />
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-400">Thoughts, how I work, engineering notes and research.</p>
        </div>
        <div className="relative hidden shrink-0 sm:block">
          <Doodle name="spark" className="absolute -left-8 -top-4 h-9 w-9 text-yellow-400/60" />
          <img src={withBase('img/wave.png')} alt="" width="150" height="190" decoding="async" className="h-auto w-24 select-none" />
        </div>
      </section>

      {/* ---------- Filters ---------- */}
      <section aria-label="Filter posts" className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-white/10">
          <div className="-mb-px flex gap-6 overflow-x-auto" role="group" aria-label="Category">
            <CategoryTab active={!cat} onClick={() => setFilter('cat', null)} color="#86efac" count={posts?.length}>
              All
            </CategoryTab>
            {CATEGORY_KEYS.map((key) => (
              <CategoryTab key={key} active={cat === key} onClick={() => setFilter('cat', key)} color={CATEGORIES[key].color} count={counts[key] ?? 0}>
                {CATEGORIES[key].label}
              </CategoryTab>
            ))}
          </div>

          <label className="relative mb-2 block w-full sm:w-52">
            <span className="sr-only">Search posts</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(PAGE);
              }}
              placeholder="Search"
              className="input py-1.5 pr-8 text-[13px]"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 border border-white/15 px-1.5 text-[10px] text-zinc-500">/</kbd>
          </label>
        </div>

        {cat && <p className="mt-4 text-[13px] text-zinc-400">{CATEGORIES[cat]?.blurb}</p>}

        {tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[12px]" role="group" aria-label="Tags">
            {tags.map(([t]) => (
              <button key={t} type="button" onClick={() => setFilter('tag', tag === t ? null : t)} aria-pressed={tag === t} className={`transition-colors ${tag === t ? 'text-brand-300' : 'text-zinc-400 hover:text-zinc-200'}`}>
                #{t}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Posts ---------- */}
      {error ? (
        <Empty title="Couldn't load the posts" body={error.message}>
          <button className="btn-secondary mt-6" onClick={() => window.location.reload()}>
            Try again
          </button>
        </Empty>
      ) : loading ? (
        <Skeleton />
      ) : results.length === 0 ? (
        <Empty title={posts.length === 0 ? 'Nothing here yet' : 'No matches'} body={posts.length === 0 ? 'The first post is on its way.' : 'Nothing fits those filters.'}>
          {filtered && (
            <button className="btn-secondary mt-6" onClick={clear}>
              Clear filters
            </button>
          )}
        </Empty>
      ) : (
        <>
          <div>
            {results.slice(0, visible).map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
          <p className="mt-6 flex items-center justify-between text-[12px] text-zinc-400">
            <span>{plural(results.length, 'post')}</span>
            {filtered && (
              <button type="button" onClick={clear} className="transition-colors hover:text-zinc-100">
                Clear filters
              </button>
            )}
          </p>
          {results.length > visible && (
            <div className="mt-8">
              <button className="btn-secondary" onClick={() => setVisible((v) => v + PAGE)}>
                Load more ({results.length - visible})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryTab({ active, onClick, color, count, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative shrink-0 pb-3 text-[13px] transition-colors ${active ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'}`}
    >
      {children}
      {count != null && <span className="ml-1.5 text-zinc-500">{count}</span>}
      <span aria-hidden className={`absolute inset-x-0 bottom-0 h-0.5 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} style={{ background: color }} />
    </button>
  );
}

function Skeleton() {
  return (
    <div className="border-t border-white/10" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse border-b border-white/10 py-7">
          <div className="h-3 w-40 bg-white/10" />
          <div className="mt-4 h-6 w-3/4 bg-white/10" />
          <div className="mt-3 h-4 w-full bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, body, children }) {
  return (
    <div className="relative flex animate-fade-in flex-col items-center py-14 text-center">
      <Doodle name="scribble" className="absolute left-[20%] top-6 h-10 w-10 text-zinc-500" />
      <Doodle name="spark" className="absolute right-[20%] top-10 h-9 w-9 text-yellow-400/50" />
      <img src={withBase('img/peace.png')} alt="" width="120" height="150" className="h-auto w-20 select-none opacity-90" />
      <h2 className="mt-5 text-lg font-semibold text-zinc-100">{title}</h2>
      {body && <p className="mt-2 max-w-sm text-[14px] text-zinc-400">{body}</p>}
      {children}
    </div>
  );
}
