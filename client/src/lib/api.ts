import axios from 'axios';
import type { BettingEvent, Game, Bet, LeaderboardEntry, MarketType, Pick } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// ─── Events ──────────────────────────────────────────────

export async function fetchEvents(): Promise<BettingEvent[]> {
  const { data } = await api.get<BettingEvent[]>('/events');
  return data;
}

export async function fetchEvent(id: string): Promise<BettingEvent> {
  const { data } = await api.get<BettingEvent>(`/events/${id}`);
  return data;
}

export async function createEvent(body: {
  name: string;
  sportKey?: string;
  participantNames: string[];
  startingBalance?: number;
}): Promise<BettingEvent> {
  const { data } = await api.post<BettingEvent>('/events', body);
  return data;
}

// ─── Games ───────────────────────────────────────────────

export async function fetchGames(eventId: string): Promise<Game[]> {
  const { data } = await api.get<Game[]>('/games', { params: { eventId } });
  return data;
}

export async function triggerSync(): Promise<void> {
  await api.post('/games/sync');
}

// ─── Bets ────────────────────────────────────────────────

export async function fetchBets(params: {
  eventId: string;
  status?: string;
  participant?: string;
  sort?: string;
}): Promise<Bet[]> {
  const { data } = await api.get<Bet[]>('/bets', { params });
  return data;
}

export async function fetchLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<LeaderboardEntry[]>('/bets/leaderboard', {
    params: { eventId },
  });
  return data;
}

export async function placeBet(body: {
  eventId: string;
  gameId: string;
  participant: string;
  market: MarketType;
  pick: Pick;
  bookmaker: string;
  amount: number;
}): Promise<Bet> {
  const { data } = await api.post<Bet>('/bets', body);
  return data;
}
