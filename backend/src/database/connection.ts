import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    // MongoDB optional - bot MongoDB'siz ham ishlay oladi
    if (!mongoUri) {
      logger.warn('⚠️ MONGODB_URI not set. Running without database. Posts will not be saved.');
      return;
    }
    
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB connected successfully');
    
  } catch (error) {
    logger.warn('⚠️ MongoDB connection failed. Running without database:', error);
    // Don't throw - bot can work without database
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
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
