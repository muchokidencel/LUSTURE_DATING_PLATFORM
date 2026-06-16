import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import axios from 'axios';

vi.mock('axios', async () => {
  const actual = await vi.importActual('axios') as any;
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn((config) => {
        const instance = actual.default.create(config);
        // Return a proxy to redirect direct function calls instance(config) to instance.request(config)
        // so that we can spy/mock instance.request in tests.
        return new Proxy(instance, {
          apply(target, thisArg, argArray) {
            return target.request(...argArray);
          }
        });
      }),
      post: vi.fn(),
    },
  };
});

describe('API Interceptors', () => {
  // @ts-ignore
  const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;
  // @ts-ignore
  const responseInterceptorFulfilled = api.interceptors.response.handlers[0].fulfilled;
  // @ts-ignore
  const responseInterceptorRejected = api.interceptors.response.handlers[0].rejected;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.stubGlobal('location', { href: '' });
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header if accessToken exists in localStorage', () => {
      localStorage.setItem('accessToken', 'test-access-token');
      const config = { headers: {} } as any;
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBe('Bearer test-access-token');
    });

    it('should not add Authorization header if accessToken does not exist', () => {
      const config = { headers: {} } as any;
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should return response directly on success', () => {
      const response = { data: 'ok' } as any;
      const result = responseInterceptorFulfilled(response);
      expect(result).toBe(response);
    });

    it('should reject error directly if status is not 401', async () => {
      const error = new Error('Bad request') as any;
      error.response = { status: 400 };
      await expect(responseInterceptorRejected(error)).rejects.toThrow('Bad request');
    });

    it('should reject error directly if originalRequest._retry is already true', async () => {
      const error = new Error('Unauthorized') as any;
      error.response = { status: 401 };
      error.config = { _retry: true, headers: {} };
      await expect(responseInterceptorRejected(error)).rejects.toThrow('Unauthorized');
    });

    it('should attempt token rotation on 401 and retry request', async () => {
      localStorage.setItem('refreshToken', 'old-refresh');
      const error = new Error('Unauthorized') as any;
      error.response = { status: 401 };
      error.config = { _retry: false, headers: {} };

      // Mock refresh success
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          data: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
          },
        },
      });

      // Mock retried api call using Axios request spy
      const apiSpy = vi.spyOn(api, 'request').mockResolvedValue('retry-result' as any);

      const result = await responseInterceptorRejected(error);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        { refreshToken: 'old-refresh' }
      );
      expect(localStorage.getItem('accessToken')).toBe('new-access');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
      expect(error.config.headers.Authorization).toBe('Bearer new-access');
      expect(apiSpy).toHaveBeenCalledWith(error.config);
      expect(result).toBe('retry-result');
    });

    it('should clear localStorage, redirect to login, and reject if token refresh fails', async () => {
      localStorage.setItem('accessToken', 'expired-access');
      localStorage.setItem('refreshToken', 'old-refresh');
      const error = new Error('Unauthorized') as any;
      error.response = { status: 401 };
      error.config = { _retry: false, headers: {} };

      // Mock refresh failure
      const refreshError = new Error('Refresh expired');
      vi.mocked(axios.post).mockRejectedValue(refreshError);

      const mockLocation = { href: '' };
      vi.stubGlobal('location', mockLocation);

      await expect(responseInterceptorRejected(error)).rejects.toThrow('Refresh expired');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(mockLocation.href).toBe('/login');
    });
  });
});
