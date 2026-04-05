import { describe, it, expect } from 'vitest';
import { createShell } from '../../src/createShell.js';

describe('createShell', () => {
  it('returns an Express middleware function', () => {
    const middleware = createShell();
    expect(typeof middleware).toBe('function');
  });

  it('accepts config with theme/branding/auth/shell options', () => {
    const config = {
      theme: { primary: '#1976d2' },
      branding: { title: 'My App', logo: '/logo.png' },
      auth: { enabled: true, loginPath: '/login' },
      shell: { defaultRoute: '/dashboard', theme: 'dark' },
    };
    const middleware = createShell(config);
    expect(typeof middleware).toBe('function');
  });

  it('middleware accepts (req, res) or (req, res, next) with length >= 2', () => {
    const middleware = createShell();
    // Express Router has length 3; spec requires at minimum (req, res) = 2
    expect(middleware.length).toBeGreaterThanOrEqual(2);
  });
});
