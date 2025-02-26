// app/socket-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

// Create a context for the socket
const SocketContext = createContext<Socket | null>(null);

// Provider component
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    const newSocket = io({
      path: '/api/socketio',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['polling', 'websocket']
    });

    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Global Socket connected');
      setSocket(newSocket);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Global Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook to use the socket
export function useSocket() {
  return useContext(SocketContext);
}