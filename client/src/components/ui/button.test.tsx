import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { describe, it, expect } from 'vitest';

describe('Button component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('text-lustre-rose');
  });
});

