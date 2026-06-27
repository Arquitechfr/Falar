import type { Namespace } from 'socket.io';
import { Call } from './call.model.js';
import { User } from '../users/user.model.js';
import { computeConversationId } from '../../utils/conversationId.js';
import { redis } from '../../config/redis.js';

export class CallError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'CallError';
  }
}

export async function startCall(
  callerId: string,
  input: { recipientId: string; type: 'audio' | 'video' },
  io?: Namespace,
): Promise<{ callId: string; conversationId: string }> {
  const recipient = await User.findById(input.recipientId);
  if (!recipient) {
    throw new CallError('RECIPIENT_NOT_FOUND', 'Recipient does not exist', 404);
  }

  const conversationId = computeConversationId(callerId, input.recipientId);

  const call = await Call.create({
    callerId,
    recipientId: input.recipientId,
    conversationId,
    type: input.type,
    status: 'ringing',
    startedAt: new Date(),
  });

  if (io) {
    const recipientSocketId = await redis.get(`socket:${input.recipientId}`);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('call:incoming', {
        callId: call._id.toString(),
        callerId,
        conversationId,
        type: input.type,
      });
    }
  }

  return { callId: call._id.toString(), conversationId };
}

export async function endCall(
  callId: string,
  userId: string,
  status: 'accepted' | 'rejected' | 'ended' | 'missed',
  duration?: number,
  io?: Namespace,
): Promise<void> {
  const call = await Call.findById(callId);
  if (!call) {
    throw new CallError('NOT_FOUND', 'Call not found', 404);
  }

  if (call.callerId.toString() !== userId && call.recipientId.toString() !== userId) {
    throw new CallError('FORBIDDEN', 'Not a participant in this call', 403);
  }

  call.status = status;
  call.endedAt = new Date();
  if (duration !== undefined) call.duration = duration;
  await call.save();

  if (io) {
    const otherUserId = call.callerId.toString() === userId ? call.recipientId.toString() : call.callerId.toString();
    const otherSocketId = await redis.get(`socket:${otherUserId}`);
    if (otherSocketId) {
      io.to(otherSocketId).emit('call:end', { callId, status });
    }
  }
}

export async function getCallHistory(userId: string, limit: number = 50): Promise<unknown[]> {
  const calls = await Call.find({
    $or: [{ callerId: userId }, { recipientId: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const userIds = new Set<string>();
  calls.forEach((c) => {
    userIds.add(c.callerId.toString());
    userIds.add(c.recipientId.toString());
  });

  const users = await User.find({ _id: { $in: Array.from(userIds) } }).lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return calls.map((c) => {
    const otherId = c.callerId.toString() === userId ? c.recipientId.toString() : c.callerId.toString();
    const otherUser = userMap.get(otherId);
    return {
      id: c._id.toString(),
      type: c.type,
      status: c.status,
      duration: c.duration,
      startedAt: c.startedAt,
      endedAt: c.endedAt,
      outgoing: c.callerId.toString() === userId,
      otherUser: otherUser
        ? {
            id: otherUser._id.toString(),
            displayName: otherUser.displayName,
            avatarUrl: otherUser.avatarUrl,
          }
        : null,
    };
  });
}
