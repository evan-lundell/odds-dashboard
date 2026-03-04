import type { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  isDailyReset?: boolean;
}

export default function Leaderboard({ leaderboard, isDailyReset = false }: LeaderboardProps) {
  if (leaderboard.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No participants yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left text-xs uppercase tracking-wider border-b border-gray-800">
            <th className="px-3 py-2 w-8">#</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2 text-right">
              {isDailyReset ? 'Daily Balance' : 'Balance'}
            </th>
            {isDailyReset && (
              <th className="px-3 py-2 text-right">Running Total</th>
            )}
            <th className="px-3 py-2 text-right">Net P/L</th>
            <th className="px-3 py-2 text-center">W</th>
            <th className="px-3 py-2 text-center">L</th>
            <th className="px-3 py-2 text-center">P</th>
            <th className="px-3 py-2 text-center">Open</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, idx) => (
            <tr key={entry.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="px-3 py-2.5 text-gray-500 font-medium">{idx + 1}</td>
              <td className="px-3 py-2.5 font-medium text-white">{entry.name}</td>
              <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                ${((isDailyReset ? (entry.dailyBalance ?? entry.balance) : entry.balance)).toFixed(2)}
              </td>
              {isDailyReset && (
                <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                  ${(entry.runningTotal ?? 0).toFixed(2)}
                </td>
              )}
              <td className={`px-3 py-2.5 text-right font-mono font-medium ${
                entry.netProfit > 0 ? 'text-green-400' : entry.netProfit < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {entry.netProfit > 0 ? '+' : ''}{entry.netProfit.toFixed(2)}
              </td>
              <td className="px-3 py-2.5 text-center text-green-400">{entry.wins}</td>
              <td className="px-3 py-2.5 text-center text-red-400">{entry.losses}</td>
              <td className="px-3 py-2.5 text-center text-yellow-400">{entry.pushes}</td>
              <td className="px-3 py-2.5 text-center text-gray-400">{entry.pending}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
