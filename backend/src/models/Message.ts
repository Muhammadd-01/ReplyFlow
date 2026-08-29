import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  campaignContactId: mongoose.Types.ObjectId;
  whatsappMessageId?: string;
  direction: string;
  messageType: string;
  content: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  campaignContactId: { type: Schema.Types.ObjectId, ref: 'CampaignContact', required: true },
  whatsappMessageId: { type: String },
  direction: { type: String, required: true },
  messageType: { type: String, default: 'text' },
  content: { type: String, required: true },
  status: { type: String, default: 'PENDING' },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
