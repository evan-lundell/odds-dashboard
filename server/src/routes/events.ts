import { Router, type Request, type Response } from 'express';
import { Event } from '../models/Event.js';

const router = Router();

// GET /api/events - list all events
router.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - get single event
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events - create event
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, sportKey, participantNames, startingBalance, allowedTeams } = req.body;

    const balance = startingBalance ?? 1000;
    const participants = (participantNames as string[]).map((pName) => ({
      name: pName.trim(),
      balance,
    }));

    // Clean up team names: trim whitespace, remove empties
    const teams = Array.isArray(allowedTeams)
      ? (allowedTeams as string[]).map((t) => t.trim()).filter(Boolean)
      : [];

    const event = await Event.create({
      name,
      sportKey: sportKey || 'basketball_ncaab',
      participants,
      allowedTeams: teams,
      startingBalance: balance,
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - update event (e.g. add participants)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

export default router;
