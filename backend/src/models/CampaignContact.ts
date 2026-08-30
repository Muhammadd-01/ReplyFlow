import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignContact extends Document {
  campaignId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  status: string;
  personalizedMessage?: string;
  failureReason?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  repliedAt?: Date;
  replyMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignContactSchema: Schema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
  status: { type: String, default: 'PENDING' },
  personalizedMessage: { type: String },
  failureReason: { type: String },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  repliedAt: { type: Date },
  replyMessage: { type: String },
}, { timestamps: true });

CampaignContactSchema.index({ campaignId: 1, contactId: 1 }, { unique: true });

export default mongoose.model<ICampaignContact>('CampaignContact', CampaignContactSchema);
