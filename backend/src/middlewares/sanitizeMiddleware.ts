import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Sanitizes request body, query, and params to strip MongoDB operators
 * ($gt, $lt, $ne, etc.) and dot-notation keys that could be used for
 * NoSQL injection attacks.
 */

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$/g, '').replace(/\./g, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith('$')) continue;
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return value;
}

function cleanInPlace(obj: Record<string, any>): void {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (typeof val === 'string') {
      obj[key] = val.replace(/\$/g, '').replace(/\./g, '');
    } else if (Array.isArray(val)) {
      obj[key] = val.map(sanitizeValue);
    } else if (val !== null && typeof val === 'object') {
      cleanInPlace(val);
    }
  }
}

export const sanitizeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Use express-mongo-sanitize
  try {
    const handler = typeof mongoSanitize === 'function' 
      ? mongoSanitize 
      : (mongoSanitize as any).default;
      
    if (typeof handler === 'function') {
      return handler()(req, _res, next);
    }
  } catch {
    // Fallback to manual clean-in-place
  }

  if (req.body) {
    if (typeof req.body === 'object') {
      cleanInPlace(req.body);
    } else {
      req.body = sanitizeValue(req.body);
    }
  }
  if (req.query) cleanInPlace(req.query);
  if (req.params) cleanInPlace(req.params);

  next();
};
