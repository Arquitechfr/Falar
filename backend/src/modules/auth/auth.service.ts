import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { redis } from '../../config/redis.js';
import { User } from '../users/user.model.js';
import { generateOTP, storeOTP, checkOTPRateLimit, verifyOTP } from '../../utils/otp.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_REDIS_TTL = 604800; // 7 days in seconds
const REFRESH_KEY = (userId: string) => `refresh:${userId}`;

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

export async function sendOTP(phone: string): Promise<{ isNewUser: boolean }> {
  const allowed = await checkOTPRateLimit(phone);
  if (!allowed) {
    throw new AuthError('RATE_LIMITED', 'Too many OTP requests, try again later', 429);
  }

  const existingUser = await User.findOne({ phone });
  const isNewUser = !existingUser;

  const code = generateOTP();
  await storeOTP(phone, code);

  if (env.SMS_GATEWAY_ENABLED && env.SMS_GATEWAY_URL) {
    await sendViaSmsGateway(phone, code);
  } else {
    console.log(`[OTP] Dev mode — code for ${phone}: ${code}`);
  }

  return { isNewUser };
}

async function sendViaSmsGateway(phone: string, code: string): Promise<void> {
  const auth = Buffer.from(`${env.SMS_GATEWAY_LOGIN}:${env.SMS_GATEWAY_PASSWORD}`).toString('base64');

  try {
    const response = await fetch(`${env.SMS_GATEWAY_URL}/api/v1/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        message: `Falar : ton code est ${code}`,
        phone,
        deviceId: env.SMS_GATEWAY_DEVICE_ID,
      }),
    });

    if (!response.ok) {
      console.error('[SMS] Gateway error:', response.status, await response.text());
    }
  } catch (err) {
    console.error('[SMS] Failed to send OTP:', (err as Error).message);
  }
}

export async function verifyOTPAndLogin(
  phone: string,
  code: string,
  publicKey: string,
  deviceToken?: string,
): Promise<{ accessToken: string; refreshToken: string; user: { id: string; phone: string; publicKey: string; displayName: string } }> {
  const valid = await verifyOTP(phone, code);
  if (!valid) {
    throw new AuthError('INVALID_OTP', 'Invalid or expired OTP code', 401);
  }

  let user = await User.findOne({ phone });
  if (user) {
    user.publicKey = publicKey;
    if (deviceToken) user.deviceToken = deviceToken;
    await user.save();
  } else {
    const maskedPhone = phone.slice(0, 4) + '****' + phone.slice(-2);
    user = await User.create({
      phone,
      publicKey,
      displayName: maskedPhone,
      deviceToken: deviceToken || '',
    });
  }

  const payload = { userId: user._id.toString(), phone: user.phone };
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });

  await redis.set(REFRESH_KEY(user._id.toString()), refreshToken, 'EX', REFRESH_REDIS_TTL);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      phone: user.phone,
      publicKey: user.publicKey,
      displayName: user.displayName,
    },
  };
}

export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
  let payload: { userId: string; phone: string };

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; phone: string };
  } catch {
    throw new AuthError('INVALID_TOKEN', 'Invalid refresh token', 401);
  }

  const stored = await redis.get(REFRESH_KEY(payload.userId));
  if (!stored || stored !== refreshToken) {
    throw new AuthError('TOKEN_REVOKED', 'Refresh token has been revoked', 401);
  }

  const accessToken = jwt.sign(
    { userId: payload.userId, phone: payload.phone },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  return { accessToken };
}

export async function logout(userId: string): Promise<void> {
  await redis.del(REFRESH_KEY(userId));
}
