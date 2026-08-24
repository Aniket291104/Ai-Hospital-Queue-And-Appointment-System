import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  action: string;         // e.g. "LOGIN", "BOOK_APPOINTMENT"
  resource: string;       // e.g. "/api/appointments"
  method: string;         // GET, POST, etc.
  ip: string;
  userAgent?: string;
  statusCode: number;
  body?: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    method: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String },
    statusCode: { type: Number, required: true },
    body: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Auto-delete audit logs after 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
// Index for fast admin queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
