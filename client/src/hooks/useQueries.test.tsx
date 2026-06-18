import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useProfile, 
  useUploadPhoto, 
  useDeletePhoto, 
  useDiscoveryUsers, 
  useLike,
  useMatches,
  useNotifications,
  useStats,
  useReceivedLikes,
  useSubscription,
  useReferralStats,
  useReferralActivity,
  useReferralEarnings,
  useWithdraw,
  useAdminStats,
  useAdminUsers,
  useAdminWithdrawals,
  useUpdateWithdrawal,
  useRecommendations,
  usePublicProfile,
  useUpdateProfile,
  useMarkAllNotificationsRead,
  useMarkNotificationRead
} from './useQueries';
import api from '../lib/api';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  isAxiosError: vi.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useQueries hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useProfile fetches profile data', async () => {
    const mockData = { id: 1, name: 'John Doe' };
    (api.get as any).mockResolvedValue({ data: { data: mockData } });

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/profile/me');
  });

  it('useUploadPhoto uploads photo', async () => {
    const mockResponse = { url: 'new_photo.jpg' };
    (api.post as any).mockResolvedValue({ data: { data: mockResponse } });

    const { result } = renderHook(() => useUploadPhoto(), { wrapper });

    const blob = new Blob(['test'], { type: 'image/jpeg' });
    await result.current.mutateAsync(blob);

    expect(api.post).toHaveBeenCalledWith('/profile/photos', expect.any(FormData), expect.any(Object));
  });

  it('useDeletePhoto deletes photo', async () => {
    (api.delete as any).mockResolvedValue({ data: { data: {} } });

    const { result } = renderHook(() => useDeletePhoto(), { wrapper });

    await result.current.mutateAsync('photo_id');

    expect(api.delete).toHaveBeenCalledWith('/profile/photos', { data: { public_id: 'photo_id' } });
  });

  it('useDiscoveryUsers fetches discovery users', async () => {
    const mockUsers = [{ id: 1, name: 'Jane' }];
    (api.get as any).mockResolvedValue({ data: { data: mockUsers } });

    const { result } = renderHook(() => useDiscoveryUsers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUsers);
    expect(api.get).toHaveBeenCalledWith('/discovery/users');
  });

  it('useLike handles like action', async () => {
    const mockResponse = { match: true };
    (api.post as any).mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useLike(), { wrapper });

    await result.current.mutateAsync({ toUserId: 2 });

    expect(api.post).toHaveBeenCalledWith('/discovery/like', { toUserId: 2, type: 'standard' });
  });

  it('useMatches fetches matches', async () => {
    const mockMatches = [{ id: 1, user: { name: 'Match' } }];
    (api.get as any).mockResolvedValue({ data: { data: mockMatches } });

    const { result } = renderHook(() => useMatches(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMatches);
    expect(api.get).toHaveBeenCalledWith('/matches');
  });

  it('useNotifications fetches notifications', async () => {
    const mockNotifications = [{ id: 1, message: 'Hi' }];
    (api.get as any).mockResolvedValue({ data: { data: mockNotifications } });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockNotifications);
    expect(api.get).toHaveBeenCalledWith('/notifications');
  });

  it('useStats fetches user stats', async () => {
    const mockStats = { likes: 5, matches: 2 };
    (api.get as any).mockResolvedValue({ data: { data: mockStats } });
    const { result } = renderHook(() => useStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockStats);
  });

  it('useReceivedLikes fetches received likes', async () => {
    const mockLikes = [{ id: 1 }];
    (api.get as any).mockResolvedValue({ data: { data: mockLikes } });
    const { result } = renderHook(() => useReceivedLikes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockLikes);
  });

  it('useSubscription fetches subscription status', async () => {
    const mockSub = { status: 'active' };
    (api.get as any).mockResolvedValue({ data: { data: mockSub } });
    const { result } = renderHook(() => useSubscription(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSub);
  });

  it('useReferralStats fetches referral stats', async () => {
    const mockReferrals = { totalReferrals: 10 };
    (api.get as any).mockResolvedValue({ data: { data: mockReferrals } });
    const { result } = renderHook(() => useReferralStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockReferrals);
  });

  it('useReferralActivity fetches activity', async () => {
    const mockActivity = [{ type: 'SIGNUP' }];
    (api.get as any).mockResolvedValue({ data: { data: mockActivity } });
    const { result } = renderHook(() => useReferralActivity(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockActivity);
  });

  it('useReferralEarnings fetches earnings', async () => {
    const mockEarnings = { available: 500 };
    (api.get as any).mockResolvedValue({ data: { data: mockEarnings } });
    const { result } = renderHook(() => useReferralEarnings(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEarnings);
  });

  it('useWithdraw requests withdrawal', async () => {
    (api.post as any).mockResolvedValue({ data: { data: {} } });
    const { result } = renderHook(() => useWithdraw(), { wrapper });
    await result.current.mutateAsync();
    expect(api.post).toHaveBeenCalledWith('/referrals/withdraw');
  });

  it('useAdminStats fetches admin stats', async () => {
    const mockAdminStats = { totalUsers: 100 };
    (api.get as any).mockResolvedValue({ data: { data: mockAdminStats } });
    const { result } = renderHook(() => useAdminStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockAdminStats);
  });

  it('useAdminUsers fetches user list', async () => {
    const mockUsers = [{ id: 1 }];
    (api.get as any).mockResolvedValue({ data: { data: mockUsers } });
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUsers);
  });

  it('useAdminWithdrawals fetches withdrawals', async () => {
    const mockWithdrawals = [{ id: 1 }];
    (api.get as any).mockResolvedValue({ data: { data: mockWithdrawals } });
    const { result } = renderHook(() => useAdminWithdrawals(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockWithdrawals);
  });

  it('useUpdateWithdrawal updates status', async () => {
    (api.put as any).mockResolvedValue({ data: { data: {} } });
    const { result } = renderHook(() => useUpdateWithdrawal(), { wrapper });
    await result.current.mutateAsync({ id: 1, status: 'completed' });
    expect(api.put).toHaveBeenCalledWith('/referrals/admin/withdrawals/1', { status: 'completed', reference: undefined });
  });

  it('useRecommendations fetches recommendations', async () => {
    const mockRecs = [{ id: 1 }];
    (api.get as any).mockResolvedValue({ data: { data: mockRecs } });
    const { result } = renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRecs);
  });

  it('usePublicProfile fetches user by id', async () => {
    const mockUser = { id: 'user1' };
    (api.get as any).mockResolvedValue({ data: { data: mockUser } });
    const { result } = renderHook(() => usePublicProfile('user1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
    expect(api.get).toHaveBeenCalledWith('/users/user1');
  });

  it('useUpdateProfile updates profile', async () => {
    (api.put as any).mockResolvedValue({ data: { data: {} } });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    await result.current.mutateAsync({ name: 'New Name' });
    expect(api.put).toHaveBeenCalledWith('/profile', { name: 'New Name' });
  });

  it('useMarkAllNotificationsRead marks all as read', async () => {
    (api.put as any).mockResolvedValue({ data: { data: {} } });
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper });
    await result.current.mutateAsync();
    expect(api.put).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('useMarkNotificationRead marks one as read', async () => {
    (api.put as any).mockResolvedValue({ data: { data: {} } });
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });
    await result.current.mutateAsync(1);
    expect(api.put).toHaveBeenCalledWith('/notifications/1/read');
  });
});
