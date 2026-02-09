import mongoose, { Schema, type Document } from 'mongoose';
import type { IBet } from '../types/index.js';

export type BetDocument = IBet & Document;

const pickSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    point: { type: Number },
  },
  { _id: false },
);

const betSchema = new Schema<BetDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    participant: { type: String, required: true },
    market: { type: String, enum: ['h2h', 'spreads', 'totals'], required: true },
    pick: { type: pickSchema, required: true },
    bookmaker: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    payout: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['pending', 'won', 'lost', 'push'], default: 'pending' },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

betSchema.index({ eventId: 1, status: 1 });
betSchema.index({ gameId: 1, status: 1 });
betSchema.index({ eventId: 1, participant: 1 });

export const Bet = mongoose.model<BetDocument>('Bet', betSchema);
