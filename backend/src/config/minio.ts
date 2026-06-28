import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const s3Client = new S3Client({
  endpoint: (() => {
    let endpoint = env.MINIO_ENDPOINT.replace(/^https?:\/\//, '');
    return `${env.MINIO_USE_SSL ? 'https' : 'http'}://${endpoint}:${env.MINIO_PORT}`;
  })(),
  region: 'us-east-1',
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const minioBucket = env.MINIO_BUCKET;
