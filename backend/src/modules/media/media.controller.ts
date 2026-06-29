import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, minioBucket } from '../../config/minio.js';
import { env } from '../../config/env.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

export const uploadMiddleware = upload.single('file');

export async function uploadMediaController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });
      return;
    }

    const userId = req.user!.id;
    const fileId = randomUUID();
    const key = `media/${userId}/${fileId}.enc`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: minioBucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: 'application/octet-stream',
      }),
    );

    const cleanEndpoint = env.MINIO_ENDPOINT.replace(/^https?:\/\//, '');
    const mediaUrl = `https://${cleanEndpoint}/${minioBucket}/${key}`;
    res.status(201).json({ mediaUrl });
  } catch (err) {
    next(err);
  }
}
