import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  messageTemplate: z.string().min(1, 'Message template is required'),
  whatsappSessionId: z.string().min(1, 'WhatsApp session is required'),
  delayMin: z.coerce.number().min(0).default(3),
  delayMax: z.coerce.number().min(0).default(8),
  contactIds: z.union([
    z.string().transform(str => {
      try { return JSON.parse(str); } catch { return []; }
    }),
    z.array(z.string())
  ]).optional(),
  parentCampaignId: z.string().optional()
  // For now, assume it will send to all active contacts or from uploaded file
});

export const campaignQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.string().optional(),
});
