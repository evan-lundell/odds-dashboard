import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/odds-dashboard',
  ODDS_API_KEY: process.env.ODDS_API_KEY || '',
  ODDS_POLL_INTERVAL_MS: parseInt(process.env.ODDS_POLL_INTERVAL_MS || '30000', 10),
} as const;
