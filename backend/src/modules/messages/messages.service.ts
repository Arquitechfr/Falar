import type { Namespace } from 'socket.io';
import { Message } from './message.model.js';
import { User } from '../users/user.model.js';
import { computeConversationId, isParticipant } from '../../utils/conversationId.js';
import { sendPushNotification } from '../../utils/pushNotification.js';
import { redis } from '../../config/redis.js';

export class MessageError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'MessageError';
  }
}

export async function sendMessage(
  senderId: string,
  input: { recipientId: string; encryptedPayload: string; nonce: string; mediaUrl?: string; clientTimestamp: string },
  io?: Namespace,
): Promise<{ messageId: string; serverTimestamp: Date }> {
  const recipient = await User.findById(input.recipientId);
  if (!recipient) {
    throw new MessageError('RECIPIENT_NOT_FOUND', 'Recipient does not exist', 404);
  }

  const conversationId = computeConversationId(senderId, input.recipientId);

  const message = await Message.create({
    conversationId,
    senderId,
    recipientId: input.recipientId,
    encryptedPayload: input.encryptedPayload,
    nonce: input.nonce,
    mediaUrl: input.mediaUrl || '',
    status: 'sent',
    clientTimestamp: new Date(input.clientTimestamp),
    serverTimestamp: new Date(),
  });

  const messageObj = message.toObject();
  const messageId = message._id.toString();

  // Try Socket.IO delivery
  if (io) {
    const recipientSocketId = await redis.get(`socket:${input.recipientId}`);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message:new', messageObj);
      return { messageId, serverTimestamp: message.serverTimestamp };
    }
  }

  // Fallback: push notification if offline
  if (recipient.deviceToken) {
    const sender = await User.findById(senderId);
    const senderName = sender?.displayName || 'Falar';
    await sendPushNotification(recipient.deviceToken, senderName, 'Nouveau message', { messageId });
  }

  return { messageId, serverTimestamp: message.serverTimestamp };
}

export async function getMessages(
  userId: string,
  conversationId: string,
  query: { before?: string; limit: number },
): Promise<{ messages: unknown[]; hasMore: boolean }> {
  const filter: Record<string, unknown> = { conversationId };

  if (query.before) {
    filter.serverTimestamp = { $lt: new Date(query.before) };
  }

  const messages = await Message.find(filter)
    .sort({ serverTimestamp: -1 })
    .limit(query.limit + 1)
    .lean();

  const hasMore = messages.length > query.limit;
  const result = hasMore ? messages.slice(0, query.limit) : messages;

  return { messages: result, hasMore };
}

export async function updateMessageStatus(
  messageId: string,
  recipientId: string,
  status: 'delivered' | 'read',
  io?: Namespace,
): Promise<void> {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new MessageError('NOT_FOUND', 'Message not found', 404);
  }

  if (message.recipientId.toString() !== recipientId) {
    throw new MessageError('FORBIDDEN', 'Only the recipient can update message status', 403);
  }

  message.status = status;
  await message.save();

  if (io) {
    const senderSocketId = await redis.get(`socket:${message.senderId.toString()}`);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message:status', { messageId, status });
    }
  }
}

export function verifyConversationAccess(conversationId: string, userIdA: string, userIdB: string): boolean {
  return isParticipant(conversationId, userIdA, userIdB);
}
