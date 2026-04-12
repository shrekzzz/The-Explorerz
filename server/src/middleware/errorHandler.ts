import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
    stack?: string;
  };
}

/**
 * Global error handler — must be registered last.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ err, url: req.originalUrl, method: req.method }, err.message);
  } else {
    logger.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error');
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  let statusCode = 500;

  if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    response.error.code = err.code;
    response.error.message = err.message;
    response.error.errors = err.errors;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error.code = err.code;
    response.error.message = err.message;
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // Malformed JSON body
    statusCode = 400;
    response.error.code = 'INVALID_JSON';
    response.error.message = 'Invalid JSON in request body';
  }

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Handle 404 — not found routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}
