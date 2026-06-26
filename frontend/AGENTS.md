# Falar Frontend

Expo (React Native) messaging app with E2E encryption. Connects to the backend in `../backend/`.

## Expo version

This project uses **Expo SDK 56** (React 19.2, React Native 0.85).
Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Stack

- **Framework**: Expo 56 + expo-router (file-based routing)
- **React**: 19.2 / React Native 0.85
- **Styling**: NativeWind 4 (TailwindCSS 3)
- **State**: Zustand 5
- **Data fetching**: TanStack React Query 5
- **HTTP**: Axios (with auto token refresh interceptor)
- **Realtime**: socket.io-client 4
- **Crypto**: @noble/curves (X25519), @noble/ciphers (ChaCha20-Poly1305), @noble/hashes (scrypt)
- **Storage**: expo-secure-store (tokens + keys)
- **Notifications**: expo-notifications
- **Package manager**: pnpm

## Commands

```bash
pnpm install          # install deps
pnpm start            # start Expo dev server
pnpm android          # start on Android
pnpm ios              # start on iOS
pnpm web              # start on web
```

## Project structure

```
app/                        # expo-router file-based routes
  _layout.tsx               # Root: QueryClient + SafeArea + auth gate
  (auth)/                   # Unauthenticated group
    _layout.tsx
    phone.tsx               # Phone entry → send OTP
    otp.tsx                 # OTP verification
    password.tsx            # Password → derive keypair, login
  (main)/                   # Authenticated group
    _layout.tsx             # Tab/stack layout, socket connect
    conversations.tsx       # Conversation list
    chat/
      [conversationId].tsx  # Chat screen
    profile.tsx             # User profile
features/                   # Feature-based modules
  auth/
    authApi.ts              # sendOtp, verifyOtp, refresh, logout
    authStore.ts            # Zustand: user, isAuthenticated, isLoading
    useAuth.ts              # Auth hook (bootstrap from SecureStore)
  chat/
    chatApi.ts              # sendMessage, getMessages
    chatStore.ts            # Zustand: messages[], isTyping, optimistic updates
    useChat.ts              # Chat orchestration hook (socket + API + crypto)
    components/
      MessageBubble.tsx
      MessageInput.tsx
      StatusIcon.tsx
      TypingIndicator.tsx
  conversations/
    conversationsApi.ts     # list conversations
    conversationsStore.ts   # Zustand: conversations[]
    useConversations.ts     # Hook: fetch + subscribe to updates
  crypto/
    encryption.ts           # encryptMessage / decryptMessage (X25519 + ChaCha20-Poly1305)
    keyDerivation.ts        # deriveKeypair from password+phone via scrypt
    cryptoStore.ts          # Zustand: privateKey, publicKey (in-memory only)
  media/
    mediaApi.ts             # upload media
  users/
    usersApi.ts             # search users, get/update profile
services/
  api.ts                    # Axios instance + interceptors (auto refresh on 401)
  socket.ts                 # Socket.IO client singleton
  notifications.ts          # Push notification registration
components/                 # Shared UI components
  Avatar.tsx
  ConversationItem.tsx
  SafeScreen.tsx
constants/
  theme.ts                  # Theme constants
utils/
  conversationId.ts         # SHA-256(sorted([id1, id2]).join(':')) — mirrors backend
  sha256.ts
```

## Architecture rules

- **E2E encryption**: Messages are encrypted client-side before sending. The server never sees plaintext.
  - Key derivation: scrypt(password, `falar:v1:${phone}`) → X25519 keypair
  - Encryption: X25519 ECDH shared secret → ChaCha20-Poly1305
  - Private key lives in memory only (`cryptoStore`), never persisted to disk
- **Conversation IDs**: `SHA-256(sorted([userIdA, userIdB]).join(':'))` — same logic as backend
- **Auth flow**: Phone → OTP → Password → derive keypair → login. Tokens stored in `expo-secure-store`.
- **Token refresh**: Axios interceptor auto-refreshes on 401. If refresh fails → logout + clear keys.
- **Socket**: Connects to `${EXPO_PUBLIC_SOCKET_URL}/chat` with JWT auth. Singleton in `services/socket.ts`.
- **Path aliases**: `@/*` maps to project root (see `tsconfig.json`).
- **Styling**: NativeWind classes (`className="..."`). Theme colors defined in `tailwind.config.js`.
  - `primary`: #25D366, `background`: #111B21, `surface`: #1F2C34, `bubble-mine`: #005C4B, `bubble-other`: #202C33
- **State pattern**: Each feature has `*Api.ts` (network), `*Store.ts` (Zustand state), `use*.ts` (hook orchestrating both).

## Env variables

```
EXPO_PUBLIC_API_URL=http://localhost:3300
EXPO_PUBLIC_SOCKET_URL=http://localhost:3300
```

## Related repo

The backend lives in `../backend/` — Express + Socket.IO + MongoDB + Redis.
API routes: `/auth/*`, `/users/*`, `/messages/*`, `/media/*`
Socket namespace: `/chat`
