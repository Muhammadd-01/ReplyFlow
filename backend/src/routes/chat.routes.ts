import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getChats, getChatMessages } from '../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getChats);
router.get('/:chatId/messages', getChatMessages);

export default router;
