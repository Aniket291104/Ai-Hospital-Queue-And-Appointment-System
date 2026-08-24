import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import Otp from '../models/Otp';
import Session from '../models/Session';
import generateToken from '../utils/generateToken';
import sendEmail from '../utils/sendEmail';
import Hospital from '../models/Hospital';
import Department from '../models/Department';
import Doctor from '../models/Doctor';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';
import { blacklistToken } from '../middlewares/authMiddleware';
import { AuthRequest } from '../middlewares/authMiddleware';

// Helper to generate a cryptographically secure 6-digit OTP
const generateOTP = (): string => crypto.randomInt(100000, 1000000).toString();

// Helper to ensure a doctor profile exists
const ensureDoctorProfile = async (userId: string) => {
  try {
    const doctorExists = await Doctor.findOne({ user: userId });
    if (!doctorExists) {
      // Find default hospital
      let hospital = await Hospital.findOne();
      if (!hospital) {
        hospital = await Hospital.create({
          name: 'City Central Hospital',
          address: '102 Healthcare Avenue',
          city: 'Delhi',
          phone: '+919999999999',
          email: 'contact@citycentral.com',
        });
      }

      // Find default department
      let department = await Department.findOne({ hospital: hospital._id });
      if (!department) {
        department = await Department.create({
          name: 'General Medicine',
          description: 'Primary healthcare checkups.',
          hospital: hospital._id,
        });

        hospital.departments.push(department._id as any);
        await hospital.save();
      }

      await Doctor.create({
        user: userId,
        hospital: hospital._id,
        department: department._id,
        specialization: 'General Physician',
        experience: 5,
        fees: 500,
        availability: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00', isActive: true },
          { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isActive: true },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isActive: true },
          { day: 'Thursday', startTime: '09:00', endTime: '17:00', isActive: true },
          { day: 'Friday', startTime: '09:00', endTime: '17:00', isActive: true },
        ],
      });
      logger.info(`[Doctor Profile] Created doctor profile for user ID: ${userId}`);
    }
  } catch (err: any) {
    logger.error(`[Doctor Profile Error] Failed to create profile: ${err.message}`, err);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new BadRequestError('User already exists');
  }

  // Role-based security validation
  if (role && role !== UserRole.PATIENT) {
    const { staffAccessKey } = req.body;
    
    let validKey: string;
    if (role === UserRole.DOCTOR) {
      validKey = env.DOCTOR_ACCESS_KEY;
    } else if (role === UserRole.RECEPTIONIST) {
      validKey = env.RECEPTIONIST_ACCESS_KEY;
    } else if (role === UserRole.ADMIN) {
      validKey = env.ADMIN_ACCESS_KEY;
    } else if (role === UserRole.SUPER_ADMIN) {
      validKey = env.SUPER_ADMIN_ACCESS_KEY;
    } else {
      throw new BadRequestError('Invalid registration role specified');
    }

    if (staffAccessKey !== validKey) {
      throw new ForbiddenError(`Unauthorized role registration. Valid Access Key for ${role} is required.`);
    }
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role: role || UserRole.PATIENT,
    isEmailVerified: false,
  });

  // Create custom Doctor Profile record if registering as Doctor
  if (user.role === UserRole.DOCTOR) {
    const { specialization, experience, fees, bio, hospital, department } = req.body;
    
    let doctorHospital = hospital;
    if (!doctorHospital) {
      const existingHosp = await Hospital.findOne();
      if (existingHosp) {
        doctorHospital = existingHosp._id;
      } else {
        const defaultHosp = await Hospital.create({
          name: 'City Central Hospital',
          address: '102 Healthcare Avenue',
          city: 'Delhi',
          phone: '+919999999999',
          email: 'contact@citycentral.com',
        });
        doctorHospital = defaultHosp._id;
      }
    }

    let doctorDept = department;
    if (!doctorDept && doctorHospital) {
      const existingDept = await Department.findOne({ hospital: doctorHospital });
      if (existingDept) {
        doctorDept = existingDept._id;
      } else {
        const defaultDept = await Department.create({
          name: 'General Medicine',
          description: 'Primary healthcare checkups.',
          hospital: doctorHospital,
        });
        doctorDept = defaultDept._id;
      }
    }

    await Doctor.create({
      user: user._id,
      hospital: doctorHospital,
      department: doctorDept,
      specialization: specialization || 'General Physician',
      experience: experience ? Number(experience) : 5,
      fees: fees ? Number(fees) : 500,
      bio: bio || 'General practitioner dedicated to patient health and family care.',
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', isActive: true },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isActive: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isActive: true },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00', isActive: true },
        { day: 'Friday', startTime: '09:00', endTime: '17:00', isActive: true },
      ],
    });
    logger.info(`[Doctor Profile] Created doctor profile for user ID: ${user._id}`);
  }

  // Generate OTP
  const otpCode = generateOTP();
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp: otpCode });

  // Send verification email via SMTP
  try {
    await sendEmail(
      email,
      'HospitalAI Verification Code',
      `Welcome to HospitalAI! Your verification OTP code is: ${otpCode}. Valid for 10 minutes.`
    );
    logger.info(`[OTP] Sent verification OTP code to ${email}`);
  } catch (err: any) {
    logger.error(`[SMTP Error] Failed to send verification email to ${email}`, err);
    // Don't fail the registration request if nodemailer SMTP is unconfigured/offline
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful! An OTP code has been sent to your email. Please verify.',
    email: user.email,
    ...(env.NODE_ENV === 'development' && { otp: otpCode }),
  });
});

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;

  const otpRecord = await Otp.findOne({ email, otp });
  if (!otpRecord) {
    throw new BadRequestError('Invalid OTP or expired');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.isEmailVerified = true;
  await user.save();
  await Otp.deleteMany({ email }); // Clear active OTPs

  if (user.role === UserRole.DOCTOR) {
    await ensureDoctorProfile(user._id.toString());
  }

  const tokens = generateToken(res, user._id.toString());

  res.status(200).json({
    success: true,
    token: tokens.token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  // ── 1. User not found (generic message to avoid user enumeration) ──────
  if (!user || !(await user.comparePassword(password))) {
    if (user) {
      // Track failed attempts for known users only
      await user.incrementLoginAttempts();

      if (user.isLocked()) {
        logger.warn(`[Security] Account locked after max attempts: ${email}`);
        throw new UnauthorizedError(
          'Account locked due to too many failed attempts. Try again in 15 minutes.'
        );
      }
    }
    throw new UnauthorizedError('Invalid email or password');
  }

  // ── 2. Account lockout check ──────────────────────────────────────────
  if (user.isLocked()) {
    const remainingMin = Math.ceil(
      (user.lockUntil!.getTime() - Date.now()) / 60000
    );
    throw new UnauthorizedError(
      `Account temporarily locked. Try again in ${remainingMin} minute(s).`
    );
  }

  // ── 3. Email verification ─────────────────────────────────────────────
  if (!user.isEmailVerified) {
    const otpCode = generateOTP();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: otpCode });
    try {
      await sendEmail(
        email,
        'HospitalAI Verification Code',
        `Your verification OTP code is: ${otpCode}. Valid for 10 minutes.`
      );
      logger.info(`[OTP] Sent verification OTP code: ${otpCode} to ${email}`);
    } catch (err: any) {
      logger.error(`[SMTP Error] Failed to send email to ${email}`, err);
    }
    res.status(403).json({
      success: false,
      message: 'Email not verified. Another OTP code has been sent.',
      email: user.email,
      isEmailVerified: false,
      ...(env.NODE_ENV === 'development' && { otp: otpCode }),
    });
    return;
  }

  // ── 4. Suspicious IP alert ────────────────────────────────────────────
  const currentIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (user.lastLoginIp && user.lastLoginIp !== currentIp) {
    try {
      await sendEmail(
        user.email,
        '⚠️ HospitalAI — New Login Detected',
        `Hi ${user.firstName},\n\nWe detected a login to your HospitalAI account from a new location.\n\n` +
          `IP Address: ${currentIp}\nTime: ${new Date().toUTCString()}\n\n` +
          `If this was you, no action is needed.\n` +
          `If this wasn't you, please reset your password immediately at ${env.CLIENT_URL}/forgot-password.\n\n` +
          `— The HospitalAI Security Team`
      );
      logger.warn(
        `[Security] Suspicious login alert sent to ${email} — new IP: ${currentIp}`
      );
    } catch (err: any) {
      logger.error(`[SMTP] Suspicious login alert failed for ${email}`, err);
    }
  }

  // ── 5. Success — reset attempts ───────────────────────────────────────
  await user.resetLoginAttempts(currentIp);

  if (user.role === UserRole.DOCTOR) {
    await ensureDoctorProfile(user._id.toString());
  }

  const tokens = generateToken(res, user._id.toString());

  // ── 6. Persist session record ─────────────────────────────────────────
  try {
    const hashedRefresh = crypto
      .createHash('sha256')
      .update(tokens.refreshToken || '')
      .digest('hex');

    await Session.create({
      userId: user._id,
      refreshToken: hashedRefresh,
      ip: currentIp,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  } catch (err: any) {
    logger.error('[Session] Failed to create session record', err);
  }

  res.status(200).json({
    success: true,
    token: tokens.token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
});

// @desc    Google OAuth login/register callback handler
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { googleId, email, firstName, lastName, avatar } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      firstName,
      lastName,
      email,
      googleId,
      avatar: avatar || 'default.jpg',
      isEmailVerified: true, // Google accounts are pre-verified
      role: UserRole.PATIENT,
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.isEmailVerified = true;
    await user.save();
  }

  const tokens = generateToken(res, user._id.toString());

  res.status(200).json({
    success: true,
    token: tokens.token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token not provided');
  }

  try {
    const decoded: any = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = generateToken(res, user._id.toString());

    res.status(200).json({
      success: true,
      token: tokens.token,
    });
  } catch (error) {
    throw new UnauthorizedError('Refresh token expired or invalid');
  }
});

// @desc    Logout user & clear cookies
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Blacklist the current JWT so it can't be reused after logout
  const token =
    req.cookies?.jwt ||
    req.headers.authorization?.split(' ')[1];

  if (token) {
    blacklistToken(token);
    logger.info(`[Security] Token blacklisted on logout for user: ${req.user?.email}`);
  }

  // Revoke session record
  if (req.cookies?.refreshToken) {
    const hashedRefresh = require('crypto')
      .createHash('sha256')
      .update(req.cookies.refreshToken)
      .digest('hex');
    await Session.findOneAndUpdate(
      { refreshToken: hashedRefresh },
      { isRevoked: true }
    ).catch(() => {});
  }

  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Request Password Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('User not found with this email');
  }

  // Generate reset OTP
  const resetOtp = generateOTP();
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp: resetOtp });

  try {
    await sendEmail(
      email,
      'HospitalAI Password Reset Code',
      `You requested a password reset. Your OTP verification code is: ${resetOtp}. Valid for 10 minutes.`
    );
    logger.info(`[Forgot Password] Sent OTP reset code to ${email}`);
  } catch (err: any) {
    logger.error(`[SMTP Error] Forgot Password failed for ${email}`, err);
  }

  res.status(200).json({
    success: true,
    message: 'Password reset OTP sent to your email.',
  });
});

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp, newPassword } = req.body;

  const otpRecord = await Otp.findOne({ email, otp });
  if (!otpRecord) {
    throw new BadRequestError('Invalid or expired OTP code');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.password = newPassword;
  await user.save();
  await Otp.deleteMany({ email }); // Delete active OTPs

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.',
  });
});
