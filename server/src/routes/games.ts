import { Router, type Request, type Response } from 'express';
import { Game } from '../models/Game.js';
import { syncOdds } from '../services/oddsService.js';

const router = Router();

// GET /api/games?eventId=X - list games for an event
router.get('/', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      res.status(400).json({ error: 'eventId query param is required' });
      return;
    }

    const games = await Game.find({ eventId })
      .sort({ commenceTime: 1 });

    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// POST /api/games/sync - manually trigger odds sync
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    await syncOdds();
    res.json({ message: 'Odds sync completed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync odds' });
  }
});

export default router;
