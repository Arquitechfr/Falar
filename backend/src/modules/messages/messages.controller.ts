import type { Request, Response, NextFunction } from 'express';
import { sendMessageSchema, getMessagesSchema, updateStatusSchema } from './messages.schema.js';
import { sendMessage, getMessages, updateMessageStatus, deleteMessage, verifyConversationAccess, MessageError } from './messages.service.js';
import { computeConversationId } from '../../utils/conversationId.js';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';
import type { Namespace } from 'socket.io';

let chatNamespace: Namespace | undefined;

export function setChatNamespace(namespace: Namespace): void {
  chatNamespace = namespace;
}

export async function sendMessageController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = sendMessageSchema.parse(req.body);
    const result = await sendMessage(req.user!.id, input, chatNamespace);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof MessageError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function getMessagesController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { conversationId } = req.params;
    const query = getMessagesSchema.parse(req.query);

    // Verify user is part of this conversation by checking messages
    const sampleMessage = await (await import('./message.model.js')).Message.findOne({ conversationId }).lean();
    if (!sampleMessage) {
      res.json({ messages: [], hasMore: false });
      return;
    }

    const expectedConversationId = computeConversationId(req.user!.id, sampleMessage.senderId.toString());
    const expectedConversationId2 = computeConversationId(req.user!.id, sampleMessage.recipientId.toString());

    if (conversationId !== expectedConversationId && conversationId !== expectedConversationId2) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You are not part of this conversation' } });
      return;
    }

    const result = await getMessages(req.user!.id, conversationId, query);
    res.json(result);
  } catch (err) {
    if (err instanceof MessageError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function updateStatusController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messageId } = req.params;
    const { status } = updateStatusSchema.parse(req.body);
    await updateMessageStatus(messageId, req.user!.id, status, chatNamespace);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof MessageError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}

export async function deleteMessageController(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messageId } = req.params;
    await deleteMessage(messageId, req.user!.id);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof MessageError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    next(err);
  }
}
