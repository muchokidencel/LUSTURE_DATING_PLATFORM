import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

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
        if (geoError.code === 1) {
          setError('PERMISSION_DENIED');
          setLoading(false);
          return;
        }

        // Try IP-based location fallback
        console.log('[useLocation] HTML5 Geolocation failed. Falling back to IP-based detection...');
        try {
          const ipRes = await fetch('https://api.freeipapi.com/api/json');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            const { latitude, longitude, cityName } = ipData;

            if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
              await api.patch('/profile/location', {
                latitude,
                longitude,
                city: cityName || null,
              });

              updateUserProfile({
                latitude,
                longitude,
                location: cityName || null,
                location_updated_at: new Date().toISOString(),
              });
              setError(null);
              setLoading(false);
              return;
            }
          }
        } catch (fallbackErr) {
          console.error('[useLocation] IP geolocation fallback failed:', fallbackErr);
        }

        if (geoError.code === 3) {
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
