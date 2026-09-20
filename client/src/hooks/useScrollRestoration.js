import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// New page: start at the top. Back/forward: return to where you were (the feed is long enough
// that losing your place after reading a post is annoying).
const positions = new Map();

export function useScrollRestoration() {
  const location = useLocation();
  const type = useNavigationType();

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const y = type === 'POP' ? positions.get(location.key) ?? 0 : 0;
    // after paint, so cached content has laid out
    requestAnimationFrame(() => window.scrollTo(0, y));

    let frame = 0;
    const save = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        positions.set(location.key, window.scrollY);
      });
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      positions.set(location.key, window.scrollY);
      window.removeEventListener('scroll', save);
    };
  }, [location.key, type]);
}
