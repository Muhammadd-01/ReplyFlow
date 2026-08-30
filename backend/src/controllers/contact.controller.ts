import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler, AppError, NotFoundError } from '../middleware/error-handler.js';
import Contact from '../models/Contact.js';
import { createContactSchema, updateContactSchema, contactQuerySchema } from '../validators/contact.validator.js';
import { normalizePhoneNumber } from '../utils/phone.utils.js';

export const getContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = contactQuerySchema.parse(req.query);
  const userId = req.user!.id;

  const page = parseInt(query.page);
  const limit = parseInt(query.limit);
  const skip = (page - 1) * limit;

  const filter: any = { userId };
  if (query.source) filter.source = query.source;
  if (query.isOptedOut !== undefined) filter.isOptedOut = query.isOptedOut;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { phoneNumber: { $regex: query.search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Contact.countDocuments(filter),
  ]);

  const { default: CampaignContact } = await import('../models/CampaignContact.js');
  const contactIds = items.map(i => i._id);
  const campaignContacts = await CampaignContact.find({ contactId: { $in: contactIds } }).populate('campaignId', 'name').lean();

  items.forEach((item: any) => {
    item.id = item._id.toString();
    item.campaigns = campaignContacts
      .filter((cc: any) => cc.contactId.toString() === item._id.toString())
      .map((cc: any) => ({ name: cc.campaignId?.name || 'Deleted Campaign', status: cc.status, id: cc.campaignId?._id }));
  });

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

export const getContactById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const contact = await Contact.findOne({ _id: id, userId });
  if (!contact) throw new NotFoundError('Contact not found');

  res.json({ status: 'success', data: contact });
});

export const createContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createContactSchema.parse(req.body);
  const userId = req.user!.id;

  const normalized = normalizePhoneNumber(data.phoneNumber, data.defaultCountry);
  if (!normalized) {
    throw new AppError(400, 'Invalid phone number format');
  }

  const existing = await Contact.findOne({ userId, normalizedPhoneNumber: normalized });
  if (existing) {
    throw new AppError(409, 'Contact with this phone number already exists');
  }

  const contact = await Contact.create({
    userId,
    phoneNumber: data.phoneNumber,
    normalizedPhoneNumber: normalized,
    name: data.name,
    email: data.email,
    source: 'MANUAL',
  });

  res.status(201).json({ status: 'success', data: contact });
});

export const updateContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateContactSchema.parse(req.body);
  const userId = req.user!.id;

  const contact = await Contact.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true }
  );

  if (!contact) throw new NotFoundError('Contact not found');

  res.json({ status: 'success', data: contact });
});

export const deleteContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const contact = await Contact.findOneAndDelete({ _id: id, userId });
  if (!contact) throw new NotFoundError('Contact not found');

  res.json({ status: 'success', message: 'Contact deleted successfully' });
});

export const optOutContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { reason } = req.body;

  const contact = await Contact.findOneAndUpdate(
    { _id: id, userId },
    { $set: { isOptedOut: true } },
    { new: true }
  );

  if (!contact) throw new NotFoundError('Contact not found');

  res.json({ status: 'success', message: 'Contact opted out successfully' });
});
