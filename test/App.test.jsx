import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App.jsx';

// Mock introspection response: pipeline/deal-list/tasks have UI, identity is API-only (no ui field)
const mockIntrospection = {
  bundles: {
    pipeline: {
      ui: {
        navigation: [{ label: 'Pipeline', path: '/pipeline' }],
        routes: [{ path: '/pipeline', component: 'PipelineView', script: 'index.js' }],
      },
    },
    'deal-list': {
      ui: {
        navigation: [{ label: 'Deal List', path: '/deals' }],
        routes: [{ path: '/deals', component: 'DealListView', script: 'index.js' }],
      },
    },
    tasks: {
      ui: {
        navigation: [{ label: 'Tasks', path: '/tasks' }],
        routes: [{ path: '/tasks', component: 'TasksView', script: 'index.js' }],
      },
    },
    identity: {
      // No ui field — API-only bundle; should not generate nav items
    },
  },
};

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches /api/introspect and generates navigation from bundles with UI', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockIntrospection),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Deal List')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });

    // Verify fetch was called with /api/introspect (with optional headers object)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/introspect', expect.objectContaining({ headers: expect.any(Object) }));
  });

  it('shows error state when introspection fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('API-only bundles do not generate nav items (identity/Auth not visible, Pipeline visible)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockIntrospection),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
    });

    // Auth / identity bundle should NOT appear as a nav item
    expect(screen.queryByText('Auth')).not.toBeInTheDocument();
    expect(screen.queryByText('identity')).not.toBeInTheDocument();
  });
});
