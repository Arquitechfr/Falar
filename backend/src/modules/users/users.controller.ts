import type { Request, Response, NextFunction } from 'express';
import { updateMeSchema, searchUserSchema } from './users.schema.js';
import { getMe, updateMe, searchByPhone } from './users.service.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';

export async function getMeController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getMe(req.user!.id);
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateMeController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateMeSchema.parse(req.body);
    const user = await updateMe(req.user!.id, data);
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function searchUserController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = searchUserSchema.parse(req.query);
    const user = await searchByPhone(phone);
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}
