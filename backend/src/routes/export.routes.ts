import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  exportCampaign,
  downloadFile
} from '../controllers/export.controller.js';

const router = Router();

router.use(authenticate);

router.get('/campaigns/:id', exportCampaign);
router.get('/download/:filename', downloadFile);

export default router;
