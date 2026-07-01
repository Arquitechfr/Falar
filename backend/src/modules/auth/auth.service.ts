import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { redis } from '../../config/redis.js';
import { User } from '../users/user.model.js';
import { generateOTP, storeOTP, checkOTPRateLimit, verifyOTP } from '../../utils/otp.js';
import { sendTwilioOtp, verifyTwilioOtp } from './twilio-verify.service.js';
import { generateUsername } from '../../utils/usernameGenerator.js';

function hashPhoneNumber(phoneNumber: string): string {
  return crypto
    .createHash('sha256')
    .update(phoneNumber)
    .digest('hex')
    .substring(0, 16);
}

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

export async function sendOTP(phone: string): Promise<{ isNewUser: boolean; keySalt: string | null }> {
  const allowed = await checkOTPRateLimit(phone);
  if (!allowed) {
    throw new AuthError('RATE_LIMITED', 'Too many OTP requests, try again later', 429);
  }

  const phoneHash = hashPhoneNumber(phone);
  const existingUser = await User.findOne({ phoneHash });
  const isNewUser = !existingUser;
  const keySalt = existingUser?.keySalt || null;

  // Essayer Twilio Verify en premier si activé
  if (env.TWILIO_ENABLED) {
    const twilioResult = await sendTwilioOtp(phone);
    if (twilioResult.success) {
      return { isNewUser, keySalt };
    }
    console.log(`[OTP] Twilio échoué pour ${phoneHash}..., fallback sur système interne`);
  }

  // Fallback sur système interne
  const code = generateOTP();
  await storeOTP(phone, code);
  console.log(`[OTP] Système interne — code pour ${phoneHash}: ${code}`);

  return { isNewUser, keySalt };
}

export async function verifyOTPAndLogin(
  phone: string,
  code: string,
  publicKey: string,
  deviceToken?: string,
  keySalt?: string,
): Promise<{ accessToken: string; refreshToken: string; user: { id: string; phone: string; publicKey: string; displayName: string; allowDirectMessages: boolean } }> {
  const phoneHash = hashPhoneNumber(phone);
  let valid = false;

  // Essayer Twilio Verify en premier si activé
  if (env.TWILIO_ENABLED) {
    const twilioResult = await verifyTwilioOtp(phone, code);
    if (twilioResult.success) {
      valid = true;
    } else {
      console.log(`[OTP] Twilio vérification échouée pour ${phoneHash}..., fallback sur système interne`);
    }
  }

  // Fallback sur système interne
  if (!valid) {
    valid = await verifyOTP(phone, code);
  }

  if (!valid) {
    throw new AuthError('INVALID_OTP', 'Invalid or expired OTP code', 401);
  }

  let user = await User.findOne({ phoneHash });
  if (user) {
    user.publicKey = publicKey;
    user.phoneE164 = phone;
    if (deviceToken) user.deviceToken = deviceToken;
    await user.save();
  } else {
    const maskedPhone = phone.slice(0, 4) + '****' + phone.slice(-2);
    const username = await generateUsername(phone);
    try {
      user = await User.create({
        phoneHash,
        phoneE164: phone,
        publicKey,
        displayName: maskedPhone,
        username,
        deviceToken: deviceToken || '',
        keySalt: keySalt || '',
      });
    } catch (createErr: unknown) {
      const mongoErr = createErr as { code?: number };
      if (mongoErr.code === 11000) {
        // Race condition : une requête concurrente vient de créer l'utilisateur
        const existing = await User.findOne({ phoneHash });
        if (!existing) throw createErr;
        existing.publicKey = publicKey;
        existing.phoneE164 = phone;
        if (deviceToken) existing.deviceToken = deviceToken;
        await existing.save();
        user = existing;
      } else {
        throw createErr;
      }
    }
  }

  const payload = { userId: user._id.toString(), phone: user.phoneE164 };
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });

  await redis.set(REFRESH_KEY(user._id.toString()), refreshToken, 'EX', REFRESH_REDIS_TTL);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      phone: user.phoneE164,
      publicKey: user.publicKey,
      displayName: user.displayName,
      allowDirectMessages: user.allowDirectMessages,
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
