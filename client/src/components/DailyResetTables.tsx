import type { LeaderboardEntry } from '../types';

interface DailyResetTablesProps {
  leaderboard: LeaderboardEntry[];
}

export default function DailyResetTables({ leaderboard }: DailyResetTablesProps) {
  if (leaderboard.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No participants yet.</p>;
  }

  const dailyLeaderboard = [...leaderboard].sort(
    (a, b) =>
      (b.dailyBalance ?? b.balance) - (a.dailyBalance ?? a.balance),
  );

  const runningLeaderboard = [...leaderboard].sort(
    (a, b) => (b.runningTotal ?? 0) - (a.runningTotal ?? 0),
  );

  return (
    <div className="space-y-8">
      {/* Daily Totals Table */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-bold text-white">Daily Totals</h2>
          <p className="text-xs text-gray-500">
            Current balances and open bets for today. Sorted by current balance (desc).
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left text-xs uppercase tracking-wider border-b border-gray-800">
                  <th className="px-3 py-2 w-8">#</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">Current Balance</th>
                  <th className="px-3 py-2 text-center">W</th>
                  <th className="px-3 py-2 text-center">L</th>
                  <th className="px-3 py-2 text-center">P</th>
                  <th className="px-3 py-2 text-center">Open</th>
                </tr>
              </thead>
              <tbody>
                {dailyLeaderboard.map((entry, idx) => {
                  const currentBalance = entry.dailyBalance ?? entry.balance;
                  return (
                    <tr
                      key={entry.name}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30"
                    >
                      <td className="px-3 py-2.5 text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-white">
                        {entry.name}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                        ${currentBalance.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-green-400">
                        {entry.wins}
                      </td>
                      <td className="px-3 py-2.5 text-center text-red-400">
                        {entry.losses}
                      </td>
                      <td className="px-3 py-2.5 text-center text-yellow-400">
                        {entry.pushes}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-400">
                        {entry.pending}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Running Totals Table */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-bold text-white">Running Totals</h2>
          <p className="text-xs text-gray-500">
            Cumulative performance across all completed days. Sorted by running total (desc).
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left text-xs uppercase tracking-wider border-b border-gray-800">
                  <th className="px-3 py-2 w-8">#</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">Running Total</th>
                  <th className="px-3 py-2 text-center">W</th>
                  <th className="px-3 py-2 text-center">L</th>
                  <th className="px-3 py-2 text-center">P</th>
                </tr>
              </thead>
              <tbody>
                {runningLeaderboard.map((entry, idx) => (
                  <tr
                    key={entry.name}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30"
                  >
                    <td className="px-3 py-2.5 text-gray-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-white">
                      {entry.name}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                      ${(entry.runningTotal ?? 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-center text-green-400">
                      {entry.wins}
                    </td>
                    <td className="px-3 py-2.5 text-center text-red-400">
                      {entry.losses}
                    </td>
                    <td className="px-3 py-2.5 text-center text-yellow-400">
                      {entry.pushes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

