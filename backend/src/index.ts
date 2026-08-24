import { env } from './config/env'; // Load and validate env variables first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import connectDB from './config/db';
import logger from './utils/logger';
import { sanitizeMiddleware } from './middlewares/sanitizeMiddleware';
import { auditMiddleware } from './middlewares/auditMiddleware';

const app = express();
const httpServer = createServer(app);

// Connect to MongoDB
connectDB();

// Setup Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Helmet Security Headers with strict Content Security Policy (CSP) & HSTS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan('dev'));

// Payload Size Limiter (prevention of body-bomb DDoS attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cookieParser());

// NoSQL Query Injection Sanitizer
app.use(sanitizeMiddleware);

// Global Audit logger (mutating requests)
app.use(auditMiddleware);

import { notFound, errorHandler } from './middlewares/errorMiddleware';
import authRoutes from './routes/authRoutes';
import hospitalRoutes from './routes/hospitalRoutes';
import doctorRoutes from './routes/doctorRoutes';
import patientRoutes from './routes/patientRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import queueRoutes from './routes/queueRoutes';
import aiRoutes from './routes/aiRoutes';
import paymentRoutes from './routes/paymentRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
import auditRoutes from './routes/auditRoutes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/audit', auditRoutes);

// Health check endpoint (system status monitoring)
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    dbStatus,
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('HospitalAI API is running...');
});

// Use error handler middlewares
app.use(notFound);
app.use(errorHandler);

// Socket.io events
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = env.PORT;

httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
});
