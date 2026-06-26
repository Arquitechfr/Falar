import type { Request, Response, NextFunction } from 'express';
import { sendOtpSchema, verifyOtpSchema, refreshSchema } from './auth.schema.js';
import { sendOTP, verifyOTPAndLogin, refreshTokens, logout, AuthError } from './auth.service.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';

export async function sendOtpController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    const { isNewUser } = await sendOTP(phone);
    res.json({ success: true, isNewUser });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function verifyOtpController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, code, publicKey, deviceToken } = verifyOtpSchema.parse(req.body);
    const result = await verifyOTPAndLogin(phone, code, publicKey, deviceToken);
    res.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await refreshTokens(refreshToken);
    res.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function logoutController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await logout(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
