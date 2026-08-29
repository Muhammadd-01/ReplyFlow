import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  optOutContact,
} from '../controllers/contact.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getContacts);
router.post('/', createContact);
router.get('/:id', getContactById);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);
router.post('/:id/opt-out', optOutContact);

export default router;
