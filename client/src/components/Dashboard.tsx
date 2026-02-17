import { useState, useCallback } from 'react';
import type { Game, Outcome, MarketType } from '../types';
import { useEvents, useEvent } from '../hooks/useEvent';
import { useGames } from '../hooks/useGames';
import { useSSE } from '../hooks/useSSE';
import { groupGamesByDate } from '../lib/odds';
import GameCard from './GameCard';
import BetSlip, { type SlipLeg } from './BetSlip';

export default function Dashboard() {
  const { events, loading: eventsLoading } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [legs, setLegs] = useState<SlipLeg[]>([]);

  // Filter to only active events (status is active and current date is within start/end range)
  const now = new Date();
  const activeEvents = events.filter((e) => {
    if (e.status !== 'active') return false;
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    // Include event if today is on or after start, and on or before end
    return now >= start && now <= end;
  });

  // Auto-select first active event
  const activeEventId = selectedEventId ?? activeEvents[0]?._id ?? null;
  const { event, reload: refetchEvent } = useEvent(activeEventId);
  const { games, setGames, loading: gamesLoading } = useGames(activeEventId);

  // SSE: update games in real time, removing completed games
  useSSE(activeEventId, {
    onGamesUpdated: useCallback((updatedGames: Game[]) => {
      setGames((prev) => {
        const map = new Map(prev.map((g) => [g._id, g]));
        for (const g of updatedGames) {
          if (g.completed) {
            map.delete(g._id);
          } else {
            map.set(g._id, g);
          }
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime(),
        );
      });
    }, [setGames]),
    onScoresUpdated: useCallback((updatedGames: Game[]) => {
      setGames((prev) => {
        const map = new Map(prev.map((g) => [g._id, g]));
        for (const g of updatedGames) {
          if (g.completed) {
            map.delete(g._id);
          } else {
            map.set(g._id, g);
          }
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime(),
        );
      });
    }, [setGames]),
  });

  // Filter out completed games (safety net)
  const activeGames = games.filter((g) => !g.completed);
  const groupedGames = groupGamesByDate(activeGames);

  function handleToggleLeg(game: Game, market: MarketType, outcome: Outcome, bookmaker: string) {
    setLegs((prev) => {
      // Check if this exact selection already exists (same game + market + outcome)
      const existingIdx = prev.findIndex(
        (l) => l.game._id === game._id && l.market === market && l.outcome.name === outcome.name,
      );
      if (existingIdx >= 0) {
        // Deselect
        return prev.filter((_, i) => i !== existingIdx);
      }
      // Remove any existing leg on the same game + market (e.g. switching from Team A ML to Team B ML)
      const filtered = prev.filter(
        (l) => !(l.game._id === game._id && l.market === market),
      );
      // Add new leg
      return [...filtered, { game, market, outcome, bookmaker }];
    });
  }

  function handleRemoveLeg(index: number) {
    setLegs((prev) => prev.filter((_, i) => i !== index));
  }

  function handleClear() {
    setLegs([]);
  }

  function handleBetPlaced() {
    refetchEvent();
  }

  if (eventsLoading) {
    return <div className="text-gray-500 text-center py-20">Loading events...</div>;
  }

  if (activeEvents.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">
          {events.length === 0 ? 'No events yet. Create one to get started.' : 'No active events right now.'}
        </p>
        <a
          href="/events/new"
          className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Create Event
        </a>
      </div>
    );
  }

  return (
    <div className={legs.length > 0 ? 'pb-60' : ''}>
      {/* Event Selector */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={activeEventId ?? ''}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {activeEvents.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.name}
            </option>
          ))}
        </select>
        {event && (
          <span className="text-sm text-gray-500">
            {event.participants.length} participants
          </span>
        )}
      </div>

      {/* Games */}
      {gamesLoading ? (
        <div className="text-gray-500 text-center py-12">Loading games...</div>
      ) : activeGames.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No games found.</p>
          <p className="text-gray-600 text-sm">
            Games will appear once the odds sync runs. Make sure your API key is configured.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groupedGames.entries()).map(([dateLabel, dateGames]) => (
            <div key={dateLabel}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {dateLabel}
              </h2>
              <div className="space-y-3">
                {(dateGames as Game[]).map((game) => (
                  <GameCard
                    key={game._id}
                    game={game}
                    selectedLegs={legs}
                    onToggleLeg={handleToggleLeg}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bet Slip */}
      {event && (
        <BetSlip
          legs={legs}
          event={event}
          onRemoveLeg={handleRemoveLeg}
          onClear={handleClear}
          onBetPlaced={handleBetPlaced}
        />
      )}
    </div>
  );
}
