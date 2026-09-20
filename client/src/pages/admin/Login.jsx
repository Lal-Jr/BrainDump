import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE } from '../../base';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(password);
      navigate('/admin');
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm animate-fade-in">
        <p className="wordmark mb-6">Brain Dump</p>
        <h1 className="text-2xl font-bold text-zinc-50">Sign in</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" autoFocus autoComplete="current-password" required className="input" />
          <button type="submit" disabled={busy || !password} className="btn-primary w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <a href={BASE} className="mt-8 inline-block text-[12px] text-zinc-500 transition-colors hover:text-zinc-200">
          &larr; Back to the blog
        </a>
      </div>
    </div>
  );
}
