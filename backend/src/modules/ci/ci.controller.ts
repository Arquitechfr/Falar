import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { createReadStream, unlink } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client, minioBucket } from '../../config/minio.js';
import { env } from '../../config/env.js';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpdir()),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `falar-ci-${unique}-${file.originalname}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.apk', '.aab'];
    const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`));
    }
  },
});

export const ciUploadMiddleware = upload.single('apk');

export async function uploadApkController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const tmpPath = req.file?.path;

  try {
    if (!req.file) {
      res.status(400).json({ error: { code: 'NO_FILE', message: 'No APK file uploaded' } });
      return;
    }

    const profile = (req.body.profile as string) || 'unknown';
    const runNumber = (req.body.runNumber as string) || '0';
    const originalName = req.file.originalname;

    const key = `builds/${profile}/${runNumber}/${originalName}`;

    const fileStream = createReadStream(tmpPath!);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: minioBucket,
        Key: key,
        Body: fileStream,
        ContentType: req.file.mimetype || 'application/vnd.android.package-archive',
      },
      queueSize: 4,
      partSize: 8 * 1024 * 1024, // 8 MB parts — handles large APKs via multipart
      leavePartsOnError: false,
    });

    await upload.done();

    const fileUrl = `https://${env.MINIO_ENDPOINT}/${minioBucket}/${key}`;

    res.status(201).json({
      url: fileUrl,
      key,
      bucket: minioBucket,
      size: req.file.size,
      filename: originalName,
    });
  } catch (err) {
    next(err);
  } finally {
    if (tmpPath) {
      unlink(tmpPath, () => {});
    }
  }
}
