import { Router, type Request, type Response } from 'express';
import { Bet } from '../models/Bet.js';
import { Event } from '../models/Event.js';
import { Game } from '../models/Game.js';
import type { MarketType } from '../types/index.js';

const router = Router();

// GET /api/bets?eventId=X&status=pending|won|lost|push&participant=Y&sort=-settledAt
router.get('/', async (req: Request, res: Response) => {
  try {
    const { eventId, status, participant, sort } = req.query;
    if (!eventId) {
      res.status(400).json({ error: 'eventId query param is required' });
      return;
    }

    const filter: Record<string, unknown> = { eventId };
    if (status) {
      // Support "settled" as a convenience alias for won|lost|push
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

    const bets = await Bet.find(filter).sort(sortObj).populate('gameId');
    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

// GET /api/bets/leaderboard?eventId=X
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

    // Build leaderboard from participants + bet records
    const leaderboard = await Promise.all(
      event.participants.map(async (p) => {
        const [wins, losses, pushes, pending] = await Promise.all([
          Bet.countDocuments({ eventId, participant: p.name, status: 'won' }),
          Bet.countDocuments({ eventId, participant: p.name, status: 'lost' }),
          Bet.countDocuments({ eventId, participant: p.name, status: 'push' }),
          Bet.countDocuments({ eventId, participant: p.name, status: 'pending' }),
        ]);

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

    leaderboard.sort((a, b) => b.balance - a.balance);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/bets - place a bet
router.post('/', async (req: Request, res: Response) => {
  try {
    const { eventId, gameId, participant, market, pick, bookmaker, amount } = req.body;

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

    // Validate game exists and hasn't started/completed
    const game = await Game.findById(gameId);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (game.completed) {
      res.status(400).json({ error: 'Game is already completed' });
      return;
    }

    // Validate balance
    if (participantEntry.balance < amount) {
      res.status(400).json({
        error: `Insufficient balance. ${participant} has $${participantEntry.balance}, bet is $${amount}`,
      });
      return;
    }

    // Calculate potential payout
    const price = pick.price;
    const profit = price > 0
      ? amount * (price / 100)
      : amount * (100 / Math.abs(price));
    const payout = Math.round((amount + profit) * 100) / 100;

    // Create bet
    const bet = await Bet.create({
      eventId,
      gameId,
      participant,
      market: market as MarketType,
      pick,
      bookmaker,
      amount,
      payout,
    });

    // Deduct from participant balance
    await Event.updateOne(
      { _id: eventId, 'participants.name': participant },
      { $inc: { 'participants.$.balance': -amount } },
    );

    res.status(201).json(bet);
  } catch (err) {
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

export default router;
