import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const fetchIpLocation = async (): Promise<{ latitude: number; longitude: number; city: string | null } | null> => {
  // Try FreeIPAPI first
  try {
    const res = await fetch('https://api.freeipapi.com/api/json');
    if (res.ok) {
      const data = await res.json();
      if (data.latitude != null && data.longitude != null) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.cityName || null,
        };
      }
    }
  } catch (err) {
    console.warn('[useLocation] FreeIPAPI failed, trying backup...', err);
  }

  // Try ipapi.co as secondary backup
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.latitude != null && data.longitude != null) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || null,
        };
      }
    }
  } catch (err) {
    console.error('[useLocation] All IP location fallbacks failed:', err);
  }

  return null;
};

export const useLocation = () => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerLocationUpdate = useCallback(async () => {
    if (!user) {
      return;
    }

    // 1. Check location_updated_at from user context — if less than 5 min ago, skip
    const lastUpdated = user?.profile?.location_updated_at;
    if (lastUpdated) {
      const diffMs = Date.now() - new Date(lastUpdated).getTime();
      if (diffMs < 300000) { // 5 minutes = 300000 ms
        console.log('[useLocation] Location update skipped. Last updated less than 5 minutes ago.');
        return;
      }
    }

    if (!navigator.geolocation) {
      setError('UNAVAILABLE');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let city: string | null = null;

        // a. Call Nominatim reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'User-Agent': 'Lusture Dating App (contact@lustre.app)',
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            city = data.address?.city || data.address?.town || data.address?.county || null;
          }
        } catch (err) {
          console.error('[useLocation] Nominatim reverse geocoding failed, falling back to null city:', err);
        }

        // b. Call PATCH /api/profile/location
        try {
          await api.patch('/profile/location', {
            latitude,
            longitude,
            city,
          });

          // c. Update user context with new location data
          updateUserProfile({
            latitude,
            longitude,
            location: city,
            location_updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error('[useLocation] Backend location update failed:', err);
          setError('UNAVAILABLE');
        } finally {
          setLoading(false);
        }
      },
      async (geoError) => {
        console.error('[useLocation] Geolocation error:', geoError);

        // Try IP-based location fallback for all errors, including PERMISSION_DENIED
        console.log('[useLocation] HTML5 Geolocation failed/denied. Falling back to IP-based detection...');
        const ipLoc = await fetchIpLocation();
        if (ipLoc) {
          try {
            await api.patch('/profile/location', {
              latitude: ipLoc.latitude,
              longitude: ipLoc.longitude,
              city: ipLoc.city,
            });

            updateUserProfile({
              latitude: ipLoc.latitude,
              longitude: ipLoc.longitude,
              location: ipLoc.city,
              location_updated_at: new Date().toISOString(),
            });
            setError(null);
            setLoading(false);
            return;
          } catch (err) {
            console.error('[useLocation] Backend location update failed after IP fallback:', err);
          }
        }

        if (geoError.code === 1) {
          setError('PERMISSION_DENIED');
        } else if (geoError.code === 3) {
          setError('TIMEOUT');
        } else {
          setError('UNAVAILABLE');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [user, updateUserProfile]);

  useEffect(() => {
    triggerLocationUpdate();
  }, []); // Only run once on mount

  return { loading, error, triggerLocationUpdate };
};
