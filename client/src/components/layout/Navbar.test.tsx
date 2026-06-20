import { render, screen } from '@testing-library/react';
import Navbar from './Navbar';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock AuthContext
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../context/AuthContext')>('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 1, email: 'test@test.com' },
      logout: vi.fn(),
      loading: false,
    }),
  };
});

// Mock useQueries hooks to prevent React Query errors
vi.mock('../../hooks/useQueries', () => ({
  useNotifications: () => ({ data: [], isLoading: false }),
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn() }),
}));

describe('Navbar component', () => {
  it('renders logo', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(screen.getByText('Lustre')).toBeInTheDocument();
  });
});
