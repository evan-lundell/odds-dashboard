/**
 * Format American odds for display.
 * Positive odds get a "+" prefix, negative keep their "-".
 */
export function formatOdds(price: number): string {
  return price > 0 ? `+${price}` : `${price}`;
}

/**
 * Format a spread/total point value.
 */
export function formatPoint(point: number | undefined): string {
  if (point === undefined) return '';
  return point > 0 ? `+${point}` : `${point}`;
}

/**
 * Convert American odds to decimal multiplier.
 */
export function americanToDecimal(price: number): number {
  return price > 0
    ? (price / 100) + 1
    : (100 / Math.abs(price)) + 1;
}

/**
 * Calculate potential payout from American odds (single leg).
 */
export function calculatePayout(amount: number, price: number): number {
  return Math.round(amount * americanToDecimal(price) * 100) / 100;
}

/**
 * Calculate parlay payout from multiple leg prices.
 */
export function calculateParlayPayout(amount: number, prices: number[]): number {
  if (prices.length === 0) return amount;
  const combinedDecimal = prices.reduce((acc, p) => acc * americanToDecimal(p), 1);
  return Math.round(amount * combinedDecimal * 100) / 100;
}

/**
 * Calculate combined decimal odds for display.
 */
export function combinedParlayDecimal(prices: number[]): number {
  return prices.reduce((acc, p) => acc * americanToDecimal(p), 1);
}

/**
 * Convert combined decimal odds back to American odds for display.
 */
export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

/**
 * Format a date to a short readable string.
 */
export function formatGameTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Group games by date string (e.g. "Thu, Mar 19").
 */
export function groupGamesByDate(games: { commenceTime: string }[]): Map<string, typeof games> {
  const groups = new Map<string, typeof games>();
  for (const game of games) {
    const key = new Date(game.commenceTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(game);
  }
  return groups;
}
