import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { getMeController, updateMeController, searchUserController } from './users.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMeController);
router.put('/me', updateMeController);
router.get('/search', searchUserController);

export default router;
