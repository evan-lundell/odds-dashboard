import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { startScheduler } from './services/scheduler.js';
import eventsRouter from './routes/events.js';
import gamesRouter from './routes/games.js';
import betsRouter from './routes/bets.js';
import streamRouter from './routes/stream.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/games', gamesRouter);
app.use('/api/bets', betsRouter);
app.use('/api/stream', streamRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start
async function main() {
  await connectDB();

  if (env.ODDS_API_KEY) {
    startScheduler();
  } else {
    console.warn('[server] ODDS_API_KEY not set — scheduler disabled. Set it in .env to enable odds syncing.');
  }

  app.listen(env.PORT, () => {
    console.log(`[server] Running on http://localhost:${env.PORT}`);
  });
}

main().catch(console.error);
