import { render, screen } from '@testing-library/react';
import { AgeSlider } from './AgeSlider';
import { describe, it, expect, vi } from 'vitest';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

describe('AgeSlider component', () => {
  it('renders correctly with given value range', () => {
    const handleValueChange = vi.fn();
    render(<AgeSlider value={[20, 35]} onValueChange={handleValueChange} min={18} max={80} />);
    
    // Radix Slider thumbs have roles or aria attributes
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute('aria-valuenow', '20');
    expect(thumbs[1]).toHaveAttribute('aria-valuenow', '35');
  });
});
