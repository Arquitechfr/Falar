import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { allowedOrigins } from './env.js';
import { registerChatHandlers } from '../socket/chat.handler.js';

export function setupSocketIO(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  const chatNamespace = io.of('/chat');
  registerChatHandlers(chatNamespace);

  return io;
}
