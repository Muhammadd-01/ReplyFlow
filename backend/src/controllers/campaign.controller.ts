import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler, AppError, NotFoundError } from '../middleware/error-handler.js';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import CampaignContact from '../models/CampaignContact.js';
import WhatsAppSession from '../models/WhatsAppSession.js';
import { createCampaignSchema, campaignQuerySchema } from '../validators/campaign.validator.js';
import { whatsappService } from '../whatsapp/service.js';
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

import ExcelJS from 'exceljs';
import { normalizePhoneNumber } from '../utils/phone.utils.js';

export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contactIds, ...data } = createCampaignSchema.parse(req.body);
  const userId = req.user!.id;
  
  let targetContactIds: any[] = [];

  if (req.file) {
    const workbook = new ExcelJS.Workbook();
    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      await workbook.csv.readFile(req.file.path);
    } else {
      await workbook.xlsx.readFile(req.file.path);
    }
    
    if (workbook.worksheets.length === 0) {
      throw new AppError(400, 'Uploaded file contains no worksheets');
    }
    
    const sheet = workbook.worksheets[0];
    const firstRow = sheet.getRow(1);
    const rawValues = Array.isArray(firstRow.values) ? firstRow.values : [];
    const headers = rawValues.map(h => (h ? h.toString().trim().toLowerCase() : ''));
    
    let phoneIdx = -1;
    let nameIdx = -1;
    let idIdx = -1;
    let dateIdx = -1;

    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (!h) continue;
      
      if (phoneIdx === -1 && (h.includes('phone') || h.includes('mobile') || h.includes('whatsapp') || h.includes('contact') || h.includes('number'))) {
        phoneIdx = i;
      }
      if (nameIdx === -1 && (h.includes('name') || h.includes('first name') || h.includes('full name'))) {
        nameIdx = i;
      }
      if (idIdx === -1 && (h === 'id' || h.includes('identifier') || h.includes('patient id') || h.includes('student id') || h.includes('roll no'))) {
        idIdx = i;
      }
      if (dateIdx === -1 && (h.includes('date') || h.includes('time') || h.includes('appointment'))) {
        dateIdx = i;
      }
    }
    
    if (phoneIdx === -1) {
      phoneIdx = 1;
    }
    
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const values: any[] = Array.isArray(row.values) ? row.values : [];
      const rawPhone = values[phoneIdx] ? values[phoneIdx].toString() : '';
      const name = nameIdx !== -1 && values[nameIdx] ? values[nameIdx].toString() : undefined;
      const idVal = idIdx !== -1 && values[idIdx] ? values[idIdx].toString() : undefined;
      let dateVal: any = dateIdx !== -1 && values[dateIdx] ? values[dateIdx] : undefined;
      
      if (dateVal instanceof Date) {
        dateVal = dateVal.toLocaleDateString();
      } else if (dateVal) {
        dateVal = dateVal.toString();
      }

      const normalizedPhone = normalizePhoneNumber(rawPhone, 'PK');
      if (!normalizedPhone) continue;
      
      let contact = await Contact.findOne({ userId, normalizedPhoneNumber: normalizedPhone });
      const attributes = { 
        ...(contact?.attributes || {}),
        ...(idVal && { id: idVal }),
        ...(dateVal && { date: dateVal })
      };

      if (!contact) {
        contact = await Contact.create({
          userId,
          phoneNumber: rawPhone,
          normalizedPhoneNumber: normalizedPhone,
          name,
          attributes,
          source: 'EXCEL_IMPORT',
        });
      } else {
        // Update name and attributes if it already exists
        if (name) contact.name = name;
        contact.attributes = attributes;
        await contact.save();
      }
      targetContactIds.push(contact._id);
    }
  } else if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
    const contacts = await Contact.find({ _id: { $in: contactIds }, userId });
    targetContactIds = contacts.map(c => c._id);
  } else {
    const contacts = await Contact.find({ userId, isOptedOut: false });
    targetContactIds = contacts.map(c => c._id);
  }

  const uniqueTargetContactIds = [...new Set(targetContactIds.map(id => id.toString()))];

  if (uniqueTargetContactIds.length === 0) {
    throw new AppError(400, 'No valid contacts found for campaign');
  }

  const campaign = await Campaign.create({
    userId,
    name: data.name,
    messageTemplate: data.messageTemplate,
    whatsappSessionId: data.whatsappSessionId,
    delayMin: data.delayMin,
    delayMax: data.delayMax,
    totalContacts: uniqueTargetContactIds.length,
    pendingCount: uniqueTargetContactIds.length,
  });

  const campaignContactsData = uniqueTargetContactIds.map(contactId => ({
    campaignId: campaign._id,
    contactId,
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
  let activeSessionId = session ? session._id.toString() : null;

  if (activeSessionId) {
    const realStatus = whatsappService.getStatus(activeSessionId);
    if (realStatus !== 'CONNECTED') {
      session.status = 'DISCONNECTED';
      await session.save();
      session = null;
    }
  }

  if (!session || session.status !== 'CONNECTED') {
    const activeSessions = await WhatsAppSession.find({ userId, status: 'CONNECTED' });
    let validSession = null;
    
    for (const s of activeSessions) {
      if (whatsappService.getStatus(s._id.toString()) === 'CONNECTED') {
        validSession = s;
        break;
      } else {
        s.status = 'DISCONNECTED';
        await s.save();
      }
    }

    if (validSession) {
      campaign.whatsappSessionId = validSession._id as any;
      await campaign.save();
      session = validSession;
    } else {
      throw new AppError(400, 'No connected WhatsApp device found in memory. Please go to the WhatsApp Devices tab and click "Connect" to instantly restore your session.');
    }
  }

  // If campaign has 0 contacts or is being restarted
  const existingContactsCount = await CampaignContact.countDocuments({ campaignId: id });
  if (existingContactsCount === 0) {
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
  } else if (campaign.status === 'COMPLETED' || campaign.status === 'STOPPED' || campaign.status === 'FAILED') {
    // Restarting a campaign with existing contacts
    await CampaignContact.updateMany({ campaignId: id }, { status: 'PENDING' });
    
    campaign.pendingCount = campaign.totalContacts;
    campaign.sentCount = 0;
    campaign.failedCount = 0;
    campaign.repliedCount = 0;
  }

  campaign.status = 'RUNNING';
  await campaign.save();

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
