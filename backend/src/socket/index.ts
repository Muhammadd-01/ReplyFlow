import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export interface ServerToClientEvents {
  campaignUpdate: (data: any) => void;
  messageStatus: (data: any) => void;
}

export interface ClientToServerEvents {
  subscribeCampaign: (campaignId: string) => void;
  unsubscribeCampaign: (campaignId: string) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
}

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    const userId = socket.data.userId;
    logger.info(`Socket connected for user: ${userId}`);

    // Join user specific room
    socket.join(`user:${userId}`);

    socket.on('subscribeCampaign', (campaignId: string) => {
      socket.join(`campaign:${campaignId}`);
      logger.info(`User ${userId} subscribed to campaign ${campaignId}`);
    });

    socket.on('unsubscribeCampaign', (campaignId: string) => {
      socket.leave(`campaign:${campaignId}`);
      logger.info(`User ${userId} unsubscribed from campaign ${campaignId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected for user: ${userId}`);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
