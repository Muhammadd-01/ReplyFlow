import { z } from 'zod';

export const createContactSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  defaultCountry: z.string().default('PK'),
});

export const updateContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

export const contactQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  source: z.string().optional(),
  isOptedOut: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'phoneNumber', 'isOptedOut']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
