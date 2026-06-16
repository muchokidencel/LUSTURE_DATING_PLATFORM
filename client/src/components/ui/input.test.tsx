import { render, screen } from '@testing-library/react';
import { Input } from './input';
import { describe, it, expect } from 'vitest';

describe('Input component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });
});
