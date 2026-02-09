// ─── Event ───────────────────────────────────────────────

export interface Participant {
  name: string;
  balance: number;
}

export interface BettingEvent {
  _id: string;
  name: string;
  sportKey: string;
  participants: Participant[];
  allowedTeams: string[];
  startingBalance: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// ─── Game ────────────────────────────────────────────────

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface GameScores {
  home: number;
  away: number;
}

export interface Game {
  _id: string;
  apiId: string;
  eventId: string;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  completed: boolean;
  scores: GameScores | null;
  bookmakers: Bookmaker[];
  lastOddsUpdate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Bet ─────────────────────────────────────────────────

export type MarketType = 'h2h' | 'spreads' | 'totals';
export type BetStatus = 'pending' | 'won' | 'lost' | 'push';

export interface Pick {
  name: string;
  price: number;
  point?: number;
}

export interface Bet {
  _id: string;
  eventId: string;
  gameId: string | Game; // populated or just ID
  participant: string;
  market: MarketType;
  pick: Pick;
  bookmaker: string;
  amount: number;
  payout: number;
  status: BetStatus;
  settledAt: string | null;
  createdAt: string;
}

// ─── Leaderboard ─────────────────────────────────────────

export interface LeaderboardEntry {
  name: string;
  balance: number;
  startingBalance: number;
  netProfit: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
}

// ─── SSE Events ──────────────────────────────────────────

export interface GamesUpdatedPayload {
  games: Game[];
}

export interface ScoresUpdatedPayload {
  games: Game[];
}

export interface BetsSettledPayload {
  bets: Bet[];
  participants: Participant[];
}
