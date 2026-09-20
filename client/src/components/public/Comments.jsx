import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchComments, addComment, removeComment } from '../../lib/api';
import { timeAgo, plural } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import { Doodle } from '../ui/Doodles';

const NAME_KEY = 'bd_name';
const MAX = 2000;

const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};

// Comment text is rendered as plain text by React (never as HTML), and links stay inert.
function Avatar({ name }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/15 bg-white/[0.04] text-[12px] font-medium uppercase text-zinc-300" aria-hidden>
      {(name || 'A')[0]}
    </span>
  );
}

function Composer({ value, onChange, name, onName, onSubmit, busy, placeholder, submitLabel, website, onWebsite, autoFocus, onCancel, compact }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="Your name (optional)"
        aria-label="Your name"
        maxLength={50}
        autoComplete="nickname"
        className="input"
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        aria-label="Your comment"
        rows={compact ? 3 : 4}
        maxLength={MAX}
        autoFocus={autoFocus}
        required
        className="input resize-y leading-relaxed"
      />
      {/* honeypot: hidden from people, bots fill it */}
      <input type="text" name="website" value={website} onChange={(e) => onWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-zinc-500">{value.length > MAX - 300 ? `${MAX - value.length} characters left` : 'Ctrl/Cmd + Enter to send'}</span>
        <span className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
          )}
          <button type="submit" disabled={busy || !value.trim()} className="btn-primary">
            {busy ? 'Posting…' : submitLabel}
          </button>
        </span>
      </div>
    </form>
  );
}

export default function Comments({ postId, isAdmin }) {
  const toast = useToast();
  const [comments, setComments] = useState(null);
  const [name, setName] = useState(readName);
  const [text, setText] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [fresh, setFresh] = useState(null);
  const freshRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchComments(postId).then((list) => !cancelled && setComments(list)).catch(() => !cancelled && setComments([]));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    if (fresh) freshRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [fresh]);

  const { roots, repliesOf } = useMemo(() => {
    const list = comments ?? [];
    const map = {};
    for (const c of list) if (c.parentId) (map[c.parentId] ??= []).push(c);
    return { roots: list.filter((c) => !c.parentId), repliesOf: (id) => map[id] ?? [] };
  }, [comments]);

  async function submit({ body, parentId }) {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      const comment = await addComment(postId, { name, text: body, parentId, website });
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        /* storage blocked */
      }
      if (comment.id !== 'ignored') {
        setComments((prev) => [...(prev ?? []), comment]);
        setFresh(comment.id);
      }
      if (parentId) {
        setReplyTo(null);
        setReplyText('');
      } else {
        setText('');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId) {
    try {
      setComments(await removeComment(postId, commentId));
    } catch (e) {
      toast.error(e.message);
    }
  }

  const total = comments?.length ?? 0;
  const shown = showAll ? roots : roots.slice(0, 8);

  return (
    <section id="comments" className="mt-16 scroll-mt-20 border-t border-white/10 pt-10" aria-labelledby="comments-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="comments-title" className="text-xl font-semibold text-zinc-50">
          Discussion
        </h2>
        <span className="text-[13px] text-zinc-400">{total ? plural(total, 'comment') : 'No comments yet'}</span>
      </div>
      <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-zinc-400">
        Questions, disagreements, your own take: all welcome. I read everything.
      </p>

      <div className="relative mt-6 border border-white/10 p-4 sm:p-5">
        <Doodle name="arrow" className="absolute -left-12 -top-9 hidden h-10 w-10 -rotate-12 text-brand-300/50 xl:block" />
        <Composer
          value={text}
          onChange={setText}
          name={name}
          onName={setName}
          website={website}
          onWebsite={setWebsite}
          busy={busy && !replyTo}
          onSubmit={() => submit({ body: text })}
          placeholder="What did you think?"
          submitLabel="Post comment"
        />
      </div>

      <div className="mt-8" aria-live="polite">
        {comments === null ? (
          <div className="h-16 animate-pulse border border-white/10" aria-hidden />
        ) : roots.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-zinc-500">Be the first to say something.</p>
        ) : (
          <ul className="space-y-6">
            {shown.map((c) => (
              <li key={c.id} ref={fresh === c.id ? freshRef : null}>
                <CommentItem comment={c} isAdmin={isAdmin} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} onDelete={remove} highlight={fresh === c.id} replying={replyTo === c.id} />

                {(repliesOf(c.id).length > 0 || replyTo === c.id) && (
                  <ul className="ml-4 mt-4 space-y-4 border-l border-white/10 pl-4 sm:pl-6">
                    {repliesOf(c.id).map((r) => (
                      <li key={r.id} ref={fresh === r.id ? freshRef : null}>
                        <CommentItem comment={r} isAdmin={isAdmin} onDelete={remove} highlight={fresh === r.id} reply />
                      </li>
                    ))}
                    {replyTo === c.id && (
                      <li>
                        <Composer
                          value={replyText}
                          onChange={setReplyText}
                          name={name}
                          onName={setName}
                          website={website}
                          onWebsite={setWebsite}
                          busy={busy}
                          onSubmit={() => submit({ body: replyText, parentId: c.id })}
                          placeholder={`Reply to ${c.name || 'Anonymous'}…`}
                          submitLabel="Reply"
                          autoFocus
                          compact
                          onCancel={() => setReplyTo(null)}
                        />
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        {roots.length > 8 && !showAll && (
          <button type="button" onClick={() => setShowAll(true)} className="btn-secondary mt-6">
            Show all {roots.length} threads
          </button>
        )}
      </div>
    </section>
  );
}

function CommentItem({ comment, isAdmin, onReply, onDelete, highlight, reply, replying }) {
  return (
    <div className={`group flex gap-3 ${highlight ? 'animate-fade-in' : ''}`}>
      <Avatar name={comment.name} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
          <span className="font-semibold text-zinc-100">{comment.name || 'Anonymous'}</span>
          <span className="text-zinc-500">{timeAgo(comment.createdAt)}</span>
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-zinc-300">{comment.text}</p>
        <div className="mt-2 flex items-center gap-4 text-[12px] text-zinc-400">
          {!reply && onReply && (
            <button type="button" onClick={onReply} aria-expanded={replying} className="transition-colors hover:text-brand-300">
              {replying ? 'Cancel reply' : 'Reply'}
            </button>
          )}
          {isAdmin && (
            <button type="button" onClick={() => confirm('Delete this comment?') && onDelete(comment.id)} className="transition-colors hover:text-red-400">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
