/**
 * Idempotency Key Helper
 * 
 * Generates and manages idempotency keys for critical API operations.
 * Prevents duplicate requests (e.g., double-clicking submit button).
 * 
 * Usage:
 * ```typescript
 * import { generateIdempotencyKey, withIdempotency } from '@/lib/idempotency';
 * 
 * // Option 1: Manual
 * const key = generateIdempotencyKey();
 * fetch('/api/v1/bookings', {
 *   headers: { 'Idempotency-Key': key }
 * });
 * 
 * // Option 2: Automatic wrapper
 * const response = await withIdempotency(() =>
 *   fetch('/api/v1/bookings', { method: 'POST', body: ... })
 * );
 * ```
 */

/**
 * Generate a cryptographically secure idempotency key.
 * Uses Web Crypto API for secure random generation.
 */
export function generateIdempotencyKey(): string {
  // Generate 32 random bytes
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Convert to base64url (URL-safe)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Wrap a fetch request with automatic idempotency key injection.
 * Only adds key for POST/PUT/PATCH/DELETE methods.
 */
export async function withIdempotency<T>(
  fetchFn: () => Promise<Response>
): Promise<T> {
  const key = generateIdempotencyKey();
  
  // Intercept fetch to add header
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const method = init?.method?.toUpperCase() || 'GET';
    
    // Only add idempotency key for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      init = init || {};
      init.headers = {
        ...init.headers,
        'Idempotency-Key': key,
      };
    }
    
    return originalFetch(input, init);
  };
  
  try {
    const response = await fetchFn();
    const data = await response.json();
    return data;
  } finally {
    // Restore original fetch
    window.fetch = originalFetch;
  }
}

/**
 * Store idempotency key in session storage to prevent retries.
 * Useful for operations that should only happen once per session.
 */
export class IdempotencyManager {
  private static readonly PREFIX = 'idempotency:';
  
  /**
   * Check if an operation has already been performed.
   */
  static hasPerformed(operationId: string): boolean {
    return sessionStorage.getItem(this.PREFIX + operationId) !== null;
  }
  
  /**
   * Mark an operation as performed.
   */
  static markPerformed(operationId: string, key: string): void {
    sessionStorage.setItem(this.PREFIX + operationId, key);
  }
  
  /**
   * Get the idempotency key for an operation.
   */
  static getKey(operationId: string): string | null {
    return sessionStorage.getItem(this.PREFIX + operationId);
  }
  
  /**
   * Clear an operation (e.g., after successful completion).
   */
  static clear(operationId: string): void {
    sessionStorage.removeItem(this.PREFIX + operationId);
  }
  
  /**
   * Clear all idempotency keys.
   */
  static clearAll(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

/**
 * React hook for idempotency management.
 * 
 * Usage:
 * ```typescript
 * const { execute, isExecuting, hasExecuted } = useIdempotency('create-booking');
 * 
 * const handleSubmit = async () => {
 *   await execute(async (key) => {
 *     return fetch('/api/v1/bookings', {
 *       method: 'POST',
 *       headers: { 'Idempotency-Key': key },
 *       body: JSON.stringify(data),
 *     });
 *   });
 * };
 * ```
 */
export function useIdempotency(operationId: string) {
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [hasExecuted, setHasExecuted] = React.useState(
    IdempotencyManager.hasPerformed(operationId)
  );
  
  const execute = async <T,>(
    fn: (key: string) => Promise<T>
  ): Promise<T | null> => {
    // Check if already executed
    if (hasExecuted) {
      console.warn(`Operation ${operationId} already executed`);
      return null;
    }
    
    // Check if currently executing
    if (isExecuting) {
      console.warn(`Operation ${operationId} already in progress`);
      return null;
    }
    
    setIsExecuting(true);
    
    try {
      // Generate or retrieve idempotency key
      let key = IdempotencyManager.getKey(operationId);
      if (!key) {
        key = generateIdempotencyKey();
        IdempotencyManager.markPerformed(operationId, key);
      }
      
      // Execute operation
      const result = await fn(key);
      
      // Mark as executed
      setHasExecuted(true);
      
      return result;
    } catch (error) {
      // On error, clear the key so user can retry
      IdempotencyManager.clear(operationId);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };
  
  const reset = () => {
    IdempotencyManager.clear(operationId);
    setHasExecuted(false);
  };
  
  return {
    execute,
    isExecuting,
    hasExecuted,
    reset,
  };
}

// React import (will be available in React components)
import React from 'react';
