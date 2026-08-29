import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  whatsappJid: string;
  name?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'WhatsAppSession', required: true },
  contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
  whatsappJid: { type: String, required: true },
  name: { type: String },
  lastMessage: { type: String },
  lastMessageAt: { type: Date },
  unreadCount: { type: Number, default: 0 },
}, { timestamps: true });

ChatSchema.index({ userId: 1, whatsappJid: 1 }, { unique: true });

export default mongoose.model<IChat>('Chat', ChatSchema);
