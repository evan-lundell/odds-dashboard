import { Event, type EventDocument } from '../models/Event.js';
import { env } from '../config/env.js';

/** In mock mode, treat this many ms as one "day" for simulation. */
const SIMULATED_DAY_MS = 3 * 60 * 1000;

function isSameUtcDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export async function runDailyResets(): Promise<void> {
  const now = new Date();

  const events: EventDocument[] = await Event.find({
    status: 'active',
    dailyReset: true,
  });

  for (const event of events) {
    // Only reset for events that are currently in their scheduled window
    if (now < event.startDate || now > event.endDate) continue;

    if (env.MOCK_API) {
      // Simulation: run reset at most once per simulated "day" (e.g. every 3 minutes)
      if (
        event.lastResetAt &&
        now.getTime() - event.lastResetAt.getTime() < SIMULATED_DAY_MS
      ) {
        continue;
      }
    } else {
      // Production: ensure we only reset once per UTC calendar day
      if (event.lastResetAt && isSameUtcDate(event.lastResetAt, now)) {
        continue;
      }
    }

    let changed = false;

    const updatedParticipants = event.participants.map((p) => {
      const runningTotal = (p.runningTotal ?? 0) + p.balance;
      const balance = event.startingBalance;
      changed = true;
      return {
        ...p,
        runningTotal,
        balance,
      };
    });

    if (!changed) continue;
    event.participants = updatedParticipants;
    event.lastResetAt = now;

    if (env.MOCK_API) {
      console.log(`[dailyReset] Simulated daily reset for event "${event.name}"`);
    }

    // Persist updated participants + lastResetAt via the document instance
    await event.save();
  }
}

