import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BASE } from '../../base';
import { useAuth } from '../../context/AuthContext';

// Admin shell: same language as the reader side, denser and tool-like.
export default function AdminLayout() {
  const { logout } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${BASE}sw.js`, { scope: `${BASE}admin` }).catch(() => {});
  }, []);

  const link = ({ isActive }) =>
    `px-3 py-2 text-[12px] font-medium transition-colors ${isActive ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-100'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-50/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <span className="wordmark">Brain Dump</span>
            <span className="label border border-white/15 px-2 py-1.5">Admin</span>
            <nav className="flex items-center" aria-label="Admin">
              <NavLink to="/admin" end className={link}>Posts</NavLink>
              <NavLink to="/admin/create" className={link}>New</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <a href={BASE} target="_blank" rel="noopener" className="px-3 py-2 text-[12px] text-zinc-500 transition-colors hover:text-zinc-100">
              View blog ↗
            </a>
            <button type="button" onClick={logout} className="px-3 py-2 text-[12px] text-zinc-500 transition-colors hover:text-red-400">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
