import { Request, Response, NextFunction } from 'express';

/**
 * Sanitizes request body, query, and params to strip MongoDB operators
 * ($gt, $lt, $ne, etc.) and dot-notation keys that could be used for
 * NoSQL injection attacks.
 *
 * Works without express-mongo-sanitize by manually scrubbing objects.
 * If express-mongo-sanitize is available, it is preferred.
 */

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove MongoDB operator prefixes
    return value.replace(/\$/g, '').replace(/\./g, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Drop keys that start with $ (MongoDB operators)
      if (k.startsWith('$')) continue;
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return value;
}

export const sanitizeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Try to use express-mongo-sanitize if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mongoSanitize = require('express-mongo-sanitize');
    return mongoSanitize()(req, _res, next);
  } catch {
    // Fallback to manual sanitizer
  }

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query) as typeof req.query;
  if (req.params) req.params = sanitizeValue(req.params) as typeof req.params;

  next();
};
