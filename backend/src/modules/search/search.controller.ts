import type { Request, Response, NextFunction } from 'express';
import { searchUsers, searchMedia } from './search.service.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';

export async function searchController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) {
      res.json({ users: [], media: [] });
      return;
    }

    const [users, media] = await Promise.all([
      searchUsers(req.user!.id, q),
      searchMedia(req.user!.id, q),
    ]);

    res.json({ users, media });
  } catch (err) {
    next(err);
  }
}
