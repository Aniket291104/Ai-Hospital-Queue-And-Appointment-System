import express from 'express';
import {
  bookAppointment,
  getAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from '../controllers/appointmentController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';
import { validateRequest } from '../middlewares/validationMiddleware';
import {
  bookAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validations/appointment.validation';

const router = express.Router();

router
  .route('/')
  .post(protect, authorize(UserRole.PATIENT), validateRequest(bookAppointmentSchema), bookAppointment)
  .get(protect, getAppointments);

router
  .route('/:id')
  .put(protect, validateRequest(updateAppointmentSchema), updateAppointment);

router
  .route('/:id/status')
  .put(
    protect,
    authorize(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(updateAppointmentStatusSchema),
    updateAppointmentStatus
  );

export default router;
