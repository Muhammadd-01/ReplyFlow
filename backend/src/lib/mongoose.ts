import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from './logger.js';

mongoose.plugin((schema) => {
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      delete (ret as any)._id;
      delete (ret as any).__v;
    }
  });
});

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.DATABASE_URL);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err}`);
});
