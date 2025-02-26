// app/api/socketio/route.ts
import { Server } from 'socket.io';
import { NextRequest, NextResponse } from 'next/server';

// Manage socket server instance
let io: Server | null = null;

export async function GET() {
  // If socket.io is already initialized, return
  if (io) {
    return NextResponse.json({ message: 'Socket.io already initialized' });
  }

  // Import Socket.IO dynamically
  const { Server: ServerIO } = await import('socket.io');

  // Create new Socket.IO server
  io = new ServerIO({
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: '*', // Adjust in production
      methods: ['GET', 'POST']
    }
  });

  // Basic error handling
  io.engine.on('connection_error', (err) => {
    console.error('Socket Connection Error:', err.message);
  });

  // Socket connection event
  io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle new post event
    socket.on('newPost', (post) => {
      console.log('New post received:', post);
      // Broadcast to all clients
      io.emit('newPost', post);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return NextResponse.json({ message: 'Socket.io initialized' });
}