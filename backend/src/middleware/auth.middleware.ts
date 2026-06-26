import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    phone: string;
  };
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; phone: string };
    req.user = { id: payload.userId, phone: payload.phone };
    next();
  } catch {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } });
  }
}
