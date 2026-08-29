import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  name?: string;
  email?: string;
  attributes?: any;
  source: string;
  isOptedOut: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  phoneNumber: { type: String, required: true },
  normalizedPhoneNumber: { type: String, required: true },
  name: { type: String },
  email: { type: String },
  attributes: { type: Schema.Types.Mixed },
  source: { type: String, default: 'MANUAL' },
  isOptedOut: { type: Boolean, default: false },
}, { timestamps: true });

ContactSchema.index({ userId: 1, normalizedPhoneNumber: 1 }, { unique: true });

export default mongoose.model<IContact>('Contact', ContactSchema);
