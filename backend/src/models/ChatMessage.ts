import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  whatsappMessageId: string;
  fromMe: boolean;
  content: string;
  messageType: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  whatsappMessageId: { type: String, required: true },
  fromMe: { type: Boolean, required: true },
  content: { type: String, required: true },
  messageType: { type: String, default: 'text' },
  timestamp: { type: Date, required: true },
}, { timestamps: true });

ChatMessageSchema.index({ chatId: 1, whatsappMessageId: 1 }, { unique: true });
ChatMessageSchema.index({ chatId: 1, timestamp: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
