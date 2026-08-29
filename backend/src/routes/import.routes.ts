import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadExcelMiddleware } from '../middleware/upload.js';
import { uploadExcel, confirmImport } from '../controllers/import.controller.js';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadExcelMiddleware, uploadExcel);
router.post('/confirm', confirmImport);

export default router;
