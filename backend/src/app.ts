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
import callsRoutes from './modules/calls/calls.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
import ciRoutes from './modules/ci/ci.routes.js';

const LANDING_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Falar — Backend API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f1a;
      color: #e0e0e8;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { text-align: center; padding: 2rem; max-width: 560px; }
    .logo {
      width: 88px; height: 88px; margin: 0 auto 1.75rem;
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      border-radius: 24px;
      display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; font-weight: 700; color: #fff;
      box-shadow: 0 8px 32px rgba(108, 92, 231, 0.35);
    }
    h1 { font-size: 1.9rem; font-weight: 700; margin-bottom: .6rem; letter-spacing: -.02em; }
    .tagline { font-size: 1.05rem; color: #8888a0; margin-bottom: 2.25rem; line-height: 1.5; }
    .status {
      display: inline-flex; align-items: center; gap: .5rem;
      background: rgba(46, 213, 115, 0.1);
      border: 1px solid rgba(46, 213, 115, 0.25);
      color: #2ed573; padding: .5rem 1.1rem; border-radius: 999px;
      font-size: .85rem; font-weight: 600; margin-bottom: 2rem;
    }
    .dot { width: 8px; height: 8px; background: #2ed573; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
    .endpoints {
      background: #16162a; border: 1px solid #22223a; border-radius: 16px;
      padding: 1.5rem; text-align: left; margin-bottom: 1.75rem;
    }
    .endpoints h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: #6666a0; margin-bottom: 1rem; }
    .endpoint { display: flex; align-items: center; gap: .75rem; padding: .5rem 0; border-bottom: 1px solid #1e1e34; }
    .endpoint:last-child { border-bottom: none; }
    .method {
      font-size: .7rem; font-weight: 700; padding: .2rem .55rem; border-radius: 6px;
      min-width: 48px; text-align: center;
    }
    .get { background: rgba(0, 184, 148, 0.15); color: #00b894; }
    .post { background: rgba(9, 132, 227, 0.15); color: #0984e3; }
    .patch { background: rgba(253, 203, 110, 0.15); color: #fdcb6e; }
    .path { font-family: 'SF Mono', 'Fira Code', monospace; font-size: .85rem; color: #b0b0c8; }
    .footer { font-size: .8rem; color: #555570; }
    .footer a { color: #6c5ce7; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">F</div>
    <h1>Falar API</h1>
    <p class="tagline">Backend de messagerie chiffré de bout en bout.<br>Le serveur ne voit jamais le contenu de vos messages.</p>
    <div class="status"><span class="dot"></span> Opérationnel</div>
    <div class="endpoints">
      <h2>Endpoints publics</h2>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/health</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/auth/send-otp</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/auth/verify-otp</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/auth/refresh</span></div>
    </div>
    <p class="footer">Falar &copy; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`;

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '600mb' }));
app.use(express.urlencoded({ limit: '600mb', extended: true }));

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
app.use('/calls', callsRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/search', searchRoutes);
app.use('/ci', ciRoutes);
app.use('/contacts', contactsRoutes);

// Landing page
app.get('/', (_req, res) => {
  res.type('html').send(LANDING_PAGE);
});

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
