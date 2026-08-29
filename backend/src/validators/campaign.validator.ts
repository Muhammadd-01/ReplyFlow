import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  messageTemplate: z.string().min(1, 'Message template is required'),
  whatsappSessionId: z.string().min(1, 'WhatsApp session is required'),
  delayMin: z.number().min(0).default(3),
  delayMax: z.number().min(1).default(8),
  // For now, assume it will send to all active contacts
});

export const campaignQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.string().optional(),
});
