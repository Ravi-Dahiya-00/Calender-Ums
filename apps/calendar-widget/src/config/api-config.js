/**
 * API Source Registry — The Integration Switchboard
 *
 * Each entry defines ONE event source (one type of academic event).
 *
 * TO INTEGRATE WITH UMS:
 * Change only the `endpoint` field for each source to point to the
 * university's API endpoint. Zero other changes needed.
 *
 * TO ADD A NEW EVENT TYPE:
 * Add a new entry to this array. The calendar will auto-discover it.
 */
const API_CONFIG = {
  // Base URL for your own backend API
  // In production, change this to your deployed Render/Railway URL
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',

  sources: [
    {
      id: 'mte',
      label: 'Mid Term Exams',
      endpoint: '/api/events?type=MTE',
      color: '#EF4444',
      icon: '📝',
      enabled: true,
    },
    {
      id: 'ete',
      label: 'End Term Exams',
      endpoint: '/api/events?type=ETE',
      color: '#8B5CF6',
      icon: '📋',
      enabled: true,
    },
    {
      id: 'ca',
      label: 'Continuous Assessment',
      endpoint: '/api/events?type=CA',
      color: '#F59E0B',
      icon: '✏️',
      enabled: true,
    },
    {
      id: 'holiday',
      label: 'Holidays',
      endpoint: '/api/events?type=HOLIDAY',
      color: '#10B981',
      icon: '🎉',
      enabled: true,
    },
    {
      id: 'workshop',
      label: 'Workshops',
      endpoint: '/api/events?type=WORKSHOP',
      color: '#06B6D4',
      icon: '🔧',
      enabled: true,
    },
    {
      id: 'event',
      label: 'Events',
      endpoint: '/api/events?type=EVENT',
      color: '#EC4899',
      icon: '🎯',
      enabled: true,
    },
    {
      id: 'deadline',
      label: 'Deadlines',
      endpoint: '/api/events?type=DEADLINE',
      color: '#DC2626',
      icon: '⚠️',
      enabled: true,
    },
  ],
};

export default API_CONFIG;
