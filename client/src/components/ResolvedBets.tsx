import type { Bet, Game } from '../types';
import { formatOdds, formatPoint } from '../lib/odds';

interface ResolvedBetsProps {
  bets: Bet[];
}

const statusStyles: Record<string, string> = {
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
  push: 'bg-yellow-500/20 text-yellow-400',
};

export default function ResolvedBets({ bets }: ResolvedBetsProps) {
  if (bets.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No resolved bets yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left text-xs uppercase tracking-wider border-b border-gray-800">
            <th className="px-3 py-2">Participant</th>
            <th className="px-3 py-2">Game</th>
            <th className="px-3 py-2">Pick</th>
            <th className="px-3 py-2 text-right">Odds</th>
            <th className="px-3 py-2 text-right">Wager</th>
            <th className="px-3 py-2 text-center">Result</th>
            <th className="px-3 py-2 text-right">Payout</th>
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
                <td className="px-3 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${statusStyles[bet.status] ?? ''}`}>
                    {bet.status}
                  </span>
                </td>
                <td className={`px-3 py-2.5 text-right font-mono font-medium ${
                  bet.status === 'won' ? 'text-green-400' : bet.status === 'push' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {bet.status === 'lost' ? '-$' + bet.amount.toFixed(2) : '+$' + bet.payout.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
