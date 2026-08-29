import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler } from '../middleware/error-handler.js';
import Chat from '../models/Chat.js';
import ChatMessage from '../models/ChatMessage.js';

export const getChats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const chats = await Chat.find({ userId })
    .populate('sessionId')
    .populate('contactId')
    .sort({ lastMessageAt: -1 });

  res.json(chats);
});

export const getChatMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const messages = await ChatMessage.find({ chatId })
    .sort({ timestamp: 1 });

  // Mark messages as read by resetting unreadCount
  await Chat.findByIdAndUpdate(chatId, { unreadCount: 0 });

  res.json(messages);
});
