import { useState, useEffect, useCallback } from 'react';
import type { BettingEvent } from '../types';
import { fetchEvents, fetchEvent } from '../lib/api';

export function useEvents() {
  const [events, setEvents] = useState<BettingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { events, loading, reload: load };
}

export function useEvent(eventId: string | null) {
  const [event, setEvent] = useState<BettingEvent | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) { setEvent(null); return; }
    setLoading(true);
    try {
      const data = await fetchEvent(eventId);
      setEvent(data);
    } catch (err) {
      console.error('Failed to fetch event:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  return { event, loading, reload: load, setEvent };
}
