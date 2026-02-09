import type { Bet, Game } from '../types';
import { formatOdds, formatPoint, formatGameTime } from '../lib/odds';

interface OpenBetsProps {
  bets: Bet[];
}

export default function OpenBets({ bets }: OpenBetsProps) {
  if (bets.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No open bets.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left text-xs uppercase tracking-wider border-b border-gray-800">
            <th className="px-3 py-2">Participant</th>
            <th className="px-3 py-2">Game</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Pick</th>
            <th className="px-3 py-2 text-right">Odds</th>
            <th className="px-3 py-2 text-right">Wager</th>
            <th className="px-3 py-2 text-right">To Win</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((bet) => {
            const game = typeof bet.gameId === 'object' ? (bet.gameId as Game) : null;
            return (
              <tr key={bet._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-3 py-2.5 font-medium text-white">{bet.participant}</td>
                <td className="px-3 py-2.5 text-gray-400">
                  {game ? `${game.awayTeam} @ ${game.homeTeam}` : '-'}
                </td>
                <td className="px-3 py-2.5">
                  <span className="px-1.5 py-0.5 bg-gray-800 rounded text-xs uppercase text-gray-400">
                    {bet.market === 'h2h' ? 'ML' : bet.market === 'spreads' ? 'SPR' : 'TOT'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gray-300">
                  {bet.pick.name}
                  {bet.pick.point !== undefined && (
                    <span className="text-gray-500 ml-1 text-xs">{formatPoint(bet.pick.point)}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                  {formatOdds(bet.pick.price)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-white">
                  ${bet.amount.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-green-400">
                  ${bet.payout.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
