import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from './authMiddleware';

/**
 * Audit middleware — logs every mutating API call (POST / PUT / PATCH / DELETE)
 * after the response finishes. Non-blocking: fires asynchronously.
 */
export const auditMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Only audit mutating methods
  const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!AUDITED_METHODS.includes(req.method)) return next();

  // Capture the original end to hook into response finish
  res.on('finish', () => {
    try {
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        'unknown';

      // Strip sensitive fields from body before logging
      const safeBody = req.body ? { ...req.body } : undefined;
      if (safeBody) {
        delete safeBody.password;
        delete safeBody.newPassword;
        delete safeBody.otp;
        delete safeBody.staffAccessKey;
        delete safeBody.refreshToken;
      }

      // Derive a human-readable action label
      const action = deriveAction(req.method, req.path);

      // Fire-and-forget — don't await so we never block the response
      AuditLog.create({
        userId: req.user?._id,
        userEmail: req.user?.email,
        action,
        resource: req.originalUrl,
        method: req.method,
        ip,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
        body: safeBody,
      }).catch(() => {
        // Swallow errors — audit failure must never break the app
      });
    } catch {
      // Swallow any sync errors
    }
  });

  next();
};

/** Map method+path to a readable action label */
function deriveAction(method: string, path: string): string {
  const segment = path.split('/').filter(Boolean).slice(1).join('/');

  const map: Record<string, Record<string, string>> = {
    POST: {
      'auth/register': 'REGISTER',
      'auth/login': 'LOGIN',
      'auth/logout': 'LOGOUT',
      'auth/forgot-password': 'FORGOT_PASSWORD',
      'auth/reset-password': 'RESET_PASSWORD',
      'auth/verify-otp': 'VERIFY_OTP',
      appointments: 'BOOK_APPOINTMENT',
      queues: 'JOIN_QUEUE',
      payments: 'INITIATE_PAYMENT',
      prescriptions: 'CREATE_PRESCRIPTION',
      'ai/triage': 'AI_TRIAGE',
    },
    PUT: {
      appointments: 'UPDATE_APPOINTMENT',
      patients: 'UPDATE_PATIENT',
      doctors: 'UPDATE_DOCTOR',
      prescriptions: 'UPDATE_PRESCRIPTION',
    },
    PATCH: {
      queues: 'UPDATE_QUEUE',
      appointments: 'PATCH_APPOINTMENT',
    },
    DELETE: {
      appointments: 'CANCEL_APPOINTMENT',
      queues: 'LEAVE_QUEUE',
      'auth/sessions': 'REVOKE_SESSION',
    },
  };

  const methodMap = map[method] || {};
  for (const [key, label] of Object.entries(methodMap)) {
    if (segment.startsWith(key)) return label;
  }

  return `${method}_${segment.replace(/\//g, '_').toUpperCase()}`;
}
