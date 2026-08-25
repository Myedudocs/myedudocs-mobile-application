/**
 * socketService.ts
 *
 * A singleton Socket.IO client that the AuthContext connects after login
 * and disconnects after logout. Components never need to manage the socket
 * lifecycle themselves.
 */

import { io, Socket } from 'socket.io-client';

// The socket server root — no /api/v1 path prefix
const SOCKET_SERVER_URL = 'https://api.myedudocs.in';

let socket: Socket | null = null;

/**
 * Connect to the socket server and join the user's personal room.
 * Safe to call multiple times — reuses the existing socket if already connected.
 */
export const connectSocket = (userId: string, role: string = 'student'): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_SERVER_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    // Tell the server which user this socket belongs to so it joins the userId room
    socket?.emit('user_online', { userId, role });
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
};

/**
 * Disconnect and clean up.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get the current socket instance (may be null if not connected).
 */
export const getSocket = (): Socket | null => socket;
