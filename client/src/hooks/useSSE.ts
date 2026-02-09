import { useEffect, useRef } from 'react';
import type { Game, Bet, Participant } from '../types';

export interface SSEHandlers {
  onGamesUpdated?: (games: Game[]) => void;
  onScoresUpdated?: (games: Game[]) => void;
  onBetsSettled?: (bets: Bet[], participants: Participant[]) => void;
}

export function useSSE(eventId: string | null, handlers: SSEHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!eventId) return;

    const url = `/api/stream?eventId=${eventId}`;
    const source = new EventSource(url);

    source.addEventListener('games:updated', (e) => {
      try {
        const payload = JSON.parse(e.data);
        handlersRef.current.onGamesUpdated?.(payload.games);
      } catch { /* ignore parse errors */ }
    });

    source.addEventListener('scores:updated', (e) => {
      try {
        const payload = JSON.parse(e.data);
        handlersRef.current.onScoresUpdated?.(payload.games);
      } catch { /* ignore */ }
    });

    source.addEventListener('bets:settled', (e) => {
      try {
        const payload = JSON.parse(e.data);
        handlersRef.current.onBetsSettled?.(payload.bets, payload.participants);
      } catch { /* ignore */ }
    });

    source.onerror = () => {
      // EventSource will automatically reconnect
      console.warn('[SSE] Connection error, will auto-reconnect');
    };

    return () => {
      source.close();
    };
  }, [eventId]);
}
