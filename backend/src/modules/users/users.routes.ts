import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { getMeController, updateMeController, searchUserController, getUserController, getContactsController } from './users.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMeController);
router.put('/me', updateMeController);
router.get('/search', searchUserController);
router.get('/contacts', getContactsController);
router.get('/:userId', getUserController);

export default router;
