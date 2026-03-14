import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('bd_token'));
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (token) {
      // Verify token is still valid
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setAuthenticated(true);
          } else {
            localStorage.removeItem('bd_token');
            setToken(null);
            setAuthenticated(false);
          }
        })
        .catch(() => {
          setAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  async function login(password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('bd_token', data.token);
    setToken(data.token);
    setAuthenticated(true);
    return data;
  }

  function logout() {
    localStorage.removeItem('bd_token');
    setToken(null);
    setAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ token, authenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
