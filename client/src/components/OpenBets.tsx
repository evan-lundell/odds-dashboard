import { useState } from 'react';
import type { Bet, BetLeg, Game } from '../types';
import { formatOdds, formatPoint, formatGameTime } from '../lib/odds';

interface OpenBetsProps {
  bets: Bet[];
}

const marketLabels: Record<string, string> = {
  h2h: 'ML',
  spreads: 'SPR',
  totals: 'TOT',
};

function LegRow({ leg }: { leg: BetLeg }) {
  const game = typeof leg.gameId === 'object' ? (leg.gameId as Game) : null;
  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 py-1">
      <span className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px] uppercase">
        {marketLabels[leg.market] ?? leg.market}
      </span>
      <span className="text-gray-300">{leg.pick.name}</span>
      {leg.pick.point !== undefined && (
        <span className="text-gray-500">{formatPoint(leg.pick.point)}</span>
      )}
      <span className="font-mono text-gray-300">{formatOdds(leg.pick.price)}</span>
      {game && (
        <span className="text-gray-500 ml-auto truncate">
          {game.awayTeam} @ {game.homeTeam}
        </span>
      )}
      {leg.status !== 'pending' && (
        <span className={`text-[10px] uppercase font-semibold ${
          leg.status === 'won' ? 'text-green-400' : leg.status === 'lost' ? 'text-red-400' : 'text-yellow-400'
        }`}>
          {leg.status}
        </span>
      )}
    </div>
  );
}

export default function OpenBets({ bets }: OpenBetsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (bets.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No open bets.</p>;
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {bets.map((bet) => {
        const isParlay = bet.type === 'parlay';
        const expanded = expandedIds.has(bet._id);
        const firstLeg = bet.legs[0];
        const firstGame = firstLeg && typeof firstLeg.gameId === 'object' ? (firstLeg.gameId as Game) : null;

        return (
          <div key={bet._id} className="bg-gray-800/50 rounded-lg overflow-hidden">
            {/* Summary row */}
            <div
              className={`flex items-center gap-3 px-3 py-2.5 text-sm ${isParlay ? 'cursor-pointer hover:bg-gray-800/80' : ''}`}
              onClick={() => isParlay && toggleExpand(bet._id)}
            >
              {isParlay && (
                <svg
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              <span className="font-medium text-white">{bet.participant}</span>
              {isParlay ? (
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs uppercase font-semibold">
                  Parlay ({bet.legs.length})
                </span>
              ) : (
                <>
                  <span className="text-gray-400 truncate">
                    {firstGame ? `${firstGame.awayTeam} @ ${firstGame.homeTeam}` : '-'}
                  </span>
                  {firstLeg && (
                    <>
                      <span className="px-1.5 py-0.5 bg-gray-700 rounded text-xs uppercase text-gray-400">
                        {marketLabels[firstLeg.market] ?? firstLeg.market}
                      </span>
                      <span className="text-gray-300">{firstLeg.pick.name}</span>
                      {firstLeg.pick.point !== undefined && (
                        <span className="text-gray-500 text-xs">{formatPoint(firstLeg.pick.point)}</span>
                      )}
                      <span className="font-mono text-gray-300">{formatOdds(firstLeg.pick.price)}</span>
                    </>
                  )}
                </>
              )}
              <span className="ml-auto font-mono text-white">${bet.amount.toFixed(2)}</span>
              <span className="font-mono text-green-400">${bet.payout.toFixed(2)}</span>
            </div>

            {/* Expanded legs for parlays */}
            {isParlay && expanded && (
              <div className="px-3 pb-3 pl-10 space-y-0.5 border-t border-gray-700/50">
                {bet.legs.map((leg, idx) => (
                  <LegRow key={idx} leg={leg} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
