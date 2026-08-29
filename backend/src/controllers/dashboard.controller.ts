import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler } from '../middleware/error-handler.js';
import Contact from '../models/Contact.js';
import Campaign from '../models/Campaign.js';
import Message from '../models/Message.js';
import Reply from '../models/Reply.js';

export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [
    totalContacts,
    activeCampaigns,
    recentCampaigns
  ] = await Promise.all([
    Contact.countDocuments({ userId }),
    Campaign.countDocuments({ userId, status: 'RUNNING' }),
    Campaign.find({ userId }).sort({ createdAt: -1 }).limit(5)
  ]);
  
  // Aggregate to get messages/replies counts efficiently, or just sum from campaigns
  const campaigns = await Campaign.find({ userId });
  let totalMessagesSent = 0;
  let totalReplies = 0;
  
  campaigns.forEach((c: any) => {
    totalMessagesSent += c.sentCount;
    totalReplies += c.repliedCount;
  });

  res.json({
    status: 'success',
    data: {
      stats: {
        totalContacts,
        activeCampaigns,
        totalMessagesSent,
        totalReplies,
      },
      recentCampaigns
    }
  });
});
