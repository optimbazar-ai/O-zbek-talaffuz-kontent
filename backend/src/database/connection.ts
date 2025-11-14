import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/uzbek-content';
    
    await mongoose.connect(mongoUri);
    
    logger.info('✅ MongoDB connected successfully');
    
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB disconnected');
  } catch (error) {
    logger.error('❌ MongoDB disconnection error:', error);
    throw error;
  }
}
