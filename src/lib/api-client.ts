/**
 * API Client
 * 
 * Centralized API client with automatic:
 * - API versioning (/api/v1)
 * - Authentication headers
 * - Idempotency keys for critical operations
 * - Error handling
 * - Request/response logging
 * 
 * Usage:
 * ```typescript
 * import { apiClient } from '@/lib/api-client';
 * 
 * // Simple GET
 * const packages = await apiClient.get('/packages');
 * 
 * // POST with idempotency
 * const booking = await apiClient.post('/bookings', data, { idempotent: true });
 * 
 * // With custom headers
 * const result = await apiClient.post('/trips', data, {
 *   headers: { 'X-Custom': 'value' }
 * });
 * ```
 */

import { generateIdempotencyKey } from './idempotency';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

interface RequestOptions {
  headers?: Record<string, string>;
  idempotent?: boolean;
  signal?: AbortSignal;
}

interface ApiError {
  code: string;
  message: string;
  details?: any;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private baseUrl: string;
  private version: string;

  constructor(baseUrl: string = API_BASE_URL, version: string = API_VERSION) {
    this.baseUrl = baseUrl;
    this.version = version;
  }

  /**
   * Get the full API URL with versioning.
   */
  private getUrl(endpoint: string): string {
    // Remove leading slash if present
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/api/${this.version}/${path}`;
  }

  /**
   * Get authentication token from storage.
   */
  private getAuthToken(): string | null {
    // Try localStorage first (for JWT)
    const token = localStorage.getItem('token');
    if (token) return token;

    // Try sessionStorage
    const sessionToken = sessionStorage.getItem('token');
    if (sessionToken) return sessionToken;

    return null;
  }

  /**
   * Build request headers.
   */
  private buildHeaders(options?: RequestOptions, method?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add authentication
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add idempotency key for state-changing operations
    if (options?.idempotent && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers['Idempotency-Key'] = generateIdempotencyKey();
    }

    return headers;
  }

  /**
   * Handle API response.
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const error: ApiResponse<never> = await response.json();
        throw new ApiClientError(
          error.error?.message || 'Request failed',
          response.status,
          error.error?.code,
          error.error?.details
        );
      } else {
        throw new ApiClientError(
          `Request failed: ${response.statusText}`,
          response.status
        );
      }
    }

    if (isJson) {
      const data: ApiResponse<T> = await response.json();
      if (data.success && data.data !== undefined) {
        return data.data;
      }
      return data as T;
    }

    return response.text() as T;
  }

  /**
   * GET request.
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.getUrl(endpoint);
    const headers = this.buildHeaders(options, 'GET');

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request.
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const url = this.getUrl(endpoint);
    const headers = this.buildHeaders(options, 'POST');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request.
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const url = this.getUrl(endpoint);
    const headers = this.buildHeaders(options, 'PUT');

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request.
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const url = this.getUrl(endpoint);
    const headers = this.buildHeaders(options, 'PATCH');

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request.
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.getUrl(endpoint);
    const headers = this.buildHeaders(options, 'DELETE');

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload file(s).
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const url = this.getUrl(endpoint);
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    const headers: Record<string, string> = {
      ...options?.headers,
    };

    // Add authentication
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Check API health.
   */
  async health(): Promise<any> {
    const url = `${this.baseUrl}/api/health`;
    const response = await fetch(url);
    return response.json();
  }
}

/**
 * Custom error class for API errors.
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }

  /**
   * Check if error is a specific type.
   */
  is(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if error is authentication related.
   */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Check if error is validation related.
   */
  isValidationError(): boolean {
    return this.status === 400 || this.code === 'VALIDATION_ERROR';
  }

  /**
   * Check if error is server related.
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Singleton API client instance.
 */
export const apiClient = new ApiClient();

/**
 * Type-safe API endpoints.
 */
export const api = {
  // Auth
  auth: {
    register: (data: any) => apiClient.post('/auth/register', data),
    login: (data: any) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    refresh: () => apiClient.post('/auth/refresh'),
    me: () => apiClient.get('/auth/me'),
  },

  // Packages
  packages: {
    list: (params?: any) => apiClient.get(`/packages${params ? `?${new URLSearchParams(params)}` : ''}`),
    get: (id: string) => apiClient.get(`/packages/${id}`),
    create: (data: any) => apiClient.post('/packages', data),
    update: (id: string, data: any) => apiClient.patch(`/packages/${id}`, data),
    delete: (id: string) => apiClient.delete(`/packages/${id}`),
  },

  // Trips
  trips: {
    list: () => apiClient.get('/trips'),
    get: (id: string) => apiClient.get(`/trips/${id}`),
    create: (data: any) => apiClient.post('/trips', data),
    update: (id: string, data: any) => apiClient.patch(`/trips/${id}`, data),
    delete: (id: string) => apiClient.delete(`/trips/${id}`),
    share: (id: string) => apiClient.post(`/trips/${id}/share`),
  },

  // Bookings
  bookings: {
    list: () => apiClient.get('/bookings'),
    get: (id: string) => apiClient.get(`/bookings/${id}`),
    create: (data: any) => apiClient.post('/bookings', data, { idempotent: true }),
    cancel: (id: string) => apiClient.post(`/bookings/${id}/cancel`, undefined, { idempotent: true }),
  },

  // Payments
  payments: {
    initiate: (data: any) => apiClient.post('/payments/initiate', data, { idempotent: true }),
    verify: (data: any) => apiClient.post('/payments/verify', data, { idempotent: true }),
  },

  // Uploads
  uploads: {
    image: (formData: FormData) => apiClient.upload('/uploads/image', formData),
  },

  // Admin
  admin: {
    users: {
      list: () => apiClient.get('/admin/users'),
      get: (id: string) => apiClient.get(`/admin/users/${id}`),
      update: (id: string, data: any) => apiClient.patch(`/admin/users/${id}`, data),
      ban: (id: string) => apiClient.post(`/admin/users/${id}/ban`),
      unban: (id: string) => apiClient.post(`/admin/users/${id}/unban`),
    },
    bookings: {
      list: () => apiClient.get('/admin/bookings'),
      get: (id: string) => apiClient.get(`/admin/bookings/${id}`),
      update: (id: string, data: any) => apiClient.patch(`/admin/bookings/${id}`, data),
    },
    stats: () => apiClient.get('/admin/stats'),
  },
};

export default apiClient;
