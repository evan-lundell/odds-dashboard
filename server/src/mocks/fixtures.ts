import type { OddsApiEvent, OddsApiScoreEvent } from '../types/oddsApi.js';

// ─── Realistic NCAAB March Madness matchups ──────────────

interface MockGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  /** Minutes after server start when the game goes "live" */
  liveAfterMin: number;
  /** Minutes after server start when the game "completes" */
  completeAfterMin: number;
  /** Final scores [home, away] */
  finalScore: [number, number];
  /** Base odds: [homeML, awayML, spread, totalLine] */
  baseOdds: {
    homeML: number;
    awayML: number;
    spread: number;
    totalLine: number;
  };
}

export const MOCK_GAMES: MockGame[] = [
  {
    id: 'mock-game-001',
    homeTeam: 'Duke Blue Devils',
    awayTeam: 'Texas Tech Red Raiders',
    liveAfterMin: 1,
    completeAfterMin: 4,
    finalScore: [78, 72],
    baseOdds: { homeML: -180, awayML: 155, spread: -3.5, totalLine: 142.5 },
  },
  {
    id: 'mock-game-002',
    homeTeam: 'Gonzaga Bulldogs',
    awayTeam: 'Memphis Tigers',
    liveAfterMin: 1,
    completeAfterMin: 5,
    finalScore: [84, 81],
    baseOdds: { homeML: -220, awayML: 185, spread: -5.5, totalLine: 155.5 },
  },
  {
    id: 'mock-game-003',
    homeTeam: 'Kansas Jayhawks',
    awayTeam: 'Villanova Wildcats',
    liveAfterMin: 3,
    completeAfterMin: 7,
    finalScore: [69, 74],
    baseOdds: { homeML: -145, awayML: 125, spread: -2.5, totalLine: 138.5 },
  },
  {
    id: 'mock-game-004',
    homeTeam: 'UConn Huskies',
    awayTeam: 'Tennessee Volunteers',
    liveAfterMin: 5,
    completeAfterMin: 9,
    finalScore: [82, 75],
    baseOdds: { homeML: -160, awayML: 140, spread: -3, totalLine: 147.5 },
  },
  {
    id: 'mock-game-005',
    homeTeam: 'Purdue Boilermakers',
    awayTeam: 'Marquette Golden Eagles',
    liveAfterMin: 6,
    completeAfterMin: 10,
    finalScore: [71, 68],
    baseOdds: { homeML: -135, awayML: 115, spread: -2, totalLine: 135.5 },
  },
  {
    id: 'mock-game-006',
    homeTeam: 'North Carolina Tar Heels',
    awayTeam: 'UCLA Bruins',
    liveAfterMin: 8,
    completeAfterMin: 13,
    finalScore: [88, 85],
    baseOdds: { homeML: -150, awayML: 130, spread: -2.5, totalLine: 158.5 },
  },
  {
    id: 'mock-game-007',
    homeTeam: 'Houston Cougars',
    awayTeam: 'Alabama Crimson Tide',
    liveAfterMin: 10,
    completeAfterMin: 15,
    finalScore: [65, 70],
    baseOdds: { homeML: 110, awayML: -130, spread: 1.5, totalLine: 132.5 },
  },
  {
    id: 'mock-game-008',
    homeTeam: 'Kentucky Wildcats',
    awayTeam: 'Arizona Wildcats',
    liveAfterMin: 12,
    completeAfterMin: 18,
    finalScore: [77, 73],
    baseOdds: { homeML: -125, awayML: 105, spread: -1.5, totalLine: 145.5 },
  },
];

// ─── Time tracking ───────────────────────────────────────

const serverStartTime = Date.now();

function minutesSinceStart(): number {
  return (Date.now() - serverStartTime) / 60000;
}

// ─── Odds jitter ─────────────────────────────────────────

function jitter(base: number, maxShift = 8): number {
  const shift = Math.round((Math.random() - 0.5) * 2 * maxShift);
  // Keep the sign consistent for moneylines (don't flip favorite/underdog)
  if (base > 0 && base + shift <= 0) return base;
  if (base < 0 && base + shift >= 0) return base;
  return base + shift;
}

function spreadJitter(base: number): number {
  const shifts = [-0.5, 0, 0, 0, 0.5];
  return base + shifts[Math.floor(Math.random() * shifts.length)];
}

function totalJitter(base: number): number {
  const shifts = [-1, -0.5, 0, 0, 0.5, 1];
  return base + shifts[Math.floor(Math.random() * shifts.length)];
}

// ─── Simulated in-game scores ────────────────────────────

function simulateScore(game: MockGame): [number, number] | null {
  const elapsed = minutesSinceStart();
  if (elapsed < game.liveAfterMin) return null;

  const gameDuration = game.completeAfterMin - game.liveAfterMin;
  const gameElapsed = elapsed - game.liveAfterMin;
  const progress = Math.min(gameElapsed / gameDuration, 1);

  // Linearly interpolate toward final score with some noise
  const home = Math.round(game.finalScore[0] * progress + (Math.random() - 0.5) * 3);
  const away = Math.round(game.finalScore[1] * progress + (Math.random() - 0.5) * 3);

  // If completed, use exact final scores
  if (elapsed >= game.completeAfterMin) {
    return game.finalScore;
  }

  return [Math.max(0, home), Math.max(0, away)];
}

// ─── Generate mock API responses ─────────────────────────

export function getMockOddsResponse(): OddsApiEvent[] {
  const now = new Date();

  return MOCK_GAMES.map((game) => {
    const commenceTime = new Date(serverStartTime + game.liveAfterMin * 60000);
    const hML = jitter(game.baseOdds.homeML);
    const aML = jitter(game.baseOdds.awayML);
    const spr = spreadJitter(game.baseOdds.spread);
    const tot = totalJitter(game.baseOdds.totalLine);

    return {
      id: game.id,
      sport_key: 'basketball_ncaab',
      sport_title: 'NCAAB',
      commence_time: commenceTime.toISOString(),
      home_team: game.homeTeam,
      away_team: game.awayTeam,
      bookmakers: [
        {
          key: 'fanduel',
          title: 'FanDuel',
          last_update: now.toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: now.toISOString(),
              outcomes: [
                { name: game.homeTeam, price: hML },
                { name: game.awayTeam, price: aML },
              ],
            },
            {
              key: 'spreads',
              last_update: now.toISOString(),
              outcomes: [
                { name: game.homeTeam, price: -110, point: spr },
                { name: game.awayTeam, price: -110, point: -spr },
              ],
            },
            {
              key: 'totals',
              last_update: now.toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: tot },
                { name: 'Under', price: -110, point: tot },
              ],
            },
          ],
        },
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: now.toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: now.toISOString(),
              outcomes: [
                { name: game.homeTeam, price: jitter(hML, 5) },
                { name: game.awayTeam, price: jitter(aML, 5) },
              ],
            },
            {
              key: 'spreads',
              last_update: now.toISOString(),
              outcomes: [
                { name: game.homeTeam, price: jitter(-110, 3), point: spr },
                { name: game.awayTeam, price: jitter(-110, 3), point: -spr },
              ],
            },
            {
              key: 'totals',
              last_update: now.toISOString(),
              outcomes: [
                { name: 'Over', price: jitter(-110, 3), point: tot },
                { name: 'Under', price: jitter(-110, 3), point: tot },
              ],
            },
          ],
        },
      ],
    };
  });
}

export function getMockScoresResponse(): OddsApiScoreEvent[] {
  const elapsed = minutesSinceStart();

  return MOCK_GAMES.map((game) => {
    const commenceTime = new Date(serverStartTime + game.liveAfterMin * 60000);
    const isLive = elapsed >= game.liveAfterMin;
    const isCompleted = elapsed >= game.completeAfterMin;
    const scores = simulateScore(game);

    return {
      id: game.id,
      sport_key: 'basketball_ncaab',
      sport_title: 'NCAAB',
      commence_time: commenceTime.toISOString(),
      completed: isCompleted,
      home_team: game.homeTeam,
      away_team: game.awayTeam,
      scores: scores
        ? [
            { name: game.homeTeam, score: String(scores[0]) },
            { name: game.awayTeam, score: String(scores[1]) },
          ]
        : null,
      last_update: isLive ? new Date().toISOString() : null,
    };
  });
}
