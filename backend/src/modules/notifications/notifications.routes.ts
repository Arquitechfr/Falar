import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { getNotificationsController, markAsReadController, markAllAsReadController } from './notifications.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotificationsController);
router.patch('/read-all', markAllAsReadController);
router.patch('/:id/read', markAsReadController);

export default router;
