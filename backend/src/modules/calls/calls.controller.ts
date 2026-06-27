import type { Request, Response, NextFunction } from 'express';
import { startCallSchema, endCallSchema } from './calls.schema.js';
import { startCall, endCall, getCallHistory, CallError } from './calls.service.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';
import type { Namespace } from 'socket.io';

let chatNamespace: Namespace | undefined;

export function setCallNamespace(namespace: Namespace): void {
  chatNamespace = namespace;
}

export async function startCallController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = startCallSchema.parse(req.body);
    const result = await startCall(req.user!.id, input, chatNamespace);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof CallError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function endCallController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = endCallSchema.parse(req.body);
    await endCall(input.callId, req.user!.id, input.status, input.duration, chatNamespace);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof CallError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function getCallHistoryController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await getCallHistory(req.user!.id, limit);
    res.json({ calls: history });
  } catch (err) {
    next(err);
  }
}
