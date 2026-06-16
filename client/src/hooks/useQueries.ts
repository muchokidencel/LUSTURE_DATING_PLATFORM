import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile/me');
      return data.data;
    },
  });
};

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats');
      return data.data;
    },
  });
};

export const useReceivedLikes = () => {
  return useQuery({
    queryKey: ['likes', 'received'],
    queryFn: async () => {
      const { data } = await api.get('/likes/received');
      return data.data;
    },
  });
};

export const useSubscription = () => {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get('/stats/subscription');
      return data.data;
    },
  });
};

export const useMatches = () => {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data } = await api.get('/matches');
      return data.data;
    },
  });
};

export const useReferralStats = () => {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data } = await api.get('/referrals/stats');
      return data.data;
    },
  });
};

export const useReferralActivity = () => {
  return useQuery({
    queryKey: ['referralActivity'],
    queryFn: async () => {
      const { data } = await api.get('/referrals/activity');
      return data.data;
    },
  });
};

export const useReferralEarnings = () => {
  return useQuery({
    queryKey: ['referralEarnings'],
    queryFn: async () => {
      const { data } = await api.get('/referrals/earnings');
      return data.data;
    },
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/referrals/withdraw');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['referralEarnings'] });
      queryClient.invalidateQueries({ queryKey: ['referralActivity'] });
    },
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data.data;
    },
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data.data;
    },
  });
};

export const useAdminWithdrawals = () => {
  return useQuery({
    queryKey: ['adminWithdrawals'],
    queryFn: async () => {
      const { data } = await api.get('/referrals/admin/withdrawals');
      return data.data;
    },
  });
};

export const useUpdateWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reference }: { id: number, status: 'completed' | 'rejected', reference?: string }) => {
      const { data } = await api.put(`/referrals/admin/withdrawals/${id}`, { status, reference });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

export const useRecommendations = () => {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const { data } = await api.get('/matching/recommendations');
      return data.data;
    },
  });
};

export const useDiscoveryUsers = () => {
  return useQuery({
    queryKey: ['discovery'],
    queryFn: async () => {
      const { data } = await api.get('/discovery/users');
      return data.data;
    },
  });
};

export const usePublicProfile = (id: string | undefined) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/users/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ toUserId, type = 'standard' }: { toUserId: number, type?: string }) => {
      const { data } = await api.post('/discovery/like', { toUserId, type });
      return data;
    },
    onSuccess: (data) => {
      if (data.match) {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      }
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put('/profile', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: Blob) => {
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await api.post('/profile/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (public_id: string) => {
      const { data } = await api.delete('/profile/photos', { data: { public_id } });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useNotifications = (enabled = true) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data.data;
    },
    refetchInterval: 15000, // Poll every 15s to simulate real-time notification badge updates
    enabled,
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/notifications/read-all');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.put(`/notifications/${id}/read`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};


