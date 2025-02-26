'use client';

import { io, Socket } from 'socket.io-client';

// Prevent multiple socket instances
let socketInstance: Socket | null = null;

export function getSocket() {
  // Only create socket on client-side
  if (typeof window !== 'undefined') {
    if (!socketInstance) {
      socketInstance = io({
        path: '/api/socketio',
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        transports: ['polling'] // Force polling only
      });

      // Error handling
      socketInstance.on('connect_error', (error) => {
        console.error('Socket Connection Error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      });

      socketInstance.on('error', (error) => {
        console.error('Socket Error:', error);
      });
    }
    return socketInstance;
  }
  return null;
}