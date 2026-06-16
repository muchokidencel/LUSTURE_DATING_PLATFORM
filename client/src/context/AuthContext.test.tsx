import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const TestComponent = () => {
  const { user, login, register, logout, loading, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      <span data-testid="user-email">{user?.email || 'no-email'}</span>
      <span data-testid="loading-status">{loading ? 'loading' : 'idle'}</span>
      <button onClick={() => login('test@me.com', 'pass123')} data-testid="login-btn">Login</button>
      <button onClick={() => register('new@me.com', 'pass123', 'ref1')} data-testid="register-btn">Register</button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with user from localStorage if present', () => {
    const mockUser = { id: 10, email: 'local@stored.com', referralCode: 'ABC' };
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('local@stored.com');
  });

  it('should handle successful login', async () => {
    const mockUser = { id: 1, email: 'test@me.com', referralCode: 'VIP' };
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'acc-token',
          refreshToken: 'ref-token',
          user: mockUser,
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    await act(async () => {
      loginBtn.click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@me.com', password: 'pass123' });
    expect(localStorage.getItem('accessToken')).toBe('acc-token');
    expect(localStorage.getItem('refreshToken')).toBe('ref-token');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('test@me.com');
  });

  it('should handle successful register', async () => {
    const mockUser = { id: 2, email: 'new@me.com', referralCode: 'VIP2' };
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'acc-token-2',
          refreshToken: 'ref-token-2',
          user: mockUser,
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerBtn = screen.getByTestId('register-btn');
    await act(async () => {
      registerBtn.click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', { email: 'new@me.com', password: 'pass123', referralCode: 'ref1' });
    expect(localStorage.getItem('accessToken')).toBe('acc-token-2');
    expect(localStorage.getItem('refreshToken')).toBe('ref-token-2');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('new@me.com');
  });

  it('should handle logout', () => {
    localStorage.setItem('accessToken', 'token');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@test.com' }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');

    const logoutBtn = screen.getByTestId('logout-btn');
    act(() => {
      logoutBtn.click();
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
  });
});
