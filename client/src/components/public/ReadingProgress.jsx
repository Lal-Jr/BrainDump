import { useEffect, useRef } from 'react';

// Thin progress line across the top. Written straight to the DOM in a rAF-throttled handler,
// so scrolling never triggers a React render.
export default function ReadingProgress() {
  const bar = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-50 h-[3px] w-full" aria-hidden>
      <div ref={bar} className="h-full origin-left bg-brand-300" style={{ transform: 'scaleX(0)' }} />
    </div>
  );
}
