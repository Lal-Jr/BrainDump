import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, verifyToken, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Only visitors who already have a token trigger a verify request; readers never do.
export function AuthProvider({ children }) {
  const [status, setStatus] = useState(() => (getToken() ? 'checking' : 'anon')); // anon | checking | authed

  useEffect(() => {
    if (status !== 'checking') return undefined;
    let cancelled = false;
    verifyToken()
      .then(() => !cancelled && setStatus('authed'))
      .catch(() => {
        if (cancelled) return;
        setToken(null);
        setStatus('anon');
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Any admin request that comes back 401 (expired token) signs you out
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setStatus('anon');
    };
    window.addEventListener('bd:unauthorized', onUnauthorized);
    return () => window.removeEventListener('bd:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (password) => {
    const { token } = await apiLogin(password);
    setToken(token);
    setStatus('authed');
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setStatus('anon');
  }, []);

  const value = useMemo(() => ({ authenticated: status === 'authed', loading: status === 'checking', login, logout }), [status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
