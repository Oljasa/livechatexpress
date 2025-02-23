import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import express, { Request, Response, NextFunction } from 'express';
import logger from 'jet-logger';

import 'express-async-errors';

import BaseRouter from '@src/routes';

import Paths from '@src/common/Paths';
import ENV from '@src/common/ENV';
import HttpStatusCodes from '@src/common/HttpStatusCodes';
import { RouteError } from '@src/common/route-errors';
import { NodeEnvs } from '@src/common/constants';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';


/******************************************************************************
                                Setup
******************************************************************************/

const app = express();


// **** Middleware **** //

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Show routes called in console during development
if (ENV.NodeEnv === NodeEnvs.Dev) {
  app.use(morgan('dev'));
}

// Security
if (ENV.NodeEnv === NodeEnvs.Production) {
  app.use(helmet());
}

// Add APIs, must be after middleware
app.use(Paths.Base, BaseRouter);

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (ENV.NodeEnv !== NodeEnvs.Test.valueOf()) {
    logger.err(err, true);
  }
  let status = HttpStatusCodes.BAD_REQUEST;
  if (err instanceof RouteError) {
    status = err.status;
    res.status(status).json({ error: err.message });
  }
  return next(err);
});


// **** FrontEnd Content **** //

// Set views directory (html)
const viewsDir = path.join(__dirname, 'views');
app.set('views', viewsDir);

// Set static directory (js and css).
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Nav to users pg by default
app.get('/', (_: Request, res: Response) => {
  return res.redirect('/users');
});

// Redirect to login if not logged in.
app.get('/users', (_: Request, res: Response) => {
  return res.sendFile('users.html', { root: viewsDir });
});


/******************************************************************************
                                Export default
******************************************************************************/

// Create HTTP server
const server = http.createServer(app);
console.log('here!!')

// Configure CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};
console.log('here2')

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: corsOptions,
});

// Socket.IO connection handler
console.log('here')

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
export default app;
