import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { asyncHandler, AppError, ValidationError } from '../middleware/error-handler.js';
import { analyzeExcelFile, processImport } from '../services/import.service.js';
import { importConfirmSchema } from '../validators/import.validator.js';

export const uploadExcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const result = await analyzeExcelFile(req.file.path);

  res.json({
    status: 'success',
    data: {
      fileId: req.file.filename,
      originalFileName: req.file.originalname,
      ...result,
    },
  });
});

export const confirmImport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = importConfirmSchema.parse(req.body);
  const userId = req.user!.id;
  const filePath = `uploads/${data.fileId}`;
  
  // In a real app we'd pass originalFileName, here we'll just mock it or assume it is stored in DB
  const originalFileName = data.fileId; 

  const result = await processImport(
    userId,
    filePath,
    originalFileName,
    data.sheetName,
    {
      phone: data.phoneColumn,
      name: data.nameColumn,
      email: data.emailColumn,
    },
    data.defaultCountry
  );

  res.json({
    status: 'success',
    data: result,
  });
});
