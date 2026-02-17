import { useState } from 'react';
import type { Bet, BetLeg, Game } from '../types';
import { formatOdds, formatPoint } from '../lib/odds';

interface ResolvedBetsProps {
  bets: Bet[];
}

const statusStyles: Record<string, string> = {
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
  push: 'bg-yellow-500/20 text-yellow-400',
};

const legStatusIcons: Record<string, string> = {
  won: 'text-green-400',
  lost: 'text-red-400',
  push: 'text-yellow-400',
  pending: 'text-gray-500',
};

const marketLabels: Record<string, string> = {
  h2h: 'ML',
  spreads: 'SPR',
  totals: 'TOT',
};

function LegRow({ leg }: { leg: BetLeg }) {
  const game = typeof leg.gameId === 'object' ? (leg.gameId as Game) : null;
  return (
    <div className="flex items-center gap-3 text-xs py-1">
      <span className={`font-bold ${legStatusIcons[leg.status] ?? 'text-gray-500'}`}>
        {leg.status === 'won' ? '\u2713' : leg.status === 'lost' ? '\u2717' : leg.status === 'push' ? '\u2014' : '\u2022'}
      </span>
      <span className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px] uppercase text-gray-400">
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
    </div>
  );
}

export default function ResolvedBets({ bets }: ResolvedBetsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (bets.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No resolved bets yet.</p>;
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

        const payoutDisplay = bet.status === 'lost'
          ? `-$${bet.amount.toFixed(2)}`
          : `+$${bet.payout.toFixed(2)}`;
        const payoutColor = bet.status === 'won'
          ? 'text-green-400'
          : bet.status === 'push'
            ? 'text-yellow-400'
            : 'text-red-400';

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
              <div className="ml-auto flex items-center gap-3">
                <span className="font-mono text-white">${bet.amount.toFixed(2)}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${statusStyles[bet.status] ?? ''}`}>
                  {bet.status}
                </span>
                <span className={`font-mono font-medium ${payoutColor}`}>
                  {payoutDisplay}
                </span>
              </div>
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
