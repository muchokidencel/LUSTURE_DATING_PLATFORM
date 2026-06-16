import { render, screen } from '@testing-library/react';
import ReferralDashboard from './ReferralDashboard';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks
vi.mock('../hooks/useQueries', () => ({
  useReferralStats: () => ({ data: { totalReferrals: 10, totalEarnings: 150, withdrawnEarnings: 50, availableEarnings: 100 }, isLoading: false }),
  useReferralActivity: () => ({ data: [], isLoading: false }),
  useReferralEarnings: () => ({ data: { available: 100, pending: 50, canWithdraw: false }, isLoading: false }),
  useWithdraw: () => ({ mutate: vi.fn(), isPending: false }),
}));


// Mock AuthContext
vi.mock('../context/AuthContext', async () => {
  return {
    useAuth: () => ({
      user: { id: 1, email: 'test@test.com', referralCode: 'TESTCODE' },
    }),
  };
});

const queryClient = new QueryClient();

describe('ReferralDashboard', () => {
  it('renders stats and referral link', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ReferralDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
    expect(screen.getAllByText(/REFERRAL/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Lustre Rewards/i)).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});

