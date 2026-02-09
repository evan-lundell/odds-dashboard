import type { IGame, IBet, IParticipant } from './index.js';

// ─── SSE Event Payloads ─────────────────────────────────

export interface GamesUpdatedPayload {
  games: IGame[];
}

export interface ScoresUpdatedPayload {
  games: IGame[];
}

export interface BetsSettledPayload {
  bets: IBet[];
  participants: IParticipant[];
}

export interface SSEEventMap {
  'games:updated': GamesUpdatedPayload;
  'scores:updated': ScoresUpdatedPayload;
  'bets:settled': BetsSettledPayload;
}

export type SSEEventType = keyof SSEEventMap;
