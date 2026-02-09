import axios from 'axios';
import { env } from '../config/env.js';
import { Game } from '../models/Game.js';
import { Event } from '../models/Event.js';
import { eventBus } from './eventBus.js';
import type { OddsApiEvent } from '../types/oddsApi.js';
import type { IGame } from '../types/index.js';

const ODDS_BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export async function syncOdds(): Promise<void> {
  try {
    // Find all active events
    const activeEvents = await Event.find({ status: 'active' });
    if (activeEvents.length === 0) return;

    for (const event of activeEvents) {
      const sportKey = event.sportKey;

      const { data, headers } = await axios.get<OddsApiEvent[]>(
        `${ODDS_BASE_URL}/${sportKey}/odds`,
        {
          params: {
            apiKey: env.ODDS_API_KEY,
            regions: 'us',
            markets: 'h2h,spreads,totals',
            oddsFormat: 'american',
          },
        },
      );

      console.log(
        `[odds] Fetched ${data.length} events for ${sportKey} | ` +
        `Remaining: ${headers['x-requests-remaining']} | ` +
        `Used: ${headers['x-requests-used']}`,
      );

      const updatedGames: IGame[] = [];

      for (const apiEvent of data) {
        const game = await Game.findOneAndUpdate(
          { apiId: apiEvent.id, eventId: event._id },
          {
            $set: {
              sportKey: apiEvent.sport_key,
              homeTeam: apiEvent.home_team,
              awayTeam: apiEvent.away_team,
              commenceTime: new Date(apiEvent.commence_time),
              bookmakers: apiEvent.bookmakers,
              lastOddsUpdate: new Date(),
            },
            $setOnInsert: {
              apiId: apiEvent.id,
              eventId: event._id,
              completed: false,
              scores: null,
            },
          },
          { upsert: true, new: true },
        );
        updatedGames.push(game.toObject() as IGame);
      }

      if (updatedGames.length > 0) {
        eventBus.emit('games:updated', { games: updatedGames });
      }
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(`[odds] API error: ${err.response?.status} ${err.response?.statusText}`);
    } else {
      console.error('[odds] Sync error:', err);
    }
  }
}
