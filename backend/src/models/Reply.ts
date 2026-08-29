import mongoose, { Schema, Document } from 'mongoose';

export interface IReply extends Document {
  campaignContactId?: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema: Schema = new Schema({
  campaignContactId: { type: Schema.Types.ObjectId, ref: 'CampaignContact' },
  contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
  messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IReply>('Reply', ReplySchema);
