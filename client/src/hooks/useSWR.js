import { useEffect, useState } from 'react';
import { peek, load } from '../lib/api';

// Returns cached data immediately (even if stale) and revalidates in the background.
// Mount it with a `key` prop on the component when the cache key can change.
export function useSWR(key, fetcher, { ttl = 60_000 } = {}) {
  const [data, setData] = useState(() => peek(key)?.data);
  const [error, setError] = useState(null);
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hit = peek(key);
    if (hit && Date.now() - hit.at < ttl) return undefined; // still fresh
    setRevalidating(true);
    load(key, fetcher)
      .then((d) => !cancelled && (setData(d), setError(null)))
      .catch((e) => !cancelled && !hit && setError(e))
      .finally(() => !cancelled && setRevalidating(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, error, loading: data === undefined && !error, revalidating };
}
