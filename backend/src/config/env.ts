import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3300),
  MONGODB_URI: z.string().url().or(z.string().min(1)),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().min(1).max(65535),
  REDIS_PASSWORD: z.string(),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().min(1).max(65535),
  MINIO_USE_SSL: z.string().transform((v) => v === 'true'),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),

  SMS_GATEWAY_ENABLED: z.string().transform((v) => v === 'true').default('false'),
  SMS_GATEWAY_URL: z.string().optional(),
  SMS_GATEWAY_LOGIN: z.string().optional(),
  SMS_GATEWAY_PASSWORD: z.string().optional(),
  SMS_GATEWAY_DEVICE_ID: z.string().optional(),

  ALLOWED_ORIGINS: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
