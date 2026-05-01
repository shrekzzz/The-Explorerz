import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { generateIdempotencyKey } from './idempotency';

// ─── API Client ─────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`, // ✅ Updated to use v1 versioning
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ─── Token Management ───────────────────

let getTokenFunction: (() => Promise<string | null>) | null = null;

export function setGetTokenFunction(fn: () => Promise<string | null>) {
  getTokenFunction = fn;
}

// ─── Request Interceptor ────────────────
// Automatically attach Clerk token to every request
// Add idempotency keys for critical operations

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (config.headers) {
      // Attach auth token
      if (getTokenFunction) {
        try {
          const token = await getTokenFunction();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to get auth token:', error);
        }
      }

      // Add idempotency key for critical operations
      const method = config.method?.toUpperCase();
      const url = config.url || '';
      
      // Critical endpoints that need idempotency
      const criticalEndpoints = [
        '/bookings',
        '/payments/initiate',
        '/payments/verify',
        '/bookings/.*/cancel',
        '/payments/refund',
      ];

      const isCritical = criticalEndpoints.some(endpoint => 
        new RegExp(endpoint).test(url)
      );

      // Add idempotency key for POST/PUT/PATCH/DELETE on critical endpoints
      if (isCritical && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
        // Check if idempotency key already provided
        if (!config.headers['Idempotency-Key']) {
          config.headers['Idempotency-Key'] = generateIdempotencyKey();
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────
// Handle 401 errors

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clerk will handle re-authentication via its UI
      console.warn('Unauthorized request - user may need to sign in again');
    }
    return Promise.reject(error);
  }
);

// ─── API Response Types ────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
}

// ─── Helper to extract error message ────

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.error?.message || error.message || 'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export default api;
