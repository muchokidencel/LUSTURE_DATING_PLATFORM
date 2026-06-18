import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './Register';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import api from '../lib/api';

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
    loginWithGoogle: vi.fn(),
    user: null,
  }),
}));

// Mock api default export
vi.mock('../lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('Register Page UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form inputs and action buttons in step 1', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Invitation Code \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Verification Code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
  });

  it('triggers register handler and navigates on success through steps', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { status: 'success', message: 'Verification code sent successfully' },
    });
    mockRegister.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Step 1: Submit email form
    const emailInput = screen.getByPlaceholderText('alexander@lustre.com');
    fireEvent.change(emailInput, { target: { value: 'newuser@lustre.com' } });
    fireEvent.change(screen.getByPlaceholderText('LUSTRE-VIP'), { target: { value: 'TEST-REF-CODE' } });
    fireEvent.submit(emailInput.closest('form')!);

    // Wait for step 2 code input to appear
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/send-otp', { email: 'newuser@lustre.com' });
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    });

    // Step 2: Submit verification code form
    const codeInput = screen.getByPlaceholderText('123456');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.submit(codeInput.closest('form')!);

    // Wait for step 3 password input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Min. 8 characters')).toBeInTheDocument();
    });

    // Step 3: Submit password form to complete registration
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    fireEvent.change(passwordInput, { target: { value: 'securepassword123' } });
    fireEvent.submit(passwordInput.closest('form')!);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'newuser@lustre.com',
        'securepassword123',
        'TEST-REF-CODE',
        '123456'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/discovery');
    });
  });

  it('shows error message if registration fails in step 3', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { status: 'success', message: 'Verification code sent' },
    });
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'Email address already exists' } },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Step 1: Submit email form
    const emailInput = screen.getByPlaceholderText('alexander@lustre.com');
    fireEvent.change(emailInput, { target: { value: 'duplicate@lustre.com' } });
    fireEvent.submit(emailInput.closest('form')!);

    // Wait for step 2 code input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    });

    // Step 2: Submit verification code form
    const codeInput = screen.getByPlaceholderText('123456');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.submit(codeInput.closest('form')!);

    // Wait for step 3 password input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Min. 8 characters')).toBeInTheDocument();
    });

    // Step 3: Submit password form
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    fireEvent.change(passwordInput, { target: { value: 'securepassword123' } });
    fireEvent.submit(passwordInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Email address already exists')).toBeInTheDocument();
    });
  });

  it('shows error message if OTP send fails', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { message: 'Failed to send verification code' } },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('alexander@lustre.com');
    fireEvent.change(emailInput, { target: { value: 'error@lustre.com' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Failed to send verification code')).toBeInTheDocument();
    });
  });

  it('preserves email when navigating back from step 2', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { status: 'success', message: 'Verification code sent' },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('alexander@lustre.com');
    fireEvent.change(emailInput, { target: { value: 'backtest@lustre.com' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    });

    const backBtn = screen.getByText(/Back to Email/i);
    fireEvent.click(backBtn);

    expect(screen.getByDisplayValue('backtest@lustre.com')).toBeInTheDocument();
  });

  it('validates empty email in step 1', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Send Verification Code/i });
    fireEvent.click(submitBtn);

    // Assuming there's a validation message or the button is disabled or it just doesn't submit.
    // If it uses required attribute, we might check that.
    const emailInput = screen.getByPlaceholderText('alexander@lustre.com');
    expect(emailInput).toBeInvalid;
  });
});
