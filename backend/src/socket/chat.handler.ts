import type { Namespace, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { User } from '../modules/users/user.model.js';
import { updateMessageStatus } from '../modules/messages/messages.service.js';

const TYPING_TTL = 3; // 3 seconds

export function registerChatHandlers(chatNamespace: Namespace): void {
  // Auth middleware
  chatNamespace.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; phone: string };
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('INVALID_TOKEN'));
    }
  });

  chatNamespace.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;

    // Track online status
    redis.sadd('online_users', userId);
    redis.set(`socket:${userId}`, socket.id);

    // Notify contacts of online status
    broadcastUserStatus(chatNamespace, userId, true);

    // typing:start
    socket.on('typing:start', async (data: { conversationId: string; recipientId: string }) => {
      if (!data.recipientId) return;
      const recipientSocketId = await redis.get(`socket:${data.recipientId}`);
      if (recipientSocketId) {
        chatNamespace.to(recipientSocketId).emit('typing:start', { conversationId: data.conversationId, userId });
        setTimeout(() => {
          chatNamespace.to(recipientSocketId).emit('typing:stop', { conversationId: data.conversationId, userId });
        }, TYPING_TTL * 1000);
      }
    });

    // typing:stop
    socket.on('typing:stop', async (data: { conversationId: string; recipientId: string }) => {
      if (!data.recipientId) return;
      const recipientSocketId = await redis.get(`socket:${data.recipientId}`);
      if (recipientSocketId) {
        chatNamespace.to(recipientSocketId).emit('typing:stop', { conversationId: data.conversationId, userId });
      }
    });

    // message:delivered
    socket.on('message:delivered', async (data: { messageId: string }) => {
      try {
        await updateMessageStatus(data.messageId, userId, 'delivered', chatNamespace);
      } catch (err) {
        console.error('[Socket] message:delivered error:', (err as Error).message);
      }
    });

    // WebRTC Call signaling
    socket.on('call:offer', async (data: { callId: string; recipientId: string; sdp: unknown }) => {
      const recipientSocketId = await redis.get(`socket:${data.recipientId}`);
      if (recipientSocketId) {
        chatNamespace.to(recipientSocketId).emit('call:offer', {
          callId: data.callId,
          callerId: userId,
          sdp: data.sdp,
        });
      }
    });

    socket.on('call:answer', async (data: { callId: string; callerId: string; sdp: unknown }) => {
      const callerSocketId = await redis.get(`socket:${data.callerId}`);
      if (callerSocketId) {
        chatNamespace.to(callerSocketId).emit('call:answer', {
          callId: data.callId,
          sdp: data.sdp,
        });
      }
    });

    socket.on('call:reject', async (data: { callId: string; callerId: string }) => {
      const callerSocketId = await redis.get(`socket:${data.callerId}`);
      if (callerSocketId) {
        chatNamespace.to(callerSocketId).emit('call:reject', { callId: data.callId });
      }
    });

    socket.on('call:ice-candidate', async (data: { recipientId: string; candidate: unknown }) => {
      const recipientSocketId = await redis.get(`socket:${data.recipientId}`);
      if (recipientSocketId) {
        chatNamespace.to(recipientSocketId).emit('call:ice-candidate', {
          callerId: userId,
          candidate: data.candidate,
        });
      }
    });

    socket.on('call:end', async (data: { callId: string; recipientId: string }) => {
      const recipientSocketId = await redis.get(`socket:${data.recipientId}`);
      if (recipientSocketId) {
        chatNamespace.to(recipientSocketId).emit('call:end', { callId: data.callId });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      await redis.srem('online_users', userId);
      await redis.del(`socket:${userId}`);

      const now = new Date();
      await User.findByIdAndUpdate(userId, { lastSeen: now });

      broadcastUserStatus(chatNamespace, userId, false, now.toISOString());
    });
  });
}

async function broadcastUserStatus(namespace: Namespace, userId: string, online: boolean, lastSeen?: string): Promise<void> {
  // Find all online users who have a conversation with this user
  const onlineUserIds = await redis.smembers('online_users');
  for (const onlineUserId of onlineUserIds) {
    if (onlineUserId === userId) continue;
    const recipientSocketId = await redis.get(`socket:${onlineUserId}`);
    if (recipientSocketId) {
      namespace.to(recipientSocketId).emit('user:status', { userId, online, lastSeen });
    }
  }
}
