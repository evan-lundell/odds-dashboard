import { Router, type Request, type Response } from 'express';
import { Bet } from '../models/Bet.js';
import { Event } from '../models/Event.js';
import { Game } from '../models/Game.js';
import { eventBus } from '../services/eventBus.js';
import type { MarketType, BetType } from '../types/index.js';

const router = Router();

// ─── Odds helpers ────────────────────────────────────────

function americanToDecimal(price: number): number {
  return price > 0
    ? (price / 100) + 1
    : (100 / Math.abs(price)) + 1;
}

function calculatePayout(amount: number, prices: number[]): number {
  const combinedDecimal = prices.reduce((acc, p) => acc * americanToDecimal(p), 1);
  return Math.round(amount * combinedDecimal * 100) / 100;
}

// ─── GET /api/bets ───────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const { eventId, status, participant, sort } = req.query;
    if (!eventId) {
      res.status(400).json({ error: 'eventId query param is required' });
      return;
    }

    const filter: Record<string, unknown> = { eventId };
    if (status) {
      if (status === 'settled') {
        filter.status = { $in: ['won', 'lost', 'push'] };
      } else {
        filter.status = status;
      }
    }
    if (participant) {
      filter.participant = participant;
    }

    const sortObj: Record<string, 1 | -1> = {};
    if (typeof sort === 'string' && sort.startsWith('-')) {
      sortObj[sort.slice(1)] = -1;
    } else if (typeof sort === 'string') {
      sortObj[sort] = 1;
    } else {
      sortObj.createdAt = -1;
    }

    const bets = await Bet.find(filter).sort(sortObj).populate('legs.gameId');
    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

// ─── GET /api/bets/leaderboard ───────────────────────────

router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      res.status(400).json({ error: 'eventId query param is required' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const isDailyReset = event.dailyReset ?? false;

    const leaderboard = await Promise.all(
      event.participants.map(async (p) => {
        const [wins, losses, pushes, pending] = await Promise.all([
          Bet.countDocuments({ eventId, participant: p.name, status: 'won' }),
          Bet.countDocuments({ eventId, participant: p.name, status: 'lost' }),
          Bet.countDocuments({ eventId, participant: p.name, status: 'push' }),
          Bet.countDocuments({ eventId, participant: p.name, status: 'pending' }),
        ]);

        if (isDailyReset) {
          const runningTotal = (p as any).runningTotal ?? 0;
          const dailyBalance = p.balance;
          // Net P/L for daily-reset events: historical running total
          // plus current daily balance minus the original starting stack.
          const netProfit = runningTotal + dailyBalance - event.startingBalance;

          return {
            name: p.name,
            balance: p.balance,
            dailyBalance,
            runningTotal,
            startingBalance: event.startingBalance,
            netProfit,
            wins,
            losses,
            pushes,
            pending,
          };
        }

        return {
          name: p.name,
          balance: p.balance,
          startingBalance: event.startingBalance,
          netProfit: p.balance - event.startingBalance,
          wins,
          losses,
          pushes,
          pending,
        };
      }),
    );

    if (isDailyReset) {
      leaderboard.sort((a, b) => (b.runningTotal ?? 0) - (a.runningTotal ?? 0));
    } else {
      leaderboard.sort((a, b) => b.balance - a.balance);
    }
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ─── POST /api/bets ──────────────────────────────────────

interface LegInput {
  gameId: string;
  market: MarketType;
  pick: { name: string; price: number; point?: number };
  bookmaker: string;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { eventId, participant, amount, legs } = req.body as {
      eventId: string;
      participant: string;
      amount: number;
      legs: LegInput[];
    };

    // Basic validation
    if (!eventId || !participant || !amount || !legs || legs.length === 0) {
      res.status(400).json({ error: 'eventId, participant, amount, and legs are required' });
      return;
    }

    // Validate event + participant
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const participantEntry = event.participants.find((p) => p.name === participant);
    if (!participantEntry) {
      res.status(400).json({ error: `Participant "${participant}" not found in event` });
      return;
    }

    // Determine bet type
    const betType: BetType = legs.length === 1 ? 'straight' : 'parlay';

    // Validate parlay constraints
    if (betType === 'parlay' && legs.length > event.maxParlayLegs) {
      res.status(400).json({
        error: `Parlay exceeds maximum of ${event.maxParlayLegs} legs`,
      });
      return;
    }

    // Validate no duplicate game + market combinations
    const seen = new Set<string>();
    for (const leg of legs) {
      const key = `${leg.gameId}:${leg.market}`;
      if (seen.has(key)) {
        res.status(400).json({
          error: 'Cannot have multiple picks on the same market for the same game',
        });
        return;
      }
      seen.add(key);
    }

    // Validate all games exist and are not completed
    for (const leg of legs) {
      const game = await Game.findById(leg.gameId);
      if (!game) {
        res.status(404).json({ error: `Game ${leg.gameId} not found` });
        return;
      }
      if (game.completed) {
        res.status(400).json({ error: `Game ${game.homeTeam} vs ${game.awayTeam} is already completed` });
        return;
      }
    }

    // Validate balance
    if (participantEntry.balance < amount) {
      res.status(400).json({
        error: `Insufficient balance. ${participant} has $${participantEntry.balance}, bet is $${amount}`,
      });
      return;
    }

    // Calculate potential payout
    const prices = legs.map((l) => l.pick.price);
    const payout = calculatePayout(amount, prices);

    // Create bet with legs
    const bet = await Bet.create({
      eventId,
      type: betType,
      legs: legs.map((l) => ({
        gameId: l.gameId,
        market: l.market,
        pick: l.pick,
        bookmaker: l.bookmaker,
        status: 'pending',
      })),
      participant,
      amount,
      payout,
    });

    // Deduct from participant balance
    await Event.updateOne(
      { _id: eventId, 'participants.name': participant },
      { $inc: { 'participants.$.balance': -amount } },
    );

    // Populate legs.gameId before returning
    await bet.populate('legs.gameId');

    // Broadcast to SSE clients
    eventBus.emit('bets:placed', { bet: bet.toObject() });

    res.status(201).json(bet);
  } catch (err) {
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

export default router;
