import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { syncContactsController, getContactsController } from './contacts.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/sync', syncContactsController);
router.get('/', getContactsController);

export default router;
