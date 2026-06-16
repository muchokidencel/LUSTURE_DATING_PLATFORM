import { render, screen } from '@testing-library/react';
import { Badge } from './badge';
import { describe, it, expect } from 'vitest';

describe('Badge component', () => {
  it('renders correctly', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild).toHaveClass('text-lustre-muted');
  });
});

