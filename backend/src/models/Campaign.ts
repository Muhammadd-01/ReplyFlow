import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  whatsappSessionId: mongoose.Types.ObjectId;
  name: string;
  messageTemplate: string;
  status: string;
  delayMin: number;
  delayMax: number;
  totalContacts: number;
  pendingCount: number;
  sentCount: number;
  deliveredCount: number;
  repliedCount: number;
  failedCount: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  whatsappSessionId: { type: Schema.Types.ObjectId, ref: 'WhatsAppSession', required: true },
  parentCampaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  name: { type: String, required: true },
  messageTemplate: { type: String, required: true },
  status: { type: String, default: 'DRAFT' },
  delayMin: { type: Number, default: 3 },
  delayMax: { type: Number, default: 8 },
  totalContacts: { type: Number, default: 0 },
  pendingCount: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  repliedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
