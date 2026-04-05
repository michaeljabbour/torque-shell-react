import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/AuthContext.jsx';
import LoginPage from '../src/LoginPage.jsx';

// Helper component to expose auth state via data-testids
function AuthStatus() {
  const { isAuthenticated, user } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'yes' : 'no'}</span>
      {user && <span data-testid="user-name">{user.name}</span>}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('starts unauthenticated when no token in storage', async () => {
    // No token in sessionStorage — fetch should not be called
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false });

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('no');
    });

    // No token means no fetch call
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('login stores token and sets user', async () => {
    // Mock fetch to return successful login response
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'test-token',
        user: { name: 'Test User', email: 'test@test.com' },
      }),
    });

    render(
      <AuthProvider>
        <AuthStatus />
        <LoginPage />
      </AuthProvider>
    );

    // Wait for initial unauthenticated state (no token on mount)
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('no');
    });

    // Click the Sign in button
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await act(async () => {
      signInButton.click();
    });

    // After login, should be authenticated with the user's name
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('yes');
    });

    expect(screen.getByTestId('user-name').textContent).toBe('Test User');
    expect(sessionStorage.getItem('token')).toBe('test-token');
  });
});
