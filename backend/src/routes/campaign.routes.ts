import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getCampaigns,
  createCampaign,
  getCampaignById,
  startCampaign,
  pauseCampaign,
  stopCampaign,
  updateCampaign,
  deleteCampaign
} from '../controllers/campaign.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getCampaigns);
import { uploadExcelMiddleware } from '../middleware/upload.js';

router.post('/', uploadExcelMiddleware, createCampaign);
router.get('/:id', getCampaignById);
router.put('/:id', updateCampaign);
router.post('/:id/start', startCampaign);
router.post('/:id/pause', pauseCampaign);
router.post('/:id/stop', stopCampaign);
router.delete('/:id', deleteCampaign);

export default router;
