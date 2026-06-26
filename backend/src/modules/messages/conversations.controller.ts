import type { Response, NextFunction } from 'express';
import { getConversations } from './conversations.service.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';

export async function getConversationsController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversations = await getConversations(req.user!.id);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}
