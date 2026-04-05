import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { renderDescriptor } from './renderer.jsx';

// Module cache to avoid re-importing the same bundle script
const bundleModuleCache = {};

// Load a bundle view function dynamically
async function loadBundleView({ bundleName, bundleScript, viewName }) {
  const cacheKey = `${bundleName}/${bundleScript}`;
  if (!bundleModuleCache[cacheKey]) {
    bundleModuleCache[cacheKey] = await import(/* @vite-ignore */ `/bundles/${bundleName}/${bundleScript}?v=${Date.now()}`);
  }
  const mod = bundleModuleCache[cacheKey];
  return mod.default?.views?.[viewName] ?? mod.views?.[viewName];
}

// Error boundary to catch React render crashes and show a message instead of a white page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[BundleViewPage] Render crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Alert severity="error">
          {this.state.error.message}
          <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 12, mt: 1 }}>
            {this.state.error.stack}
          </Typography>
        </Alert>
      );
    }
    return this.props.children;
  }
}

/**
 * Generic page component that bridges bundle view functions to the shell renderer.
 *
 * Props:
 *   bundleName   — bundle directory name
 *   viewName     — name of the view function exported from the bundle
 *   bundleScript — filename of the bundle script (e.g. 'index.js')
 *   fetchUrls    — array of API endpoints to fetch (default []). Callers must
 *                  stabilize this array (e.g. with useMemo) to avoid spurious re-fetches.
 *   token        — optional auth token (added as Bearer header)
 *   showToast    — optional toast callback passed to actions
 *   resolveView  — optional function for testing; bypasses dynamic import
 *
 * Note: dynamic import uses `/bundles/{bundleName}/{bundleScript}` — this pattern
 * assumes bundles are served as standalone externally-built files at that path.
 * Vite cannot code-split or analyze variable import paths.
 */
export default function BundleViewPage({
  bundleName,
  viewName,
  bundleScript,
  fetchUrls = [],
  token,
  showToast,
  resolveView,
}) {
  const navigate = useNavigate();
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewFn, setViewFn] = useState(null);

  const fetchWithAuth = useCallback(
    (url, options = {}) =>
      fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (fetchUrls.length > 0) {
        // Resolve :param placeholders in URLs using React Router params
        const resolvedUrls = fetchUrls.map((url) =>
          url.replace(/:([a-zA-Z_]+)/g, (_, key) => params[key] || `:${key}`)
        );
        const results = await Promise.all(
          resolvedUrls.map((url) =>
            fetchWithAuth(url).then((res) => {
              // fetch only rejects on network failure; throw explicitly for HTTP errors
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
          )
        );
        setData(fetchUrls.length === 1 ? results[0] : results);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('[BundleViewPage] Fetch error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchUrls, fetchWithAuth]);

  useEffect(() => {
    // Load the view function
    const loadView = async () => {
      try {
        let fn;
        if (resolveView) {
          fn = await resolveView({ bundleName, viewName, bundleScript });
        } else {
          fn = await loadBundleView({ bundleName, bundleScript, viewName });
        }
        // Wrap in updater to safely store a function in state
        setViewFn(() => fn);
      } catch (err) {
        console.error('[BundleViewPage] Bundle load error:', err);
        setError(err.message || 'Failed to load bundle');
        setLoading(false);
      }
    };

    loadView();
    load();
  }, [bundleName, viewName, bundleScript, resolveView, load]);

  // Show error alert if fetch or bundle load failed — must be checked before the
  // spinner guard, because a bundle-load failure leaves viewFn as null
  if (error) {
    return renderDescriptor({
      type: 'alert',
      props: { severity: 'error', content: `Failed to load: ${error}` },
    });
  }

  // While loading or view function not yet resolved, show spinner
  if (loading || !viewFn) {
    return renderDescriptor({ type: 'spinner', props: {} });
  }

  const actions = {
    navigate,
    params,
    api: fetchWithAuth,
    refresh: load,
    // Dialog rendering is out of scope for this component; no-op stubs prevent
    // bundle authors from calling showDialog/closeDialog and expecting a result.
    showDialog: () => {},
    closeDialog: () => {},
    showToast,
  };

  const result = viewFn({ data, actions });

  // Decoupled rendering: if the view returns a React element (JSX), render it directly.
  // If it returns a descriptor object ({ type, props, children }), use the descriptor renderer.
  // This allows bundles and app overrides to use any UI approach.
  const isReactElement = result && (result.$$typeof || result.type && typeof result.type === 'function');

  return (
    <ErrorBoundary>
      {isReactElement ? result : renderDescriptor(result)}
    </ErrorBoundary>
  );
}
