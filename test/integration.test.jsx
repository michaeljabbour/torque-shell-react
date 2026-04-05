import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App.jsx';

// Helper to mock fetch with a given introspection payload
function mockFetch(introspection) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(introspection),
  });
}

describe('Linux Desktop Test — auto-wiring contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('bundles with ui: section get routes and navigation', async () => {
    mockFetch({
      bundles: {
        pipeline: {
          ui: {
            navigation: [{ label: 'Pipeline', path: '/pipeline' }],
            routes: [{ path: '/pipeline', component: 'PipelineView', script: 'index.js' }],
          },
        },
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
    });
  });

  it('bundles without ui: section do NOT get routes or navigation', async () => {
    mockFetch({
      bundles: {
        identity: {
          // No ui field — API-only bundle
        },
        pipeline: {
          ui: {
            navigation: [{ label: 'Pipeline', path: '/pipeline' }],
            routes: [{ path: '/pipeline', component: 'PipelineView', script: 'index.js' }],
          },
        },
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
    });

    expect(screen.queryByText('identity')).not.toBeInTheDocument();
    expect(screen.queryByText('Identity')).not.toBeInTheDocument();
  });

  it('removing a bundle from introspection removes its routes and nav', async () => {
    // First render: pipeline + tasks
    mockFetch({
      bundles: {
        pipeline: {
          ui: {
            navigation: [{ label: 'Pipeline', path: '/pipeline' }],
            routes: [{ path: '/pipeline', component: 'PipelineView', script: 'index.js' }],
          },
        },
        tasks: {
          ui: {
            navigation: [{ label: 'Tasks', path: '/tasks' }],
            routes: [{ path: '/tasks', component: 'TasksView', script: 'index.js' }],
          },
        },
      },
    });

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });

    unmount();

    // Reset mock for second render
    vi.restoreAllMocks();

    // Second render: only pipeline
    mockFetch({
      bundles: {
        pipeline: {
          ui: {
            navigation: [{ label: 'Pipeline', path: '/pipeline' }],
            routes: [{ path: '/pipeline', component: 'PipelineView', script: 'index.js' }],
          },
        },
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
    });

    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
  });

  it('no bundles with UI shows empty state', async () => {
    mockFetch({
      bundles: {
        identity: {
          // No ui field — API-only bundle
        },
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no bundles with ui/i)).toBeInTheDocument();
    });
  });
});
