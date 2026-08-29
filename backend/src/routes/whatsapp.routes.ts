import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getSessions,
  createSession,
  startSession,
  getSessionStatus,
  disconnectSession
} from '../controllers/whatsapp.controller.js';

const router = Router();

router.use(authenticate);

router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.post('/sessions/:id/start', startSession);
router.get('/sessions/:id/status', getSessionStatus);
router.post('/sessions/:id/disconnect', disconnectSession);

export default router;
