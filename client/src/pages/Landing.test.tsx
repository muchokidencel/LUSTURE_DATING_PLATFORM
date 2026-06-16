import { render, screen } from '@testing-library/react';
import Landing from './Landing';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

describe('Landing page', () => {
  it('renders hero text', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );
    expect(screen.getByText(/Where connections/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Lustre/i).length).toBeGreaterThan(0);
  });
});

