import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { ciUploadMiddleware, uploadApkController } from './ci.controller.js';

const router = Router();

function ciAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-ci-token'] as string | undefined;
  if (!token || token !== env.CI_UPLOAD_TOKEN) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid CI token' } });
    return;
  }
  next();
}

router.use(ciAuthMiddleware);

router.post('/upload-apk', ciUploadMiddleware, uploadApkController);

export default router;
