import { Types } from 'mongoose';

// ─── Event ───────────────────────────────────────────────

export interface IParticipant {
  name: string;
  balance: number;
}

export interface IEvent {
  _id: Types.ObjectId;
  name: string;
  sportKey: string;
  participants: IParticipant[];
  allowedTeams: string[];
  startingBalance: number;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// ─── Game ────────────────────────────────────────────────

export interface IOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface IMarket {
  key: string;
  last_update: string;
  outcomes: IOutcome[];
}

export interface IBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: IMarket[];
}

export interface IGameScores {
  home: number;
  away: number;
}

export interface IGame {
  _id: Types.ObjectId;
  apiId: string;
  eventId: Types.ObjectId;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: Date;
  completed: boolean;
  scores: IGameScores | null;
  bookmakers: IBookmaker[];
  lastOddsUpdate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Bet ─────────────────────────────────────────────────

export type MarketType = 'h2h' | 'spreads' | 'totals';
export type BetStatus = 'pending' | 'won' | 'lost' | 'push';

export interface IPick {
  name: string;
  price: number;
  point?: number;
}

export interface IBet {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  gameId: Types.ObjectId;
  participant: string;
  market: MarketType;
  pick: IPick;
  bookmaker: string;
  amount: number;
  payout: number;
  status: BetStatus;
  settledAt: Date | null;
  createdAt: Date;
}
