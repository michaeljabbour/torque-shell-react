import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Layout from './Layout.jsx';
import BundleViewPage from './BundleViewPage.jsx';
import { createDefaultTheme } from './theme.js';

const TOKEN_KEY = '__torque_token__';
const REFRESH_KEY = '__torque_refresh__';
const USER_KEY = '__torque_user__';

function getStoredToken() { return localStorage.getItem(TOKEN_KEY); }
function getStoredUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }

function storeAuth(data) {
  if (data.access_token) localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function LoginPage({ config, onLogin }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/identity/sign_up' : '/api/identity/sign_in';
      const body = mode === 'signup' ? { email, password, name } : { email, password };
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      storeAuth(data);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const branding = config?.branding?.title || 'Torque App';

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 500, textAlign: 'center' }}>{branding}</Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>{mode === 'signup' ? 'Create account' : 'Sign in'}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <TextField label="Name" fullWidth sx={{ mb: 2 }} value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <TextField label="Email" type="email" fullWidth required sx={{ mb: 2 }} value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth required sx={{ mb: 2 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 1 }}>
            {loading ? 'Loading...' : (mode === 'signup' ? 'Create account' : 'Sign in')}
          </Button>
        </form>
        <Button variant="text" size="small" fullWidth onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); }}>
          {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </Button>
      </Paper>
    </Box>
  );
}

export default function App({ config = {} }) {
  const [introspection, setIntrospection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);
  const [themeMode, setThemeMode] = useState(
    localStorage.getItem('__torque_theme__') || config.theme?.mode || 'dark'
  );
  const [userProfile, setUserProfile] = useState(null);

  const authEnabled = !!config.auth?.bundle || !!config.auth?.loginPath;

  const handleLogin = useCallback((data) => {
    setToken(data.access_token);
    setUser(data.user);
    // Fetch user's theme preference
    if (data.access_token) {
      fetch('/api/profile/settings', { headers: { Authorization: `Bearer ${data.access_token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(settings => { if (settings?.theme) setThemeMode(settings.theme); })
        .catch(() => {});
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  // Validate the stored token once on mount. If it is expired or revoked the
  // server returns a non-2xx response and we clear local auth state so the
  // user is redirected to the login page rather than silently getting 401s on
  // every bundle panel fetch.
  useEffect(() => {
    if (!token) return;
    fetch('/api/identity/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) {
          clearAuth();
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        clearAuth();
        setToken(null);
        setUser(null);
      });
  }, []); // intentional: validate once on mount only

  useEffect(() => {
    // Include the stored token so this call works in production where
    // systemAuth requires authentication on /api/introspect.
    const storedToken = getStoredToken();
    fetch('/api/introspect', {
      headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setIntrospection(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  }, []);

  // Also fetch theme preference on mount if already logged in
  useEffect(() => {
    if (token) {
      fetch('/api/profile/settings', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(settings => { if (settings?.theme) setThemeMode(settings.theme); })
        .catch(() => {});
    }
  }, [token]);

  // Fetch user profile (avatar, display_name) on mount when logged in
  useEffect(() => {
    if (token) {
      fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p) setUserProfile(p); })
        .catch(() => {});
    }
  }, [token]);

  const theme = createDefaultTheme({ primary: config.theme?.primaryColor, mode: themeMode });

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Alert severity="error">Failed to load application: {error}</Alert>
      </ThemeProvider>
    );
  }

  // If auth is enabled and no token, show login
  if (authEnabled && !token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginPage config={config} onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  // Collect nav items and routes from bundles with UI; skip API-only bundles (no ui field)
  const navItems = [];
  const routes = [];

  for (const [bundleName, bundle] of Object.entries(introspection.bundles)) {
    if (!bundle.ui) continue;

    if (bundle.ui.navigation) {
      for (const navItem of bundle.ui.navigation) {
        navItems.push({ ...navItem, bundle: bundleName });
      }
    }

    if (bundle.ui.routes) {
      for (const route of bundle.ui.routes) {
        routes.push({ ...route, bundle: bundleName, script: route.script || bundle.ui.script });
      }
    }
  }

  const defaultRoute = config.shell?.defaultRoute || '/';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout navItems={navItems} branding={config.branding} user={user} userProfile={userProfile} onLogout={handleLogout}>
          {routes.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>No bundles with UI mounted.</Box>
          ) : (
            <Routes>
              {routes.map((route) => {
                // App-level view override: if the app config specifies an override
                // for this route, load it from /app-ui/ instead of from the bundle.
                const appOverrides = config.app?.ui?.overrides || config.ui?.overrides || {};
                const overridePath = appOverrides[route.path];
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <BundleViewPage
                        bundleName={route.bundle}
                        viewName={route.component}
                        bundleScript={route.script}
                        fetchUrls={route.fetchUrls || []}
                        token={token}
                        resolveView={overridePath ? async () => {
                          const mod = await import(/* @vite-ignore */ `/app-ui/${overridePath}?v=${Date.now()}`);
                          return mod.default || mod;
                        } : undefined}
                      />
                    }
                  />
                );
              })}
              <Route path="*" element={<Navigate to={defaultRoute} replace />} />
            </Routes>
          )}
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
