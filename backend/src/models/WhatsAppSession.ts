import mongoose, { Schema, Document } from 'mongoose';

export interface IWhatsAppSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionName: string;
  status: string;
  phoneNumber?: string;
  connectedAt?: Date;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppSessionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionName: { type: String, required: true },
  status: { type: String, required: true, default: 'DISCONNECTED' },
  phoneNumber: { type: String },
  connectedAt: { type: Date },
  lastSeenAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IWhatsAppSession>('WhatsAppSession', WhatsAppSessionSchema);
