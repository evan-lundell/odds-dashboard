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
 * Calculate potential payout from American odds.
 */
export function calculatePayout(amount: number, price: number): number {
  const profit = price > 0
    ? amount * (price / 100)
    : amount * (100 / Math.abs(price));
  return Math.round((amount + profit) * 100) / 100;
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
