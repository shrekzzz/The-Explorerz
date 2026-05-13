import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Request logging middleware — logs method, URL, status, response time, user.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Log after response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: (req as any).user?.userId || null,
      userAgent: req.headers['user-agent']?.substring(0, 100),
      contentLength: res.getHeader('content-length'),
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request error');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
}
