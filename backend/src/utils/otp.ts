import { randomInt } from 'node:crypto';
import { redis } from '../config/redis.js';

const OTP_TTL = 300; // 5 minutes
const OTP_RATE_LIMIT_TTL = 60; // 1 minute
const OTP_KEY = (phone: string) => `otp:${phone}`;
const OTP_RATE_KEY = (phone: string) => `rl:otp:${phone}`;

export function generateOTP(): string {
  return String(randomInt(0, 1000000)).padStart(6, '0');
}

export async function storeOTP(phone: string, code: string): Promise<void> {
  await redis.set(OTP_KEY(phone), code, 'EX', OTP_TTL);
}

export async function getOTP(phone: string): Promise<string | null> {
  return redis.get(OTP_KEY(phone));
}

export async function deleteOTP(phone: string): Promise<void> {
  await redis.del(OTP_KEY(phone));
}

export async function checkOTPRateLimit(phone: string): Promise<boolean> {
  const exists = await redis.exists(OTP_RATE_KEY(phone));
  if (exists) {
    return false; // rate limited
  }
  await redis.set(OTP_RATE_KEY(phone), '1', 'EX', OTP_RATE_LIMIT_TTL);
  return true; // allowed
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const stored = await getOTP(phone);
  if (!stored || stored !== code) {
    return false;
  }
  await deleteOTP(phone); // anti-replay
  return true;
}
