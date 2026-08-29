import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from './error-handler.js';
import fs from 'fs';
import { env } from '../config/env.js';

// Ensure upload dir exists
const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const uploadExcelMiddleware = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Invalid file type. Only Excel and CSV files are allowed.') as any, false);
    }
  },
}).single('file');
