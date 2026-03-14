import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  // Register PWA service worker only inside admin routes
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/admin' }).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] bg-brand-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-brand-500/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-surface-50/70 backdrop-blur-2xl" />
        <div className="relative max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold shadow-lg shadow-brand-600/20 group-hover:shadow-brand-500/30 transition-shadow">
              BD
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight hidden sm:block">Brain Dump</span>
          </Link>

          <nav className="flex items-center gap-0.5">
            <NavItem to="/admin" active={pathname === '/admin'} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            }>Posts</NavItem>

            <NavItem to="/admin/create" active={pathname === '/admin/create'} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }>New</NavItem>

            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              <span className="hidden sm:inline">Blog</span>
            </a>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200 ml-1"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex-1 max-w-5xl w-full mx-auto px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-white/[0.08] text-zinc-100 shadow-sm'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
