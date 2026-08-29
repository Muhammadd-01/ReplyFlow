import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler, AppError, NotFoundError } from '../middleware/error-handler.js';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import CampaignContact from '../models/CampaignContact.js';
import WhatsAppSession from '../models/WhatsAppSession.js';
import { createCampaignSchema, campaignQuerySchema } from '../validators/campaign.validator.js';
import { campaignService } from '../services/campaign.service.js';

export const getCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = campaignQuerySchema.parse(req.query);
  const userId = req.user!.id;

  const page = parseInt(query.page);
  const limit = parseInt(query.limit);
  const skip = (page - 1) * limit;

  const filter: any = { userId };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('whatsappSessionId', 'sessionName status'),
    Campaign.countDocuments(filter),
  ]);

  res.json({
    status: 'success',
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getCampaignById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const campaign = await Campaign.findOne({ _id: id, userId }).populate('whatsappSessionId');
  if (!campaign) throw new NotFoundError('Campaign not found');

  const campaignContacts = await CampaignContact.find({ campaignId: id }).populate('contactId').limit(50);

  res.json({ status: 'success', data: { ...campaign.toObject(), campaignContacts } });
});

export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createCampaignSchema.parse(req.body);
  const userId = req.user!.id;

  const contacts = await Contact.find({ userId, isOptedOut: false }).select('_id');
  if (contacts.length === 0) {
    throw new AppError(400, 'No active contacts available for campaign');
  }

  const campaign = await Campaign.create({
    userId,
    name: data.name,
    messageTemplate: data.messageTemplate,
    whatsappSessionId: data.whatsappSessionId,
    delayMin: data.delayMin,
    delayMax: data.delayMax,
    totalContacts: contacts.length,
    pendingCount: contacts.length,
  });

  const campaignContactsData = contacts.map((c: any) => ({
    campaignId: campaign._id,
    contactId: c._id,
    status: 'PENDING'
  }));

  await CampaignContact.insertMany(campaignContactsData);

  res.status(201).json({ status: 'success', data: campaign });
});

export const updateCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { name, messageTemplate, delayMin, delayMax, whatsappSessionId } = req.body;

  const campaign = await Campaign.findOne({ _id: id, userId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (campaign.status === 'RUNNING') throw new AppError(400, 'Cannot edit a running campaign');

  if (name) campaign.name = name;
  if (messageTemplate) campaign.messageTemplate = messageTemplate;
  if (delayMin !== undefined) campaign.delayMin = delayMin;
  if (delayMax !== undefined) campaign.delayMax = delayMax;
  if (whatsappSessionId) campaign.whatsappSessionId = whatsappSessionId;

  await campaign.save();

  res.json({ status: 'success', data: campaign });
});

export const startCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const campaign = await Campaign.findOne({ _id: id, userId }).populate('whatsappSessionId');
  if (!campaign) throw new NotFoundError('Campaign not found');
  
  let session: any = campaign.whatsappSessionId;
  if (!session || session.status !== 'CONNECTED') {
    const activeSession = await WhatsAppSession.findOne({ userId, status: 'CONNECTED' });
    if (activeSession) {
      campaign.whatsappSessionId = activeSession._id as any;
      await campaign.save();
      session = activeSession;
    } else {
      throw new AppError(400, 'No connected WhatsApp device found. Please connect your WhatsApp device first.');
    }
  }

  // If campaign has 0 contacts or is being restarted
  const existingContactsCount = await CampaignContact.countDocuments({ campaignId: id });
  if (existingContactsCount === 0 || campaign.status === 'COMPLETED' || campaign.status === 'STOPPED') {
    const contacts = await Contact.find({ userId, isOptedOut: false }).select('_id');
    if (contacts.length === 0) {
      throw new AppError(400, 'No active contacts found. Please import or sync contacts first.');
    }
    
    await CampaignContact.deleteMany({ campaignId: id });
    const campaignContactsData = contacts.map((c: any) => ({
      campaignId: campaign._id,
      contactId: c._id,
      status: 'PENDING'
    }));
    await CampaignContact.insertMany(campaignContactsData);

    campaign.totalContacts = contacts.length;
    campaign.pendingCount = contacts.length;
    campaign.sentCount = 0;
    campaign.failedCount = 0;
    campaign.repliedCount = 0;
    await campaign.save();
  }

  campaignService.startCampaign(id);
  
  res.json({ status: 'success', message: 'Campaign started' });
});

export const pauseCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const campaign = await Campaign.findOne({ _id: id, userId });
  if (!campaign) throw new NotFoundError('Campaign not found');

  await campaignService.pauseCampaign(id);
  
  res.json({ status: 'success', message: 'Campaign paused' });
});

export const stopCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const campaign = await Campaign.findOne({ _id: id, userId });
  if (!campaign) throw new NotFoundError('Campaign not found');

  await campaignService.stopCampaign(id);
  
  res.json({ status: 'success', message: 'Campaign stopped' });
});

export const deleteCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const campaign = await Campaign.findOne({ _id: id, userId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (campaign.status === 'RUNNING') throw new AppError(400, 'Cannot delete a running campaign');

  await Campaign.findByIdAndDelete(id);
  await CampaignContact.deleteMany({ campaignId: id });
  
  res.json({ status: 'success', message: 'Campaign deleted' });
});
