import mongoose, { Schema, type Document } from 'mongoose';
import type { IGame } from '../types/index.js';

export type GameDocument = IGame & Document;

const outcomeSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    point: { type: Number },
  },
  { _id: false },
);

const marketSchema = new Schema(
  {
    key: { type: String, required: true },
    last_update: { type: String },
    outcomes: { type: [outcomeSchema], default: [] },
  },
  { _id: false },
);

const bookmakerSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    last_update: { type: String },
    markets: { type: [marketSchema], default: [] },
  },
  { _id: false },
);

const gameSchema = new Schema<GameDocument>(
  {
    apiId: { type: String, required: true, unique: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    sportKey: { type: String, required: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    commenceTime: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    scores: {
      type: new Schema({ home: Number, away: Number }, { _id: false }),
      default: null,
    },
    bookmakers: { type: [bookmakerSchema], default: [] },
    lastOddsUpdate: { type: Date, default: null },
  },
  { timestamps: true },
);

gameSchema.index({ eventId: 1, commenceTime: 1 });
gameSchema.index({ apiId: 1, eventId: 1 });

export const Game = mongoose.model<GameDocument>('Game', gameSchema);
