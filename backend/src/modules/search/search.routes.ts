import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { searchController } from './search.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', searchController);

export default router;
