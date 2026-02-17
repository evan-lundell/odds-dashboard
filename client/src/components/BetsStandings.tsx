import { useState, useCallback } from 'react';
import { useEvents } from '../hooks/useEvent';
import { useBets, useLeaderboard } from '../hooks/useBets';
import { useSSE } from '../hooks/useSSE';
import type { Bet, Participant } from '../types';
import OpenBets from './OpenBets';
import ResolvedBets from './ResolvedBets';
import Leaderboard from './Leaderboard';

export default function BetsStandings() {
  const { events, loading: eventsLoading } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const activeEventId = selectedEventId ?? events.find((e) => e.status === 'active')?._id ?? null;

  const { bets: openBets, loading: openLoading, reload: reloadOpen } = useBets(activeEventId, 'pending');
  const { bets: resolvedBets, loading: resolvedLoading, reload: reloadResolved } = useBets(activeEventId, 'settled');
  const { leaderboard, loading: lbLoading, reload: reloadLeaderboard } = useLeaderboard(activeEventId);

  const reloadAll = useCallback(() => {
    reloadOpen();
    reloadResolved();
    reloadLeaderboard();
  }, [reloadOpen, reloadResolved, reloadLeaderboard]);

  // SSE: auto-update when bets are settled or placed
  useSSE(activeEventId, {
    onBetsSettled: useCallback((_bets: Bet[], _participants: Participant[]) => {
      reloadAll();
    }, [reloadAll]),
    onBetPlaced: useCallback((_bet: Bet) => {
      reloadAll();
    }, [reloadAll]),
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

      {/* Leaderboard */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3">Leaderboard</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {lbLoading ? (
            <div className="text-gray-500 text-sm py-6 text-center">Loading...</div>
          ) : (
            <Leaderboard leaderboard={leaderboard} />
          )}
        </div>
      </section>

      {/* Open Bets */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3">
          Open Bets
          {openBets.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">({openBets.length})</span>
          )}
        </h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {openLoading ? (
            <div className="text-gray-500 text-sm py-6 text-center">Loading...</div>
          ) : (
            <OpenBets bets={openBets} />
          )}
        </div>
      </section>

      {/* Resolved Bets */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3">
          Resolved Bets
          {resolvedBets.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">({resolvedBets.length})</span>
          )}
        </h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {resolvedLoading ? (
            <div className="text-gray-500 text-sm py-6 text-center">Loading...</div>
          ) : (
            <ResolvedBets bets={resolvedBets} />
          )}
        </div>
      </section>
    </div>
  );
}
