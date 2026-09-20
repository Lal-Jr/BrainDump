import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

// Navigate inside a View Transition (a short cross-fade) where the browser supports it.
export function navigateSmooth(navigate, to, options) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduce) document.startViewTransition(() => flushSync(() => navigate(to, options)));
  else navigate(to, options);
}

// <Link> with the cross-fade, plus `prefetch`: called on hover / focus / touch so the next page's
// code and data are already loading by the time you click.
export default function SmoothLink({ to, prefetch, onClick, onMouseEnter, onFocus, onTouchStart, ...rest }) {
  const navigate = useNavigate();
  const warm = (handler) => (e) => {
    prefetch?.();
    handler?.(e);
  };
  return (
    <Link
      to={to}
      {...rest}
      onMouseEnter={warm(onMouseEnter)}
      onFocus={warm(onFocus)}
      onTouchStart={warm(onTouchStart)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') return;
        e.preventDefault();
        navigateSmooth(navigate, to);
      }}
    />
  );
}
