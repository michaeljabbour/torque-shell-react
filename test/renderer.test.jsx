import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderDescriptor } from '../src/renderer.jsx';

describe('renderDescriptor', () => {
  it('returns null for null descriptor', () => {
    const result = renderDescriptor(null);
    expect(result).toBeNull();
  });

  it('returns null for unknown type', () => {
    const result = renderDescriptor({ type: 'unknown-widget', props: {} });
    expect(result).toBeNull();
  });

  it('renders text descriptor', () => {
    const descriptor = { type: 'text', props: { content: 'Hello World', variant: 'body1' } };
    render(renderDescriptor(descriptor, 'test-text'));
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders button descriptor', () => {
    const descriptor = { type: 'button', props: { label: 'Click Me' } };
    render(renderDescriptor(descriptor, 'test-button'));
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
  });

  it('renders stack with children', () => {
    const descriptor = {
      type: 'stack',
      props: {},
      children: [
        { type: 'text', props: { content: 'Child One', variant: 'body1' } },
        { type: 'text', props: { content: 'Child Two', variant: 'body1' } },
      ],
    };
    render(renderDescriptor(descriptor, 'test-stack'));
    expect(screen.getByText('Child One')).toBeInTheDocument();
    expect(screen.getByText('Child Two')).toBeInTheDocument();
  });

  it('renders alert descriptor', () => {
    const descriptor = {
      type: 'alert',
      props: { severity: 'error', content: 'Something went wrong' },
    };
    render(renderDescriptor(descriptor, 'test-alert'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders card with title', () => {
    const descriptor = {
      type: 'card',
      props: { title: 'My Card Title' },
      children: [],
    };
    render(renderDescriptor(descriptor, 'test-card'));
    expect(screen.getByText('My Card Title')).toBeInTheDocument();
  });

  it('renders spinner with progressbar role', () => {
    const descriptor = { type: 'spinner', props: { size: 'small' } };
    render(renderDescriptor(descriptor, 'test-spinner'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders nested children from props.children', () => {
    const descriptor = {
      type: 'stack',
      props: {
        children: [
          { type: 'text', props: { content: 'Nested Child', variant: 'body2' } },
        ],
      },
    };
    render(renderDescriptor(descriptor, 'test-nested'));
    expect(screen.getByText('Nested Child')).toBeInTheDocument();
  });
});
