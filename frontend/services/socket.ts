import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connect(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(`${process.env.EXPO_PUBLIC_SOCKET_URL}/chat`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnect(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
