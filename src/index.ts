// import logger from 'jet-logger';

// import ENV from '@src/common/ENV';
// import server from './server';


// /******************************************************************************
//                                   Run
// ******************************************************************************/

// const SERVER_START_MSG = ('Express server started on port: ' + 
//   ENV.Port.toString());

// server.listen(ENV.Port, () => logger.info(SERVER_START_MSG));
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import logger from 'jet-logger';

import ENV from '@src/common/ENV';
import app from './server';

// Create HTTP server
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: corsOptions,
});

// Socket.IO connection handler
console.log('io', io)
io.on('connection', (socket) => {
  logger.info('A user connected');

  // Handle 'joinRoom' event
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // Handle 'chatMessage' event
  socket.on('chatMessage', (msg) => {
    console.log("msg:   " + msg.room)
    const { room, message } = msg;
    io.to(room).emit('chatMessage', {id: socket.id, message, room: msg.room});
    logger.info(`Message sent to room ${room}: ${message}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info('A user disconnected');
  });
  
  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room ${room}`);
    // Optionally, notify others.
    socket.to(room).emit('systemMessage', `User ${socket.id} left the room.`);
  });
});

// Start the server
const PORT = ENV.Port || 3000;
server.listen(PORT, () => {
  logger.info(`Server started on port: ${PORT}`);
});