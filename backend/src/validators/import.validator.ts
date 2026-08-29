import { z } from 'zod';

export const importConfirmSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  sheetName: z.string().min(1, 'Sheet name is required'),
  phoneColumn: z.string().min(1, 'Phone column is required'),
  nameColumn: z.string().optional(),
  emailColumn: z.string().optional(),
  defaultCountry: z.string().default('PK'),
});
