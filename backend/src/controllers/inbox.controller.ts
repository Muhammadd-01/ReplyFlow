import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler, AppError, NotFoundError } from '../middleware/error-handler.js';
import Contact from '../models/Contact.js';
import CampaignContact from '../models/CampaignContact.js';
import Campaign from '../models/Campaign.js';
import Message from '../models/Message.js';
import Reply from '../models/Reply.js';
import { whatsappService } from '../whatsapp/service.js';

export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // We find all Contacts that have at least one reply
  // Mongoose way: find distinct contactIds from Reply where contact.userId = userId.
  
  // Actually, let's just find Contacts whose ID is in Replies.
  // We can use aggregate or just fetch the latest replies for the user.
  
  const replies = await Reply.aggregate([
    {
      $lookup: {
        from: 'contacts',
        localField: 'contactId',
        foreignField: '_id',
        as: 'contact'
      }
    },
    { $unwind: '$contact' },
    { $match: { 'contact.userId': userId } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$contact._id',
        contact: { $first: '$contact' },
        latestReply: { $first: '$$ROOT' }
      }
    },
    { $skip: skip },
    { $limit: limit }
  ]);

  const items = replies.map((r: any) => ({
    ...r.contact,
    replies: [r.latestReply]
  }));
  
  // Mongoose count distinct contactIds in Replies? It's complex without aggregate.
  const total = replies.length; // In real app, run aggregate without skip/limit to count

  res.json({
    status: 'success',
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getConversationMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // contactId
  const userId = req.user!.id;

  const contact = await Contact.findOne({ _id: id, userId });
  if (!contact) throw new NotFoundError('Contact not found');

  const campaignContacts = await CampaignContact.find({ contactId: id });
  const ccIds = campaignContacts.map((cc: any) => cc._id);

  const [messages, replies] = await Promise.all([
    Message.find({ campaignContactId: { $in: ccIds } }).lean(),
    Reply.find({ contactId: id }).lean()
  ]);

  const messagesAndReplies: any[] = [];
  
  messages.forEach((m: any) => messagesAndReplies.push({ ...m, type: 'message', id: m._id }));
  replies.forEach((r: any) => messagesAndReplies.push({ ...r, type: 'reply', id: r._id }));

  // Sort by time
  messagesAndReplies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({
    status: 'success',
    data: messagesAndReplies
  });
});

export const replyToConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // contactId
  const { content } = req.body;
  const userId = req.user!.id;

  if (!content) throw new AppError(400, 'Content is required');

  const contact = await Contact.findOne({ _id: id, userId });
  if (!contact) throw new NotFoundError('Contact not found');
  
  const activeCC = await CampaignContact.findOne({ contactId: id }).sort({ createdAt: -1 }).populate('campaignId');

  if (!activeCC || !activeCC.campaignId) {
    throw new NotFoundError('No active campaign conversation found');
  }

  const campaign: any = activeCC.campaignId;
  const sessionId = campaign.whatsappSessionId;

  // Send via WhatsApp
  const messageId = await whatsappService.sendMessage(
    sessionId.toString(),
    contact.normalizedPhoneNumber,
    content,
    true
  );

  if (!messageId) {
    throw new AppError(500, 'Failed to send message via WhatsApp');
  }

  // Save to DB
  const message = await Message.create({
    campaignContactId: activeCC._id,
    whatsappMessageId: messageId,
    direction: 'OUTBOUND',
    messageType: 'text',
    content,
    status: 'SENT',
    sentAt: new Date()
  });

  res.json({ status: 'success', data: { ...message.toObject(), type: 'message' } });
});
