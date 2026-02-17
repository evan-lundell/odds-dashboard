import axios from 'axios';
import { env } from '../config/env.js';
import { Game } from '../models/Game.js';
import { Bet } from '../models/Bet.js';
import { Event } from '../models/Event.js';
import { eventBus } from './eventBus.js';
import { getMockScoresResponse } from '../mocks/fixtures.js';
import type { OddsApiScoreEvent } from '../types/oddsApi.js';
import type { IGame, IBet, IBetLeg, IParticipant, BetStatus, LegStatus } from '../types/index.js';

const SCORES_BASE_URL = 'https://api.the-odds-api.com/v4/sports';

// ─── Odds helpers ────────────────────────────────────────

/**
 * Convert American odds to decimal multiplier.
 */
function americanToDecimal(price: number): number {
  return price > 0
    ? (price / 100) + 1
    : (100 / Math.abs(price)) + 1;
}

/**
 * Calculate payout for a winning straight bet using American odds.
 */
function calculateStraightPayout(amount: number, price: number): number {
  return Math.round(amount * americanToDecimal(price) * 100) / 100;
}

/**
 * Calculate parlay payout from an array of leg prices (American odds).
 * Pushed legs should be excluded before calling this.
 */
function calculateParlayPayout(amount: number, prices: number[]): number {
  if (prices.length === 0) return amount; // all pushed = return stake
  const combinedDecimal = prices.reduce((acc, p) => acc * americanToDecimal(p), 1);
  return Math.round(amount * combinedDecimal * 100) / 100;
}

// ─── Leg evaluation ──────────────────────────────────────

/**
 * Evaluate a single leg against the final game scores.
 */
function evaluateLeg(
  leg: IBetLeg,
  homeScore: number,
  awayScore: number,
  homeTeam: string,
  awayTeam: string,
): LegStatus {
  const { market, pick } = leg;

  if (market === 'h2h') {
    const winner = homeScore > awayScore ? homeTeam : awayTeam;
    return winner === pick.name ? 'won' : 'lost';
  }

  if (market === 'spreads') {
    const pickScore = pick.name === homeTeam ? homeScore : awayScore;
    const oppScore = pick.name === homeTeam ? awayScore : homeScore;
    const adjustedScore = pickScore + (pick.point ?? 0);

    if (adjustedScore > oppScore) return 'won';
    if (adjustedScore === oppScore) return 'push';
    return 'lost';
  }

  if (market === 'totals') {
    const totalScore = homeScore + awayScore;
    const line = pick.point ?? 0;
    const isOver = pick.name === 'Over';

    if (isOver && totalScore > line) return 'won';
    if (!isOver && totalScore < line) return 'won';
    if (totalScore === line) return 'push';
    return 'lost';
  }

  return 'lost';
}

// ─── Bet settlement ──────────────────────────────────────

/**
 * Determine overall bet status and payout from its legs.
 * Returns null if the bet isn't ready to settle yet (parlay with pending legs).
 */
function settleBet(
  bet: IBet,
): { status: BetStatus; payout: number } | null {
  const legStatuses = bet.legs.map((l) => l.status);

  // If any leg is still pending, can't settle yet
  if (legStatuses.some((s) => s === 'pending')) return null;

  // Any leg lost = whole bet lost
  if (legStatuses.some((s) => s === 'lost')) {
    return { status: 'lost', payout: 0 };
  }

  // All legs pushed = return stake
  if (legStatuses.every((s) => s === 'push')) {
    return { status: 'push', payout: bet.amount };
  }

  // Remaining: mix of won and push
  // For parlays with push reduction: calculate payout using only non-pushed legs
  const activePrices = bet.legs
    .filter((l) => l.status === 'won')
    .map((l) => l.pick.price);

  if (activePrices.length === 0) {
    // Shouldn't happen, but safety net
    return { status: 'push', payout: bet.amount };
  }

  if (bet.type === 'straight') {
    return { status: 'won', payout: calculateStraightPayout(bet.amount, activePrices[0]) };
  }

  // Parlay: multiply all active (non-pushed) leg odds
  return { status: 'won', payout: calculateParlayPayout(bet.amount, activePrices) };
}

// ─── Main sync ───────────────────────────────────────────

export async function syncScores(): Promise<void> {
  try {
    const activeEvents = await Event.find({ status: 'active' });
    if (activeEvents.length === 0) return;

    for (const event of activeEvents) {
      const sportKey = event.sportKey;

      let data: OddsApiScoreEvent[];
      if (env.MOCK_API) {
        data = getMockScoresResponse();
        console.log(`[scores] Mock: generated ${data.length} score events`);
      } else {
        const response = await axios.get<OddsApiScoreEvent[]>(
          `${SCORES_BASE_URL}/${sportKey}/scores`,
          {
            params: {
              apiKey: env.ODDS_API_KEY,
              daysFrom: 3,
            },
          },
        );
        data = response.data;
      }

      const updatedGames: IGame[] = [];
      const settledBets: IBet[] = [];

      for (const scoreEvent of data) {
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

        // Process bets when a game completes
        if (scoreEvent.completed && !wasCompleted && game.scores) {
          // Find all pending bets that have a leg on this game
          const pendingBets = await Bet.find({
            'legs.gameId': game._id,
            status: 'pending',
          });

          for (const bet of pendingBets) {
            // Evaluate legs that match this game
            let changed = false;
            for (const leg of bet.legs) {
              if (leg.gameId.toString() === game._id.toString() && leg.status === 'pending') {
                leg.status = evaluateLeg(
                  leg as IBetLeg,
                  game.scores!.home,
                  game.scores!.away,
                  game.homeTeam,
                  game.awayTeam,
                );
                changed = true;
              }
            }

            if (!changed) continue;

            // Try to settle the overall bet
            const result = settleBet(bet.toObject() as IBet);

            if (result) {
              bet.status = result.status;
              bet.payout = result.payout;
              bet.settledAt = new Date();
              await bet.save();
              settledBets.push(bet.toObject() as IBet);

              // Update participant balance
              if (result.status === 'won' || result.status === 'push') {
                await Event.updateOne(
                  { _id: event._id, 'participants.name': bet.participant },
                  { $inc: { 'participants.$.balance': result.payout } },
                );
              }
            } else {
              // Parlay with some legs still pending - save leg status updates
              await bet.save();
            }
          }
        }
      }

      if (updatedGames.length > 0) {
        eventBus.emit('scores:updated', { games: updatedGames });
      }

      if (settledBets.length > 0) {
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
