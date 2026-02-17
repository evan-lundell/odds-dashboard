import mongoose, { Schema, type Document } from 'mongoose';
import type { IEvent, IParticipant } from '../types/index.js';

export type EventDocument = IEvent & Document;

const participantSchema = new Schema<IParticipant>(
  {
    name: { type: String, required: true },
    balance: { type: Number, required: true },
  },
  { _id: false },
);

const eventSchema = new Schema<EventDocument>(
  {
    name: { type: String, required: true },
    sportKey: { type: String, required: true, default: 'basketball_ncaab' },
    participants: { type: [participantSchema], default: [] },
    allowedTeams: { type: [String], default: [] },
    startingBalance: { type: Number, required: true, default: 1000 },
    maxParlayLegs: { type: Number, required: true, default: 4 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true },
);

export const Event = mongoose.model<EventDocument>('Event', eventSchema);
