import { Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Get paginated audit logs (Admin only)
// @route   GET /api/audit
// @access  Private/Admin
export const getAuditLogs = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    // Optional filters
    const filter: Record<string, unknown> = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.action) filter.action = new RegExp(req.query.action as string, 'i');
    if (req.query.method) filter.method = (req.query.method as string).toUpperCase();
    if (req.query.statusCode) filter.statusCode = parseInt(req.query.statusCode as string);

    // Date range filter
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from)
        (filter.timestamp as Record<string, unknown>).$gte = new Date(req.query.from as string);
      if (req.query.to)
        (filter.timestamp as Record<string, unknown>).$lte = new Date(req.query.to as string);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email role'),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs,
    });
  }
);
