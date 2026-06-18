import { render, screen } from '@testing-library/react';
import Matches from './Matches';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as hooks from '../hooks/useQueries';

// Mock useQueries hooks
vi.mock('../hooks/useQueries', () => ({
  useMatches: vi.fn(),
  useProfile: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('Matches Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders matches correctly for premium users', () => {
    vi.mocked(hooks.useProfile).mockReturnValue({
      data: { premiumTier: 'premium' },
      isLoading: false,
    } as any);

    vi.mocked(hooks.useMatches).mockReturnValue({
      data: [
        { 
          id: 1, 
          otherUser: { 
            id: 2, 
            displayName: 'Match One', 
            city: 'Nairobi',
            bio: 'Bio One',
            photos: [{ url: 'match1.jpg' }],
            premiumTier: 'free'
          },
        },
      ],
      isLoading: false,
    } as any);

    render(<Matches />, { wrapper });
    expect(screen.getByText('Match One')).toBeInTheDocument();
  });

  it('shows upgrade message for free users', () => {
    vi.mocked(hooks.useProfile).mockReturnValue({
      data: { premiumTier: 'free' },
      isLoading: false,
    } as any);

    vi.mocked(hooks.useMatches).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<Matches />, { wrapper });
    expect(screen.getByText(/Your Connections Await/i)).toBeInTheDocument();
  });
});
