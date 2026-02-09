import cron from 'node-cron';
import { env } from '../config/env.js';
import { syncOdds } from './oddsService.js';
import { syncScores } from './scoreService.js';

let oddsTask: cron.ScheduledTask | null = null;
let scoresTask: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  const intervalSec = Math.max(Math.round(env.ODDS_POLL_INTERVAL_MS / 1000), 10);

  // node-cron doesn't support sub-minute intervals directly,
  // so we use a per-second cron expression with a modulus check
  // for intervals that aren't exactly on cron boundaries.
  // For 30s, we can use "*/30 * * * * *" (every 30 seconds).
  const cronExpr = `*/${intervalSec} * * * * *`;

  console.log(`[scheduler] Starting odds sync every ${intervalSec}s`);
  console.log(`[scheduler] Starting scores sync every ${intervalSec}s`);

  oddsTask = cron.schedule(cronExpr, async () => {
    console.log(`[scheduler] Running odds sync at ${new Date().toISOString()}`);
    await syncOdds();
  });

  scoresTask = cron.schedule(cronExpr, async () => {
    console.log(`[scheduler] Running scores sync at ${new Date().toISOString()}`);
    await syncScores();
  });
}

export function stopScheduler(): void {
  oddsTask?.stop();
  scoresTask?.stop();
  console.log('[scheduler] Stopped');
}
