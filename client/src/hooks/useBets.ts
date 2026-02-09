import { useState, useEffect, useCallback } from 'react';
import type { Bet, LeaderboardEntry } from '../types';
import { fetchBets, fetchLeaderboard } from '../lib/api';

export function useBets(eventId: string | null, status?: string) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) { setBets([]); return; }
    setLoading(true);
    try {
      const sort = status === 'settled' ? '-settledAt' : '-createdAt';
      const data = await fetchBets({ eventId, status, sort });
      setBets(data);
    } catch (err) {
      console.error('Failed to fetch bets:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, status]);

  useEffect(() => { load(); }, [load]);

  return { bets, setBets, loading, reload: load };
}

export function useLeaderboard(eventId: string | null) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) { setLeaderboard([]); return; }
    setLoading(true);
    try {
      const data = await fetchLeaderboard(eventId);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  return { leaderboard, setLeaderboard, loading, reload: load };
}
