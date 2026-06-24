import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

// Mock useAuth context hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock API client
vi.mock('../lib/api', () => ({
  default: {
    patch: vi.fn(),
  },
}));

describe('useLocation Hook', () => {
  const mockUpdateUserProfile = vi.fn();
  const mockGetCurrentPosition = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock geolocation getCurrentPosition API
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
      },
    });

    // Mock global fetch for Nominatim
    vi.stubGlobal('fetch', vi.fn());

    // Mock useAuth default behavior
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        referralCode: 'REF123',
        profile: {
          full_name: 'Test User',
          bio: 'Bio',
          age: 25,
          gender: 'male',
          location: null,
          is_verified: false,
          latitude: null,
          longitude: null,
          location_updated_at: null,
        },
      },
      updateUserProfile: mockUpdateUserProfile,
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls navigator.geolocation.getCurrentPosition on mount', async () => {
    renderHook(() => useLocation());

    expect(mockGetCurrentPosition).toHaveBeenCalled();
  });

  it('sends PATCH /api/profile/location on success and updates user context', async () => {
    // Mock geolocation success
    mockGetCurrentPosition.mockImplementationOnce((success) =>
      success({
        coords: {
          latitude: -1.2921,
          longitude: 36.8219,
        },
      })
    );

    // Mock Nominatim success
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        address: {
          city: 'Nairobi',
        },
      }),
    } as any);

    // Mock backend patch success
    vi.mocked(api.patch).mockResolvedValueOnce({
      status: 200,
      data: {
        success: true,
        location: { latitude: -1.2921, longitude: 36.8219, city: 'Nairobi' },
      },
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('lat=-1.2921&lon=36.8219'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'Lusture Dating App (contact@lustre.app)',
          }),
        })
      );
      expect(api.patch).toHaveBeenCalledWith('/profile/location', {
        latitude: -1.2921,
        longitude: 36.8219,
        city: 'Nairobi',
      });
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        latitude: -1.2921,
        longitude: 36.8219,
        location: 'Nairobi',
        location_updated_at: expect.any(String),
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('sets error state to PERMISSION_DENIED on permission rejection', async () => {
    // Mock geolocation permission denied (code 1)
    mockGetCurrentPosition.mockImplementationOnce((_success, error) =>
      error({
        code: 1,
        message: 'User denied Geolocation',
      })
    );

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.error).toBe('PERMISSION_DENIED');
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets error state to TIMEOUT on timeout when IP fallback fails', async () => {
    // Mock geolocation timeout (code 3)
    mockGetCurrentPosition.mockImplementationOnce((_success, error) =>
      error({
        code: 3,
        message: 'Timeout',
      })
    );

    // Mock FreeIPAPI failure
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.error).toBe('TIMEOUT');
      expect(result.current.loading).toBe(false);
    });
  });

  it('falls back to IP-based geolocation when getCurrentPosition times out', async () => {
    // Mock geolocation timeout (code 3)
    mockGetCurrentPosition.mockImplementationOnce((_success, error) =>
      error({
        code: 3,
        message: 'Timeout',
      })
    );

    // Mock FreeIPAPI success
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        latitude: -1.26,
        longitude: 36.8,
        cityName: 'Nairobi',
      }),
    } as any);

    // Mock backend patch success
    vi.mocked(api.patch).mockResolvedValueOnce({
      status: 200,
      data: { success: true },
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('https://api.freeipapi.com/api/json');
      expect(api.patch).toHaveBeenCalledWith('/profile/location', {
        latitude: -1.26,
        longitude: 36.8,
        city: 'Nairobi',
      });
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        latitude: -1.26,
        longitude: 36.8,
        location: 'Nairobi',
        location_updated_at: expect.any(String),
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('respects maximumAge 300000 and skips geolocating if cache is fresh', async () => {
    // Fresh cache (4 mins ago)
    const freshTimestamp = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        email: 'test@example.com',
        referralCode: 'REF123',
        profile: {
          location: 'Nairobi',
          latitude: -1.2921,
          longitude: 36.8219,
          location_updated_at: freshTimestamp,
        },
      },
      updateUserProfile: mockUpdateUserProfile,
    } as any);

    renderHook(() => useLocation());

    expect(mockGetCurrentPosition).not.toHaveBeenCalled();
  });

  it('extracts city correctly from Nominatim reverse geocode response variations', async () => {
    // Mock geoloc
    mockGetCurrentPosition.mockImplementationOnce((success) =>
      success({
        coords: { latitude: -1.2921, longitude: 36.8219 },
      })
    );

    // Mock Nominatim response with town instead of city
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        address: {
          town: 'Westlands',
        },
      }),
    } as any);

    vi.mocked(api.patch).mockResolvedValueOnce({
      status: 200,
      data: { success: true },
    });

    renderHook(() => useLocation());

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/profile/location', {
        latitude: -1.2921,
        longitude: 36.8219,
        city: 'Westlands',
      });
    });
  });

  it('falls back to null city name gracefully when Nominatim reverse geocode fails', async () => {
    // Mock geoloc
    mockGetCurrentPosition.mockImplementationOnce((success) =>
      success({
        coords: { latitude: -1.2921, longitude: 36.8219 },
      })
    );

    // Mock Nominatim network error
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    vi.mocked(api.patch).mockResolvedValueOnce({
      status: 200,
      data: { success: true },
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/profile/location', {
        latitude: -1.2921,
        longitude: 36.8219,
        city: null,
      });
      expect(result.current.error).toBeNull();
    });
  });
});
