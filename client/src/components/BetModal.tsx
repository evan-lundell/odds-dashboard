import { useState } from 'react';
import type { Game, Outcome, MarketType, BettingEvent } from '../types';
import { formatOdds, formatPoint, calculatePayout } from '../lib/odds';
import { placeBet } from '../lib/api';

interface BetModalProps {
  game: Game;
  market: MarketType;
  outcome: Outcome;
  bookmaker: string;
  event: BettingEvent;
  onClose: () => void;
  onBetPlaced: () => void;
}

const marketLabels: Record<MarketType, string> = {
  h2h: 'Moneyline',
  spreads: 'Spread',
  totals: 'Total',
};

export default function BetModal({
  game,
  market,
  outcome,
  bookmaker,
  event,
  onClose,
  onBetPlaced,
}: BetModalProps) {
  const [participant, setParticipant] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const potentialPayout = amountNum > 0 ? calculatePayout(amountNum, outcome.price) : 0;
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

    setSubmitting(true);
    try {
      await placeBet({
        eventId: event._id,
        gameId: game._id,
        participant,
        market,
        pick: {
          name: outcome.name,
          price: outcome.price,
          point: outcome.point,
        },
        bookmaker,
        amount: amountNum,
      });
      onBetPlaced();
      onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-4">Place Bet</h2>

        {/* Game Info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm">
          <div className="text-gray-400 mb-1">
            {game.awayTeam} @ {game.homeTeam}
          </div>
          <div className="flex items-center gap-2 text-white font-medium">
            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs uppercase">
              {marketLabels[market]}
            </span>
            <span>{outcome.name}</span>
            {outcome.point !== undefined && (
              <span className="text-gray-400">{formatPoint(outcome.point)}</span>
            )}
            <span className={`font-mono ${outcome.price > 0 ? 'text-green-400' : 'text-gray-300'}`}>
              {formatOdds(outcome.price)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Participant */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Who's betting?</label>
            <select
              value={participant}
              onChange={(e) => setParticipant(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select participant...</option>
              {event.participants.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} (${p.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount ($)</label>
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
          {amountNum > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-3 flex justify-between text-sm">
              <span className="text-gray-400">Potential Payout</span>
              <span className="text-green-400 font-bold font-mono">
                ${potentialPayout.toFixed(2)}
              </span>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Placing...' : 'Place Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
