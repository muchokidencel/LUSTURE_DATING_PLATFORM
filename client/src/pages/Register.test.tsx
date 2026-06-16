import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './Register';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
  }),
}));

describe('Register Page UI', () => {
  it('renders all form inputs and action buttons', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Invitation Code \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apple/i })).toBeInTheDocument();
  });

  it('triggers register handler and navigates on success', async () => {
    mockRegister.mockResolvedValueOnce({});
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('alexander@lustre.com'), {
      target: { value: 'newuser@lustre.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'securepassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText('LUSTRE-VIP'), {
      target: { value: 'TEST-REF-CODE' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'newuser@lustre.com',
        'securepassword123',
        'TEST-REF-CODE'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/discovery');
    });
  });

  it('shows error message if registration fails', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'Email address already exists' } },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('alexander@lustre.com'), {
      target: { value: 'duplicate@lustre.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'securepassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email address already exists')).toBeInTheDocument();
    });
  });
});
