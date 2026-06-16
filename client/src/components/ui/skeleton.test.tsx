import { render } from '@testing-library/react';
import { Skeleton } from './skeleton';
import { describe, it, expect } from 'vitest';

describe('Skeleton component', () => {
  it('renders correctly', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
