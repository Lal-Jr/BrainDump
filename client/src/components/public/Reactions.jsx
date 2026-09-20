import { useEffect, useRef, useState } from 'react';
import { fetchReactions, setReaction } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const TYPES = [
  { key: 'helpful', label: 'Helpful' },
  { key: 'loved', label: 'Loved it' },
  { key: 'thoughtful', label: 'Made me think' },
];

// One-tap feedback for readers who don't want to write a comment. Optimistic: the count moves
// immediately and rolls back if the request fails.
export default function Reactions({ postId }) {
  const toast = useToast();
  const [state, setState] = useState({ counts: {}, mine: [] });
  const touched = useRef(false); // once you've reacted, a late initial fetch must not overwrite it

  useEffect(() => {
    let cancelled = false;
    fetchReactions(postId).then((s) => !cancelled && !touched.current && setState(s)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function toggle(type) {
    touched.current = true;
    const on = !state.mine.includes(type);
    const before = state;
    setState({
      counts: { ...state.counts, [type]: Math.max(0, (state.counts[type] ?? 0) + (on ? 1 : -1)) },
      mine: on ? [...state.mine, type] : state.mine.filter((t) => t !== type),
    });
    try {
      setState(await setReaction(postId, type, on));
    } catch (e) {
      setState(before);
      toast.error(e.message);
    }
  }

  return (
    <div>
      <p className="label mb-3">Was this useful?</p>
      <div className="flex flex-wrap gap-2">
        {TYPES.map(({ key, label }) => {
          const on = state.mine.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 border px-3 py-2 text-[13px] transition-colors ${
                on ? 'border-brand-300 bg-brand-300/10 text-brand-300' : 'border-white/15 text-zinc-300 hover:border-white/40 hover:text-white'
              }`}
            >
              {label}
              <span className={on ? 'text-brand-300/70' : 'text-zinc-400'}>{state.counts[key] ?? 0}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
