import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BundleViewPage from '../src/BundleViewPage.jsx';

function renderPage(props) {
  return render(
    <MemoryRouter>
      <BundleViewPage {...props} />
    </MemoryRouter>
  );
}

describe('BundleViewPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows spinner while loading', () => {
    // resolveView never resolves — viewFn never gets set
    const resolveView = () => new Promise(() => {});

    renderPage({
      bundleName: 'test-bundle',
      viewName: 'testView',
      bundleScript: 'index.js',
      resolveView,
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error when bundle load fails', async () => {
    const resolveView = () => Promise.reject(new Error('Bundle load error'));

    renderPage({
      bundleName: 'test-bundle',
      viewName: 'testView',
      bundleScript: 'index.js',
      resolveView,
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('shows error when fetch fails', async () => {
    const mockViewFn = () => ({
      type: 'text',
      props: { content: 'Hello', variant: 'body1' },
    });
    const resolveView = () => Promise.resolve(mockViewFn);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    renderPage({
      bundleName: 'test-bundle',
      viewName: 'testView',
      bundleScript: 'index.js',
      fetchUrls: ['/api/data'],
      resolveView,
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('shows error when fetch returns HTTP error status', async () => {
    const mockViewFn = () => ({
      type: 'text',
      props: { content: 'Should not render', variant: 'body1' },
    });
    const resolveView = () => Promise.resolve(mockViewFn);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    });

    renderPage({
      bundleName: 'test-bundle',
      viewName: 'testView',
      bundleScript: 'index.js',
      fetchUrls: ['/api/data'],
      resolveView,
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('renders descriptor from view function when data loads', async () => {
    const mockViewFn = () => ({
      type: 'text',
      props: { content: 'View rendered successfully', variant: 'body1' },
    });
    const resolveView = () => Promise.resolve(mockViewFn);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: ['a', 'b'] }),
    });

    renderPage({
      bundleName: 'test-bundle',
      viewName: 'testView',
      bundleScript: 'index.js',
      fetchUrls: ['/api/data'],
      resolveView,
    });

    await waitFor(() => {
      expect(screen.getByText('View rendered successfully')).toBeInTheDocument();
    });
  });
});
