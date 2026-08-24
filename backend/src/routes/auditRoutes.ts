import express from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.get('/', protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), getAuditLogs);

export default router;
