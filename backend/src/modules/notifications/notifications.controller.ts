import type { Request, Response, NextFunction } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from './notifications.service.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';

export async function getNotificationsController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await getNotifications(req.user!.id, limit);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

export async function markAsReadController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await markAsRead(String(req.params.id), req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsReadController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await markAllAsRead(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
