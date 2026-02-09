import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`[db] Connected to MongoDB at ${env.MONGODB_URI}`);
  } catch (err) {
    console.error('[db] MongoDB connection error:', err);
    process.exit(1);
  }
}
