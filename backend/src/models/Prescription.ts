import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine {
  name: string;
  dosage: string; // e.g. "500mg" or "1 tablet"
  timing: string; // e.g. "Morning", "Night", "Before Meal", "After Meal"
  duration: string; // e.g. "5 days"
  instructions?: string;
  frequency?: string;
}

export interface IPrescription extends Document {
  appointment?: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor?: mongoose.Types.ObjectId;
  medicines: IMedicine[];
  instructions?: string;
  imageUrl?: string; // If OCR'd from an upload
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  timing: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String },
  frequency: { type: String },
});


const prescriptionSchema = new Schema<IPrescription>(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    medicines: [medicineSchema],
    instructions: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPrescription>('Prescription', prescriptionSchema);
