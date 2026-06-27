import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api-config';

/**
 * useEvents — The core data-fetching hook
 *
 * Reads from api-config.js and fetches ALL enabled sources in parallel.
 * Returns a flat, unified array of events for the calendar.
 *
 * When the university provides their own API endpoints, ONLY api-config.js
 * changes. This hook needs zero modifications.
 *
 * Optional: pass a transformer function to adapt a non-standard API response
 * to the universal event contract. Example:
 *   transformer = (rawEvent) => ({ ...rawEvent, start: rawEvent.examDate })
 */
export function useEvents({ transformer = null } = {}) {
  const [rawEvents, setRawEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchAllSources = useCallback(async () => {
    setLoading(true);
    setError(null);

    const enabledSources = API_CONFIG.sources.filter(s => s.enabled);

    try {
      // Fetch all enabled sources in parallel
      const results = await Promise.allSettled(
        enabledSources.map(async (source) => {
          const url = source.endpoint.startsWith('http')
            ? source.endpoint                              // External URL (UMS integration)
            : `${API_CONFIG.baseUrl}${source.endpoint}`;  // Own backend

          const response = await axios.get(url, { timeout: 10000 });

          // Handle both { data: [...] } and plain [...] response shapes
          const eventsData = response.data?.data || response.data || [];

          return eventsData.map(rawEvent => {
            // Apply custom transformer if provided (for UMS integration with different shapes)
            const event = transformer ? transformer(rawEvent, source) : rawEvent;

            return {
              // Universal Event Contract fields
              id: event.id || `${source.id}-${Math.random()}`,
              title: event.title || 'Untitled Event',
              start: new Date(event.start || event.start_time),
              end: new Date(event.end || event.end_time),
              type: event.type || source.id.toUpperCase(),
              description: event.description || '',
              color: event.color || source.color,
              venue: event.venue || '',
              subject: event.subject || '',
              branch: event.branch || 'ALL',
              semester: event.semester,
              metadata: event.metadata || {},
              sourceId: source.id,
              sourceLabel: source.label,
              sourceColor: source.color,
              sourceIcon: source.icon,
            };
          });
        })
      );

      // Flatten all results, skip failed sources
      const allEvents = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      setRawEvents(allEvents);
      setLastFetched(new Date());
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('useEvents fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [transformer]);

  useEffect(() => {
    fetchAllSources();
  }, [fetchAllSources]);

  // No filtering here — return all events raw.
  // Callers (App.jsx) build their own filtered views for sidebar vs. calendar.
  return { events: rawEvents, loading, error, refetch: fetchAllSources, lastFetched };
}

// ─── Client-side filter application (exported for use in App.jsx) ───────────
export function applyFilters(events, filters = {}) {
  let filtered = [...events];

  if (filters.activeTypes) {
    if (filters.activeTypes.length === 0) {
      return []; // All categories unchecked -> no events
    }
    filtered = filtered.filter(e => filters.activeTypes.includes(e.type));
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(term) ||
      e.subject.toLowerCase().includes(term) ||
      e.description.toLowerCase().includes(term) ||
      e.venue.toLowerCase().includes(term)
    );
  }

  if (filters.branch && filters.branch !== 'ALL') {
    filtered = filtered.filter(e => e.branch === filters.branch || e.branch === 'ALL');
  }

  if (filters.semester) {
    filtered = filtered.filter(e => !e.semester || e.semester === parseInt(filters.semester));
  }

  return filtered;
}
