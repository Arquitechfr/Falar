import http from 'node:http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { env, allowedOrigins } from './config/env.js';
import { connectDB } from './config/db.js';
import { setupSocketIO } from './config/socket.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { setChatNamespace } from './modules/messages/messages.controller.js';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import mediaRoutes from './modules/media/media.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '55mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit: 100 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
app.use(globalLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/messages', messagesRoutes);
app.use('/media', mediaRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be last)
app.use(errorMiddleware);

const server = http.createServer(app);
const io = setupSocketIO(server);

// Inject Socket.IO namespace into messages controller
setChatNamespace(io.of('/chat'));

async function start(): Promise<void> {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`[Server] Falar backend running on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});

export { app, server, io };
