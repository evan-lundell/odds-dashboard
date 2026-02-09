import { useState, useEffect, useCallback } from 'react';
import type { Game } from '../types';
import { fetchGames } from '../lib/api';

export function useGames(eventId: string | null) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) { setGames([]); return; }
    setLoading(true);
    try {
      const data = await fetchGames(eventId);
      setGames(data);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  return { games, setGames, loading, reload: load };
}
