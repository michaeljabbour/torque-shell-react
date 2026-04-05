import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children, config = {} }) {
  const authBundle = config.auth?.bundle || 'identity';

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      const clearAuth = () => {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
      };

      try {
        const res = await fetch(`/api/${authBundle}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          clearAuth();
        }
      } catch {
        // Network error — treat as unauthenticated and unblock the app
        clearAuth();
      } finally {
        setLoading(false);
      }
    })();
  }, []); // intentional: validate token once on mount only

  const login = useCallback(
    async (email, password) => {
      const res = await fetch(`/api/${authBundle}/sign_in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Sign in failed');
      }
      const data = await res.json();
      sessionStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    },
    [authBundle],
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
