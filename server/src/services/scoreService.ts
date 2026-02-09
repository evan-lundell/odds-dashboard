import axios from 'axios';
import { env } from '../config/env.js';
import { Game } from '../models/Game.js';
import { Bet } from '../models/Bet.js';
import { Event } from '../models/Event.js';
import { eventBus } from './eventBus.js';
import type { OddsApiScoreEvent } from '../types/oddsApi.js';
import type { IGame, IBet, IParticipant, BetStatus } from '../types/index.js';

const SCORES_BASE_URL = 'https://api.the-odds-api.com/v4/sports';

/**
 * Calculate payout for a winning bet using American odds.
 * Positive odds: profit = amount * (odds / 100)
 * Negative odds: profit = amount * (100 / |odds|)
 * Returns the total payout (amount + profit).
 */
function calculatePayout(amount: number, price: number): number {
  const profit = price > 0
    ? amount * (price / 100)
    : amount * (100 / Math.abs(price));
  return Math.round((amount + profit) * 100) / 100;
}

/**
 * Evaluate a single bet against the final game scores.
 */
function evaluateBet(
  bet: IBet,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string,
): { status: BetStatus; payout: number } {
  const { market, pick, amount } = bet;

  if (market === 'h2h') {
    // Moneyline: did the picked team win?
    const winner = homeScore > awayScore ? homeTeam : awayTeam;
    if (winner === pick.name) {
      return { status: 'won', payout: calculatePayout(amount, pick.price) };
    }
    return { status: 'lost', payout: 0 };
  }

  if (market === 'spreads') {
    // Spreads: pick.point is the handicap for the picked team
    const pickScore = pick.name === homeTeam ? homeScore : awayScore;
    const oppScore = pick.name === homeTeam ? awayScore : homeScore;
    const adjustedScore = pickScore + (pick.point ?? 0);

    if (adjustedScore > oppScore) {
      return { status: 'won', payout: calculatePayout(amount, pick.price) };
    } else if (adjustedScore === oppScore) {
      return { status: 'push', payout: amount }; // return stake
    }
    return { status: 'lost', payout: 0 };
  }

  if (market === 'totals') {
    // Totals: over/under on combined score
    const totalScore = homeScore + awayScore;
    const line = pick.point ?? 0;
    const isOver = pick.name === 'Over';

    if (isOver && totalScore > line) {
      return { status: 'won', payout: calculatePayout(amount, pick.price) };
    } else if (!isOver && totalScore < line) {
      return { status: 'won', payout: calculatePayout(amount, pick.price) };
    } else if (totalScore === line) {
      return { status: 'push', payout: amount };
    }
    return { status: 'lost', payout: 0 };
  }

  return { status: 'lost', payout: 0 };
}

export async function syncScores(): Promise<void> {
  try {
    const activeEvents = await Event.find({ status: 'active' });
    if (activeEvents.length === 0) return;

    for (const event of activeEvents) {
      const sportKey = event.sportKey;

      const { data } = await axios.get<OddsApiScoreEvent[]>(
        `${SCORES_BASE_URL}/${sportKey}/scores`,
        {
          params: {
            apiKey: env.ODDS_API_KEY,
            daysFrom: 3,
          },
        },
      );

      const updatedGames: IGame[] = [];
      const settledBets: IBet[] = [];

      for (const scoreEvent of data) {
        // Find the matching game in our DB
        const game = await Game.findOne({ apiId: scoreEvent.id, eventId: event._id });
        if (!game) continue;

        // Update scores if available
        if (scoreEvent.scores && scoreEvent.scores.length >= 2) {
          const homeScoreEntry = scoreEvent.scores.find(s => s.name === game.homeTeam);
          const awayScoreEntry = scoreEvent.scores.find(s => s.name === game.awayTeam);

          if (homeScoreEntry && awayScoreEntry) {
            game.scores = {
              home: parseInt(homeScoreEntry.score, 10),
              away: parseInt(awayScoreEntry.score, 10),
            };
          }
        }

        const wasCompleted = game.completed;
        game.completed = scoreEvent.completed;
        await game.save();
        updatedGames.push(game.toObject() as IGame);

        // Settle bets if game just completed
        if (scoreEvent.completed && !wasCompleted && game.scores) {
          const pendingBets = await Bet.find({ gameId: game._id, status: 'pending' });

          for (const bet of pendingBets) {
            const { status, payout } = evaluateBet(
              bet.toObject() as IBet,
              game.scores.home,
              game.scores.away,
              game.homeTeam,
              game.awayTeam,
            );

            bet.status = status;
            bet.payout = payout;
            bet.settledAt = new Date();
            await bet.save();
            settledBets.push(bet.toObject() as IBet);

            // Update participant balance
            if (status === 'won' || status === 'push') {
              await Event.updateOne(
                { _id: event._id, 'participants.name': bet.participant },
                { $inc: { 'participants.$.balance': payout } },
              );
            }
          }
        }
      }

      if (updatedGames.length > 0) {
        eventBus.emit('scores:updated', { games: updatedGames });
      }

      if (settledBets.length > 0) {
        // Fetch updated participants for the SSE payload
        const refreshedEvent = await Event.findById(event._id);
        const participants: IParticipant[] = refreshedEvent?.participants ?? [];
        eventBus.emit('bets:settled', { bets: settledBets, participants });
      }
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(`[scores] API error: ${err.response?.status} ${err.response?.statusText}`);
    } else {
      console.error('[scores] Sync error:', err);
    }
  }
}
