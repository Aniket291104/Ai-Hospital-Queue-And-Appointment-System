import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

// ─── In-memory JWT blacklist ───────────────────────────────────────────────
// Stores invalidated JWTs (by jti or raw token) until they expire naturally.
// In production, replace with Redis SETEX for multi-instance support.
const tokenBlacklist = new Set<string>();

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);

  // Auto-remove after token natural expiry to keep the Set lean
  try {
    const decoded: any = jwt.decode(token);
    if (decoded?.exp) {
      const msUntilExpiry = decoded.exp * 1000 - Date.now();
      if (msUntilExpiry > 0) {
        setTimeout(() => tokenBlacklist.delete(token), msUntilExpiry);
      }
    }
  } catch {
    // ignore decode errors — token will remain in Set until server restarts
  }
};

export const isTokenBlacklisted = (token: string): boolean =>
  tokenBlacklist.has(token);

// ─── Auth middleware ───────────────────────────────────────────────────────
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  // Read JWT from httpOnly cookie or Authorization header
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token'));
  }

  // ── Blacklist check (logged-out tokens) ──────────────────────────────────
  if (isTokenBlacklisted(token)) {
    res.status(401);
    return next(new Error('Token has been invalidated. Please log in again.'));
  }

  try {
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401);
      return next(new Error('Not authorized, user not found'));
    }

    // ── Account lockout check ──────────────────────────────────────────────
    if (user.isLocked()) {
      const remainingMs = (user.lockUntil!.getTime() - Date.now());
      const remainingMin = Math.ceil(remainingMs / 60000);
      res.status(403);
      return next(
        new Error(
          `Account is temporarily locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`
        )
      );
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token failed'));
  }
};

// ─── Role-based authorization ─────────────────────────────────────────────
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(
          `Role (${req.user?.role}) is not authorized to access this resource`
        )
      );
    }
    next();
  };
};
