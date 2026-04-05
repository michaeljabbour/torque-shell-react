import { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const ToastContext = createContext(null);

/**
 * ToastProvider — wraps the app and provides global toast notifications.
 * Usage: wrap <AuthProvider> with <ToastProvider>.
 * Consume via useToast() hook.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { message, severity, key }

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ message, severity, key: Date.now() });
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        key={toast?.key}
        open={!!toast}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert
            onClose={handleClose}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

// No-op fallback used when ToastProvider is absent (tests, isolated renders)
const NOOP_TOAST = { showToast: () => {} };

/**
 * useToast — returns { showToast(message, severity) }
 * severity: 'success' | 'error' | 'warning' | 'info'
 *
 * Gracefully returns a no-op if called outside a ToastProvider, so toast
 * notifications don't crash code that runs in tests or isolated trees.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? NOOP_TOAST;
}
