import { useState, useCallback } from 'react';
import { useEvents } from '../hooks/useEvent';
import { useLeaderboard } from '../hooks/useBets';
import { useSSE } from '../hooks/useSSE';
import type { Bet, Participant } from '../types';
import Leaderboard from './Leaderboard';
import DailyResetTables from './DailyResetTables';

export default function BetsStandings() {
  const { events, loading: eventsLoading } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const activeEventId =
    selectedEventId ?? events.find((e) => e.status === 'active')?._id ?? null;
  const activeEvent = events.find((e) => e._id === activeEventId) ?? null;

  const {
    leaderboard,
    loading: lbLoading,
    reload: reloadLeaderboard,
  } = useLeaderboard(activeEventId);

  const reloadAll = useCallback(() => {
    reloadLeaderboard();
  }, [reloadLeaderboard]);

  // SSE: auto-update leaderboard when bets are settled or placed
  useSSE(activeEventId, {
    onBetsSettled: useCallback(
      (_bets: Bet[], _participants: Participant[]) => {
        reloadAll();
      },
      [reloadAll],
    ),
    onBetPlaced: useCallback(
      (_bet: Bet) => {
        reloadAll();
      },
      [reloadAll],
    ),
  });

  if (eventsLoading) {
    return <div className="text-gray-500 text-center py-20">Loading...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">No events yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Event Selector */}
      <div className="flex items-center gap-4">
        <select
          value={activeEventId ?? ''}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      {/* Scoreboard / Leaderboard */}
      <section>
        {lbLoading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="text-gray-500 text-sm py-6 text-center">
              Loading...
            </div>
          </div>
        ) : activeEvent?.dailyReset ? (
          <DailyResetTables leaderboard={leaderboard} />
        ) : (
          <>
            <h2 className="text-lg font-bold text-white mb-3">Leaderboard</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <Leaderboard leaderboard={leaderboard} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
