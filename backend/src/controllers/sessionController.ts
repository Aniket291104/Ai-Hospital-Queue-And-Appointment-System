import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import Session from '../models/Session';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NotFoundError } from '../utils/errors';

// @desc    List all active sessions for current user
// @route   GET /api/auth/sessions
// @access  Private
export const getSessions = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const sessions = await Session.find({
      userId: req.user!._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select('ip userAgent createdAt expiresAt')
      .sort({ createdAt: -1 });

    // Flag the current session
    const currentRefresh = req.cookies?.refreshToken;
    const currentHash = currentRefresh
      ? crypto.createHash('sha256').update(currentRefresh).digest('hex')
      : null;

    const sessionsWithCurrent = sessions.map((s) => ({
      id: s._id,
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: currentHash
        ? (s as any).refreshToken === currentHash
        : false,
    }));

    res.status(200).json({ success: true, sessions: sessionsWithCurrent });
  }
);

// @desc    Revoke a specific session
// @route   DELETE /api/auth/sessions/:id
// @access  Private
export const revokeSession = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!session) throw new NotFoundError('Session not found');

    session.isRevoked = true;
    await session.save();

    res.status(200).json({ success: true, message: 'Session revoked' });
  }
);

// @desc    Revoke ALL sessions (logout everywhere)
// @route   DELETE /api/auth/sessions
// @access  Private
export const revokeAllSessions = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    await Session.updateMany(
      { userId: req.user!._id, isRevoked: false },
      { isRevoked: true }
    );

    res.clearCookie('jwt');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'All sessions revoked. You have been logged out everywhere.',
    });
  }
);
