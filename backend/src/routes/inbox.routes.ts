import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getConversations,
  getConversationMessages,
  replyToConversation
} from '../controllers/inbox.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getConversations);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/reply', replyToConversation);

export default router;
