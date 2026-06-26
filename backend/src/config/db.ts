import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error('[DB] MongoDB connection error:', err);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] MongoDB reconnected');
  });
}
