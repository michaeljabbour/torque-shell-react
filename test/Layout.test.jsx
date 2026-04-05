import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../src/Layout.jsx';

function renderLayout(props) {
  return render(
    <MemoryRouter>
      <Layout {...props} />
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('renders navigation items from props', () => {
    const navItems = [
      { path: '/pipeline', label: 'Pipeline' },
      { path: '/tasks', label: 'Tasks' },
      { path: '/pulse', label: 'Pulse' },
    ];
    renderLayout({ navItems });

    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
  });

  it('renders branding name from props', () => {
    renderLayout({ branding: { name: 'My App' } });

    expect(screen.getByText('My App')).toBeInTheDocument();
  });

  it('renders children in main content area', () => {
    renderLayout({
      children: <div>Main content here</div>,
    });

    expect(screen.getByText('Main content here')).toBeInTheDocument();
  });

  it('renders with empty navItems', () => {
    renderLayout({
      children: <div>No nav</div>,
      navItems: [],
    });

    expect(screen.getByText('No nav')).toBeInTheDocument();
  });
});
