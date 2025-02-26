import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiResponseServerIO } from '../../types/next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method === 'POST') {
    // Handle the POST request
    const post = req.body;

    // Here, you would typically save the post to your database
    // For this example, we'll just emit it directly

    // Get the Socket.IO server instance
    const io = res.socket.server.io;

    if (io) {
      // Emit the new post to all connected clients
      io.emit('newPost', post);

      // You would typically update top threads here based on your logic
      // For this example, we'll just emit a dummy update
      io.emit('updateTopThreads', [/* your updated top threads data */]);
    }

    res.status(201).json({ message: 'Post created successfully' });
  } else {
    // Handle GET request (fetching posts)
    // Implement your logic to fetch posts here

    res.status(200).json([/* your posts data */]);
  }
}