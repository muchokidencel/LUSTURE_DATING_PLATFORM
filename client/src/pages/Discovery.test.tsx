import { render, screen, waitFor } from '@testing-library/react';
import Discovery from './Discovery';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import api from '../lib/api';

// Mock useQueries hooks
vi.mock('../hooks/useQueries', () => ({
  useProfile: () => ({
    data: { premiumTier: 'premium' },
    isLoading: false,
  }),
}));

// Mock useAuth context hook
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'test@example.com',
      profile: {
        latitude: -1.2921,
        longitude: 36.8219,
      },
    },
    updateUserProfile: vi.fn(),
  }),
}));

// Mock useLocation hook
vi.mock('../hooks/useLocation', () => ({
  useLocation: () => ({
    loading: false,
    error: null,
    triggerLocationUpdate: vi.fn(),
  }),
}));

// Mock api
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
  isAxiosError: vi.fn(),
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

describe('Discovery Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders discovery users correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [
          { id: 1, displayName: 'Alice', age: 25, city: 'Nairobi', photos: [{ url: 'alice.jpg' }], bio: 'Bio 1', isPremium: false },
          { id: 2, displayName: 'Bob', age: 30, city: 'Mombasa', photos: [{ url: 'bob.jpg' }], bio: 'Bio 2', isPremium: true },
        ],
        pagination: { page: 1, totalPages: 1 }
      }
    });

    render(<Discovery />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Alice, 25')).toBeInTheDocument();
      expect(screen.getByText('Bob, 30')).toBeInTheDocument();
    });
  });
});
