import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { startCallController, endCallController, getCallHistoryController } from './calls.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/start', startCallController);
router.post('/end', endCallController);
router.get('/history', getCallHistoryController);

export default router;
