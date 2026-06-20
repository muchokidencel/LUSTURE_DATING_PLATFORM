import { render } from '@testing-library/react';
import BottomNav from './BottomNav';
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

describe('BottomNav component', () => {
  it('renders navigation links', () => {
    const { container } = render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );
    expect(container.querySelector('a[href="/discovery"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/matches"]')).toBeInTheDocument();
  });
});
