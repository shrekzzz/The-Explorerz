/**
 * ════════════════════════════════════════════════════════════════════════════
 * INPUT SANITIZATION UTILITIES
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Sanitizes user input to prevent XSS attacks in contexts where React's
 * auto-escaping doesn't apply (emails, PDFs, server-side rendering).
 * 
 * IMPORTANT: React automatically escapes JSX content, so this is primarily
 * needed for:
 * - Email templates
 * - PDF generation
 * - Server-side rendered content
 * - Database storage of user-generated content
 * ════════════════════════════════════════════════════════════════════════════
 */

import xss, { IFilterXSSOptions } from 'xss';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Removes dangerous tags and attributes while preserving safe formatting.
 * 
 * @param input - Raw HTML string
 * @param options - XSS filter options
 * @returns Sanitized HTML string
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script><p>Hello</p>';
 * const safe = sanitizeHtml(userInput);
 * // Result: '<p>Hello</p>'
 * ```
 */
export function sanitizeHtml(input: string, options?: IFilterXSSOptions): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return xss(input, {
    whiteList: {
      // Allow basic formatting tags
      p: [],
      br: [],
      strong: [],
      b: [],
      em: [],
      i: [],
      u: [],
      span: ['style'],
      div: ['style'],
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
      ul: [],
      ol: [],
      li: [],
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    ...options,
  });
}

/**
 * Sanitize plain text by removing all HTML tags.
 * Use this for user names, titles, and other plain text fields.
 * 
 * @param input - Raw text that may contain HTML
 * @returns Plain text with all HTML removed
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>John Doe';
 * const safe = sanitizePlainText(userInput);
 * // Result: 'John Doe'
 * ```
 */
export function sanitizePlainText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return xss(input, {
    whiteList: {}, // No tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
}

/**
 * Sanitize email content.
 * Allows safe HTML formatting for emails while removing dangerous content.
 * 
 * @param input - Raw HTML for email
 * @returns Sanitized HTML safe for email templates
 * 
 * @example
 * ```typescript
 * const emailBody = sanitizeEmail(userGeneratedContent);
 * await sendEmail({ body: emailBody });
 * ```
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return xss(input, {
    whiteList: {
      // Email-safe tags
      p: ['style'],
      br: [],
      strong: [],
      b: [],
      em: [],
      i: [],
      u: [],
      span: ['style'],
      div: ['style'],
      h1: ['style'],
      h2: ['style'],
      h3: ['style'],
      h4: ['style'],
      table: ['style', 'border', 'cellpadding', 'cellspacing'],
      tr: ['style'],
      td: ['style'],
      th: ['style'],
      a: ['href', 'style'],
      img: ['src', 'alt', 'width', 'height', 'style'],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  });
}

/**
 * Sanitize user profile data.
 * Removes HTML from all text fields.
 * 
 * @param data - User profile data
 * @returns Sanitized profile data
 * 
 * @example
 * ```typescript
 * const sanitized = sanitizeUserProfile({
 *   firstName: '<script>alert("xss")</script>John',
 *   lastName: 'Doe',
 *   bio: '<p>Hello</p><script>bad()</script>'
 * });
 * // Result: { firstName: 'John', lastName: 'Doe', bio: '<p>Hello</p>' }
 * ```
 */
export function sanitizeUserProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  [key: string]: any;
}): typeof data {
  return {
    ...data,
    firstName: data.firstName ? sanitizePlainText(data.firstName) : data.firstName,
    lastName: data.lastName ? sanitizePlainText(data.lastName) : data.lastName,
    phone: data.phone ? sanitizePlainText(data.phone) : data.phone,
    bio: data.bio ? sanitizeHtml(data.bio) : data.bio,
  };
}

/**
 * Sanitize trip data.
 * Removes HTML from destination and other text fields.
 * 
 * @param data - Trip data
 * @returns Sanitized trip data
 */
export function sanitizeTripData(data: {
  destination?: string;
  interests?: string[];
  [key: string]: any;
}): typeof data {
  return {
    ...data,
    destination: data.destination ? sanitizePlainText(data.destination) : data.destination,
    interests: data.interests?.map(i => sanitizePlainText(i)) || data.interests,
  };
}

/**
 * Sanitize package data.
 * Removes HTML from title, subtitle, and other text fields.
 * 
 * @param data - Package data
 * @returns Sanitized package data
 */
export function sanitizePackageData(data: {
  title?: string;
  subtitle?: string;
  locations?: string[];
  highlights?: string[];
  included?: string[];
  [key: string]: any;
}): typeof data {
  return {
    ...data,
    title: data.title ? sanitizePlainText(data.title) : data.title,
    subtitle: data.subtitle ? sanitizePlainText(data.subtitle) : data.subtitle,
    locations: data.locations?.map(l => sanitizePlainText(l)) || data.locations,
    highlights: data.highlights?.map(h => sanitizePlainText(h)) || data.highlights,
    included: data.included?.map(i => sanitizePlainText(i)) || data.included,
  };
}

/**
 * Sanitize review data.
 * Allows some HTML in comments but removes dangerous content.
 * 
 * @param data - Review data
 * @returns Sanitized review data
 */
export function sanitizeReviewData(data: {
  comment?: string;
  [key: string]: any;
}): typeof data {
  return {
    ...data,
    comment: data.comment ? sanitizeHtml(data.comment) : data.comment,
  };
}

/**
 * Sanitize booking contact info.
 * Removes HTML from all contact fields.
 * 
 * @param contactInfo - Contact information object
 * @returns Sanitized contact info
 */
export function sanitizeContactInfo(contactInfo: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(contactInfo)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizePlainText(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Middleware to sanitize request body.
 * Apply this to routes that accept user input.
 * 
 * @example
 * ```typescript
 * import { sanitizeBody } from '../utils/sanitize';
 * 
 * router.post('/profile', authenticate, sanitizeBody, updateProfile);
 * ```
 */
export function sanitizeBody(req: any, res: any, next: any): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Recursively sanitize an object's string values.
 * 
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizePlainText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Escape HTML entities for safe display.
 * Use this when you need to display user input as-is but safely.
 * 
 * @param input - Raw text
 * @returns HTML-escaped text
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>';
 * const safe = escapeHtml(userInput);
 * // Result: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize URL.
 * Ensures URL is safe and uses allowed protocols.
 * 
 * @param url - URL to validate
 * @param allowedProtocols - Allowed URL protocols
 * @returns Sanitized URL or empty string if invalid
 * 
 * @example
 * ```typescript
 * const url = sanitizeUrl('javascript:alert("xss")');
 * // Result: '' (blocked)
 * 
 * const url2 = sanitizeUrl('https://example.com');
 * // Result: 'https://example.com' (allowed)
 * ```
 */
export function sanitizeUrl(
  url: string,
  allowedProtocols: string[] = ['http:', 'https:', 'mailto:']
): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url);
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    // Invalid URL
    return '';
  }
}
