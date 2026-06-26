# Falar Backend

Messaging backend — E2E encrypted, server never sees message content.

## Stack

- **Runtime**: Node.js >= 20, ESM (`"type": "module"`)
- **Framework**: Express 4 + Socket.IO 4
- **Database**: MongoDB (Mongoose 8)
- **Cache/Realtime**: Redis (ioredis 5) — online status, socket mapping, typing indicators
- **Storage**: MinIO/S3 (`@aws-sdk/client-s3`)
- **Validation**: Zod 3
- **Auth**: JWT (access + refresh), OTP via SMS gateway
- **Tests**: Vitest 3
- **Process manager**: PM2 (`ecosystem.config.cjs`)
- **Package manager**: pnpm

## Commands

```bash
pnpm install          # install deps
pnpm dev              # dev server with tsx watch (reads .env)
pnpm start            # production server (reads .env)
pnpm test             # run tests (vitest)
pnpm test:watch       # tests in watch mode
pm2 start ecosystem.config.cjs   # production via PM2
```

## Project structure

```
src/
  app.ts                 # Express app + HTTP server + Socket.IO bootstrap
  config/
    env.ts               # Zod-validated env vars (single source of truth)
    db.ts                # MongoDB connection
    redis.ts             # Redis client singleton
    minio.ts             # S3/MinIO client + bucket name
    socket.ts            # Socket.IO server setup, /chat namespace
  middleware/
    auth.middleware.ts   # JWT Bearer verification → req.user
    error.middleware.ts  # Centralized error handler (Zod, Mongo, JWT, generic)
  modules/
    auth/                # OTP send/verify, refresh, logout
      auth.routes.ts     # POST /auth/send-otp, /verify-otp, /refresh, /logout
      auth.controller.ts
      auth.service.ts    # OTP gen, SMS dispatch, JWT minting
      auth.schema.ts     # Zod schemas
    users/
      user.model.ts      # IUser: phone, publicKey, displayName, avatarUrl, deviceToken, lastSeen
      users.routes.ts    # GET /users/me, PUT /users/me, GET /users/search
      users.controller.ts
      users.service.ts
      users.schema.ts
    messages/
      message.model.ts   # IMessage: conversationId, senderId, recipientId, encryptedPayload, nonce, mediaUrl, status
      messages.routes.ts # POST /messages/send, GET /messages/conversations, GET /messages/:conversationId, PATCH /messages/:messageId/status
      messages.controller.ts
      messages.service.ts
      messages.schema.ts
      conversations.controller.ts
      conversations.service.ts
      messages.service.test.ts
    media/
      media.routes.ts    # POST /media/upload (multer + S3)
      media.controller.ts
  socket/
    chat.handler.ts      # /chat namespace: auth, typing, message:delivered, presence, disconnect
  utils/
    conversationId.ts    # SHA-256(sorted([id1, id2]).join(':'))
    conversationId.test.ts
    otp.ts               # OTP generation + hashing
    otp.test.ts
    pushNotification.ts  # Expo push notifications
```

## Architecture rules

- **E2E encryption**: The server stores `encryptedPayload` + `nonce` only. Never log or decrypt message content.
- **Conversation IDs**: Computed as `SHA-256(sorted([userIdA, userIdB]).join(':'))` — deterministic, no separate collection.
- **Env vars**: All config goes through `src/config/env.ts` (Zod-validated). Never access `process.env` directly elsewhere.
- **Error handling**: Use `error.middleware.ts` as the last middleware. Throw Zod errors for validation, let the middleware format responses.
- **Error response format**: Always `{ error: { code: string, message: string, details?: object } }`.
- **Socket auth**: JWT verified in namespace middleware (`socket.handshake.auth.token`).
- **Redis keys**: `online_users` (set), `socket:{userId}` (string, socket.id).
- **Imports**: Use `.js` extensions in import paths (ESM). All imports use absolute relative paths from `src/`.
- **Rate limiting**: Global 100 req/min per IP. Auth routes: 10 req/15min.
- **No `cd` in scripts**: PM2 uses `tsx/dist/cli.mjs` directly.

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/send-otp` | No | Send OTP to phone |
| POST | `/auth/verify-otp` | No | Verify OTP, return JWT + user |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | Yes | Invalidate refresh token |
| GET | `/users/me` | Yes | Current user profile |
| PUT | `/users/me` | Yes | Update profile |
| GET | `/users/search` | Yes | Search users by phone |
| POST | `/messages/send` | Yes | Send encrypted message |
| GET | `/messages/conversations` | Yes | List conversations |
| GET | `/messages/:conversationId` | Yes | Get messages for a conversation |
| PATCH | `/messages/:messageId/status` | Yes | Update message status |
| POST | `/media/upload` | Yes | Upload media to S3 |
| GET | `/health` | No | Health check |

## Socket.IO events (/chat namespace)

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `typing:start` | `{ conversationId }` |
| Server → Client | `typing:start` | `{ conversationId, userId }` |
| Server → Client | `typing:stop` | `{ conversationId, userId }` |
| Client → Server | `message:delivered` | `{ messageId }` |
| Server → Client | `user:status` | `{ userId, online, lastSeen? }` |

## Related repo

The frontend lives in `../frontend/` — an Expo (React Native) app that connects to this backend via REST (`EXPO_PUBLIC_API_URL`) and Socket.IO (`EXPO_PUBLIC_SOCKET_URL`).

## Env variables

See `.env.example` for all required variables. Key ones:
- `PORT` (default 3300)
- `MONGODB_URI`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (min 16 chars)
- `MINIO_*` (S3-compatible storage)
- `SMS_GATEWAY_*` (OTP delivery)
- `ALLOWED_ORIGINS` (comma-separated CORS origins)
