import type { Response, NextFunction } from 'express';
import { syncContactsSchema } from './contacts.schema.js';
import { syncContacts, getStoredContacts } from './contacts.service.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';

export async function syncContactsController(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = syncContactsSchema.parse(req.body);
    const contacts = await syncContacts(req.user!.id, data);
    res.json({ contacts });
  } catch (err) {
    next(err);
  }
}

export async function getContactsController(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const contacts = await getStoredContacts(req.user!.id);
    res.json({ contacts });
  } catch (err) {
    next(err);
  }
}
