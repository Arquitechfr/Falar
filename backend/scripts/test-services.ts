import mongoose from 'mongoose';
import Redis from 'ioredis';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const {
  MONGODB_URI,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_USE_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
} = process.env;

const log = (msg: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
  const colors: Record<string, string> = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}[${type.toUpperCase()}]${reset} ${msg}`);
};

function validateEnv(): boolean {
  const required = [
    'MONGODB_URI',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'MINIO_ENDPOINT',
    'MINIO_PORT',
    'MINIO_USE_SSL',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'MINIO_BUCKET',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    log(`Variables d'environnement manquantes : ${missing.join(', ')}`, 'error');
    log('Assurez-vous d\'avoir un fichier .env valide dans le dossier backend.', 'warn');
    return false;
  }
  return true;
}

async function testMongoDB(): Promise<{ success: boolean; message: string }> {
  try {
    log('Test MongoDB...', 'info');
    await mongoose.connect(MONGODB_URI!);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    await mongoose.disconnect();
    return {
      success: true,
      message: `Connecté (${collections.length} collections)`,
    };
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}

async function testRedis(): Promise<{ success: boolean; message: string }> {
  let redis: Redis | null = null;
  try {
    log('Test Redis...', 'info');
    redis = new Redis({
      host: REDIS_HOST!,
      port: parseInt(REDIS_PORT!, 10),
      password: REDIS_PASSWORD!,
      lazyConnect: true,
    });
    await redis.connect();
    const testKey = `falar-health-check-${randomUUID()}`;
    await redis.set(testKey, 'ok', 'EX', 10);
    const value = await redis.get(testKey);
    await redis.del(testKey);
    await redis.quit();
    if (value === 'ok') {
      return { success: true, message: 'Connecté (SET/GET/DEL OK)' };
    }
    return { success: false, message: 'Valeur incorrecte après SET/GET' };
  } catch (err) {
    if (redis) await redis.quit().catch(() => {});
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}

async function testMinIO(): Promise<{ success: boolean; message: string }> {
  try {
    log('Test MinIO...', 'info');
    let endpoint = MINIO_ENDPOINT!;
    endpoint = endpoint.replace(/^https?:\/\//, '');
    endpoint = `${MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${endpoint}:${MINIO_PORT}`;
    const bucket = MINIO_BUCKET!;
    const testKey = `health-check/${randomUUID()}.txt`;
    const testContent = `Falar MinIO health check - ${new Date().toISOString()}`;

    const s3 = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: MINIO_ACCESS_KEY!,
        secretAccessKey: MINIO_SECRET_KEY!,
      },
      forcePathStyle: true,
    });

    await s3.send(new ListBucketsCommand({}));

    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err) {
      try {
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
      } catch (createErr) {
        const createMessage = (createErr as Error).message;
        if (!(createMessage.includes('already own it') || createMessage.includes('BucketAlreadyExists'))) {
          throw createErr;
        }
      }
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: Buffer.from(testContent, 'utf-8'),
        ContentType: 'text/plain',
      }),
    );

    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: testKey }));
    const downloaded = await response.Body?.transformToString('utf-8');

    if (downloaded !== testContent) {
      throw new Error('Contenu ne correspond pas');
    }

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));

    return { success: true, message: 'Connecté (bucket + PUT/GET/DEL OK)' };
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}

async function main() {
  log('Test des services pour Falar', 'info');
  console.log('');

  if (!validateEnv()) {
    process.exit(1);
  }

  const results = await Promise.all([
    testMongoDB(),
    testRedis(),
    testMinIO(),
  ]);

  console.log('');
  log('Résultats des tests', 'info');
  console.log('');

  const services = ['MongoDB', 'Redis', 'MinIO'];
  let allPassed = true;

  services.forEach((service, index) => {
    const result = results[index];
    if (result.success) {
      log(`${service} : ${result.message}`, 'success');
    } else {
      log(`${service} : ${result.message}`, 'error');
      allPassed = false;
    }
  });

  console.log('');

  if (allPassed) {
    log('Tous les services sont opérationnels', 'success');
    process.exit(0);
  } else {
    log('Certains services ne sont pas prêts', 'error');
    process.exit(1);
  }
}

main().catch((err) => {
  log(`Erreur inattendue : ${err.message}`, 'error');
  process.exit(1);
});
