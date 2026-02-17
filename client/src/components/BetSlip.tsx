import { useState } from 'react';
import type { BettingEvent, Game, MarketType, Outcome } from '../types';
import type { BetLegInput } from '../lib/api';
import { formatOdds, formatPoint, calculatePayout, calculateParlayPayout, combinedParlayDecimal, decimalToAmerican } from '../lib/odds';
import { placeBet } from '../lib/api';

export interface SlipLeg {
  game: Game;
  market: MarketType;
  outcome: Outcome;
  bookmaker: string;
}

interface BetSlipProps {
  legs: SlipLeg[];
  event: BettingEvent;
  onRemoveLeg: (index: number) => void;
  onClear: () => void;
  onBetPlaced: () => void;
}

const marketLabels: Record<MarketType, string> = {
  h2h: 'ML',
  spreads: 'Spread',
  totals: 'Total',
};

export default function BetSlip({ legs, event, onRemoveLeg, onClear, onBetPlaced }: BetSlipProps) {
  const [participant, setParticipant] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const isParlay = legs.length > 1;
  const betTypeLabel = isParlay ? `Parlay (${legs.length} legs)` : 'Straight';

  // Calculate payout
  const prices = legs.map((l) => l.outcome.price);
  const potentialPayout =
    amountNum > 0
      ? isParlay
        ? calculateParlayPayout(amountNum, prices)
        : calculatePayout(amountNum, prices[0])
      : 0;

  // Combined odds for parlay display
  const combinedDecimal = isParlay ? combinedParlayDecimal(prices) : 0;
  const combinedAmerican = isParlay ? decimalToAmerican(combinedDecimal) : 0;

  const selectedParticipant = event.participants.find((p) => p.name === participant);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!participant) { setError('Select a participant'); return; }
    if (amountNum <= 0) { setError('Enter a valid amount'); return; }
    if (selectedParticipant && amountNum > selectedParticipant.balance) {
      setError(`Insufficient balance ($${selectedParticipant.balance.toFixed(2)})`);
      return;
    }
    if (isParlay && legs.length > event.maxParlayLegs) {
      setError(`Max ${event.maxParlayLegs} legs per parlay`);
      return;
    }

    setSubmitting(true);
    try {
      const legInputs: BetLegInput[] = legs.map((l) => ({
        gameId: l.game._id,
        market: l.market,
        pick: {
          name: l.outcome.name,
          price: l.outcome.price,
          point: l.outcome.point,
        },
        bookmaker: l.bookmaker,
      }));

      await placeBet({
        eventId: event._id,
        participant,
        amount: amountNum,
        legs: legInputs,
      });

      onBetPlaced();
      onClear();
      setAmount('');
      setError('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error ?? 'Failed to place bet');
      } else {
        setError('Failed to place bet');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (legs.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-700 shadow-2xl">
      {/* Header bar - always visible */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-orange-400 font-bold text-sm">{betTypeLabel}</span>
          {isParlay && (
            <span className="text-xs text-gray-400 font-mono">
              {formatOdds(combinedAmerican)} ({combinedDecimal.toFixed(2)}x)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{legs.length} selection{legs.length !== 1 ? 's' : ''}</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {!collapsed && (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-4 space-y-3">
          {/* Legs list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {legs.map((leg, idx) => (
              <div key={`${leg.game._id}-${leg.market}-${leg.outcome.name}`} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 truncate">
                    {leg.game.awayTeam} @ {leg.game.homeTeam}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                      {marketLabels[leg.market]}
                    </span>
                    <span className="text-gray-200 truncate">{leg.outcome.name}</span>
                    {leg.outcome.point !== undefined && (
                      <span className="text-gray-400 text-xs">{formatPoint(leg.outcome.point)}</span>
                    )}
                    <span className={`font-mono text-xs ${leg.outcome.price > 0 ? 'text-green-400' : 'text-gray-300'}`}>
                      {formatOdds(leg.outcome.price)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLeg(idx)}
                  className="ml-2 text-gray-500 hover:text-red-400 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Controls row */}
          <div className="flex items-end gap-3">
            {/* Participant */}
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Who's betting?</label>
              <select
                value={participant}
                onChange={(e) => setParticipant(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select...</option>
                {event.participants.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} (${p.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="w-32">
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Amount ($)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Payout */}
            <div className="w-36 text-right">
              {amountNum > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Payout</div>
                  <div className="text-green-400 font-bold font-mono text-lg">
                    ${potentialPayout.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {submitting ? 'Placing...' : isParlay ? 'Place Parlay' : 'Place Bet'}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
