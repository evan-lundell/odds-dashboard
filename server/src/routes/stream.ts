import { Router, type Request, type Response } from 'express';
import { eventBus } from '../services/eventBus.js';
import type { SSEEventType, SSEEventMap } from '../types/sse.js';

const router = Router();

// GET /api/stream?eventId=X - SSE endpoint
router.get('/', (req: Request, res: Response) => {
  const { eventId } = req.query;
  if (!eventId) {
    res.status(400).json({ error: 'eventId query param is required' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Send initial keepalive
  res.write(':ok\n\n');

  // Helper to write SSE messages
  function send<K extends SSEEventType>(eventType: K, data: SSEEventMap[K]) {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  // Register listeners for all event types
  const handlers = {
    'games:updated': (payload: SSEEventMap['games:updated']) => {
      send('games:updated', payload);
    },
    'scores:updated': (payload: SSEEventMap['scores:updated']) => {
      send('scores:updated', payload);
    },
    'bets:settled': (payload: SSEEventMap['bets:settled']) => {
      send('bets:settled', payload);
    },
    'bets:placed': (payload: SSEEventMap['bets:placed']) => {
      send('bets:placed', payload);
    },
  } as const;

  // Subscribe
  for (const [event, handler] of Object.entries(handlers)) {
    eventBus.on(event as SSEEventType, handler as (payload: SSEEventMap[SSEEventType]) => void);
  }

  // Keepalive every 15s to prevent connection timeout
  const keepalive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 15000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(keepalive);
    for (const [event, handler] of Object.entries(handlers)) {
      eventBus.off(event as SSEEventType, handler as (payload: SSEEventMap[SSEEventType]) => void);
    }
  });
});

export default router;
