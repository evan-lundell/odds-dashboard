import { Event } from '../models/Event.js';
import type { IEvent } from '../types/index.js';

function isSameUtcDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export async function runDailyResets(): Promise<void> {
  const now = new Date();

  const events: (IEvent & { _id: IEvent['_id'] })[] = await Event.find({
    status: 'active',
    dailyReset: true,
  });

  for (const event of events) {
    // Only reset for events that are currently in their scheduled window
    if (now < event.startDate || now > event.endDate) continue;

    // Ensure we only reset once per UTC calendar day
    if (event.lastResetAt && isSameUtcDate(event.lastResetAt, now)) {
      continue;
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

    event.participants = updatedParticipants as IEvent['participants'];
    event.lastResetAt = now;

    await Event.updateOne(
      { _id: event._id },
      {
        $set: {
          participants: updatedParticipants,
          lastResetAt: now,
        },
      },
    );
  }
}

