import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { uploadMiddleware, uploadMediaController } from './media.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/upload', uploadMiddleware, uploadMediaController);

export default router;
