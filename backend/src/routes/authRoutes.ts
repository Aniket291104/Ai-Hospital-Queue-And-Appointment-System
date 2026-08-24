import express from 'express';
import {
  registerUser,
  loginUser,
  verifyOtp,
  googleLogin,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import {
  getSessions,
  revokeSession,
  revokeAllSessions,
} from '../controllers/sessionController';
import { protect } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import {
  registerUserSchema,
  loginUserSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validation';

const router = express.Router();

router.post('/register', validateRequest(registerUserSchema), registerUser);
router.post('/login', validateRequest(loginUserSchema), loginUser);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/google', googleLogin);
router.post('/refresh', refreshAccessToken);
router.post('/logout', protect, logoutUser);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

// Session management
router.get('/sessions', protect, getSessions);
router.delete('/sessions', protect, revokeAllSessions);
router.delete('/sessions/:id', protect, revokeSession);

export default router;
