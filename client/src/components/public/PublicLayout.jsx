import { Outlet } from 'react-router-dom';
import { withBase } from '../../base';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import SmoothLink from '../ui/SmoothLink';
import GridMarks from '../ui/GridMarks';

// One column, one width, from header to footer. Deliberately quiet.
export default function PublicLayout() {
  useScrollRestoration();

  return (
    <div className="flex min-h-screen flex-col">
      <GridMarks />

      <header className="vt-header sticky top-0 z-40 border-b border-white/10 bg-surface-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <SmoothLink to="/" className="wordmark transition-colors hover:text-brand-300">
            Brain Dump
          </SmoothLink>
          {/* Plain <a>: the portfolio is a different app, so this is a full page load */}
          <a href="/" className="text-[12px] text-zinc-400 transition-colors hover:text-zinc-100">
            Portfolio &rarr;
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-[12px] text-zinc-400">
          <p>Brain Dump &middot; Harish Lal</p>
          <nav className="flex items-center gap-5" aria-label="Footer">
            <SmoothLink to="/" className="transition-colors hover:text-zinc-100">
              All posts
            </SmoothLink>
            <a href={withBase('rss.xml')} className="transition-colors hover:text-zinc-100">
              RSS
            </a>
            <a href="/" className="transition-colors hover:text-zinc-100">
              Portfolio
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
