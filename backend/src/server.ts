import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { logger } from './lib/logger.js';

import mongoose from 'mongoose';
import { redis } from './config/redis.js';
import { connectDB } from './lib/mongoose.js';

import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import importRoutes from './routes/import.routes.js';
import contactRoutes from './routes/contact.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import chatRoutes from './routes/chat.routes.js';
import inboxRoutes from './routes/inbox.routes.js';
import exportRoutes from './routes/export.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import WhatsAppSession from './models/WhatsAppSession.js';
import { whatsappService } from './whatsapp/service.js';
import { initializeSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/import', importRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling
app.use(errorHandler);

// Socket.IO
initializeSocket(httpServer);

const PORT = env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  
  // Auto-restore connected WhatsApp sessions
  setTimeout(async () => {
    try {
      const sessions = await WhatsAppSession.find({ status: { $in: ['CONNECTED', 'CONNECTING'] } });
      for (const s of sessions) {
        logger.info(`Re-initializing WhatsApp session ${s._id}...`);
        whatsappService.startSession(s._id.toString(), s.userId.toString()).catch(console.error);
      }
    } catch (err) {
      logger.error('Failed to auto-restore sessions:', err);
    }
  }, 2000); // slight delay to ensure DB is fully ready
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server gracefully...');
  httpServer.close();
  await mongoose.disconnect();
  redis.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
