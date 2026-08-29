import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler, AppError } from '../middleware/error-handler.js';
import { exportService } from '../services/export.service.js';
import path from 'path';
import { env } from '../config/env.js';
import fs from 'fs';

export const exportCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const filename = await exportService.exportCampaign(id, userId);
  
  res.json({
    status: 'success',
    data: {
      downloadUrl: `/api/export/download/${filename}`
    }
  });
});

export const downloadFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { filename } = req.params;
  
  // Basic path traversal prevention
  if (filename.includes('..') || filename.includes('/')) {
    throw new AppError(400, 'Invalid filename');
  }

  const filepath = path.join(env.EXPORT_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new AppError(404, 'File not found');
  }

  res.download(filepath, filename);
});
