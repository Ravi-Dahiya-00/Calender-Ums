import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TYPE_COLORS = {
  MTE: '#DC2626', ETE: '#7C3AED', CA: '#D97706',
  HOLIDAY: '#059669', WORKSHOP: '#0891B2', EVENT: '#DB2777',
  DEADLINE: '#DC2626', CUSTOM: '#6366F1',
};

const TYPE_ICONS = {
  MTE: '📝', ETE: '📋', CA: '✏️', HOLIDAY: '🎉',
  WORKSHOP: '🔧', EVENT: '🎯', DEADLINE: '⚠️', CUSTOM: '⚡',
};

export default function EventList({ onEdit, refreshKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal State
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/events`);
      setEvents(data.data || []);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents, refreshKey]);

  const confirmDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE}/api/events/${deletingEvent.id}`);
      toast.success('Event deleted successfully');
      setEvents(prev => prev.filter(e => e.id !== deletingEvent.id));
    } catch (err) {
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
      setDeletingEvent(null);
    }
  };

  const filtered = events.filter(e => {
    const matchType = filterType === 'ALL' || e.type === filterType;
    const matchSearch = !search || [e.title, e.subject, e.venue, e.description]
      .some(field => field?.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  }).sort((a, b) => {
    const dateA = new Date(a.start_time || a.start);
    const dateB = new Date(b.start_time || b.start);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const types = ['ALL', ...new Set(events.map(e => e.type))];

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No events to export');
      return;
    }
    
    const headers = ['Title', 'Type', 'Start Time', 'End Time', 'Venue', 'Subject', 'Branch', 'Description'];
    const rows = filtered.map(e => [
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.type}"`,
      `"${dayjs(e.start_time || e.start).format('YYYY-MM-DD HH:mm')}"`,
      `"${dayjs(e.end_time || e.end).format('YYYY-MM-DD HH:mm')}"`,
      `"${(e.venue || '').replace(/"/g, '""')}"`,
      `"${(e.subject || '').replace(/"/g, '""')}"`,
      `"${e.branch || 'ALL'}"`,
      `"${(e.description || '').replace(/"/g, '""').replace(/\\n/g, ' ')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `events_export_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getEventStatus = (event) => {
    const start = dayjs(event.start_time || event.start);
    const end = dayjs(event.end_time || event.end);
    const now = dayjs();
    
    if (now.isAfter(end)) return { label: 'Past', color: '#6B7280', bg: '#F3F4F6' };
    if (now.isBefore(start) && !start.isSame(now, 'day')) return { label: 'Upcoming', color: '#047857', bg: '#D1FAE5' };
    return { label: 'Today', color: '#B45309', bg: '#FEF3C7' };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B0000]/50 focus:ring-4 focus:ring-[#8B0000]/10 transition-all font-sans shadow-sm"
          />
        </div>
        
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#8B0000]/50 focus:ring-4 focus:ring-[#8B0000]/10 transition-all font-sans shadow-sm cursor-pointer"
          >
            {types.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : `${TYPE_ICONS[t] || ''} ${t}`}</option>)}
          </select>

          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#8B0000]/50 focus:ring-4 focus:ring-[#8B0000]/10 transition-all font-sans shadow-sm cursor-pointer"
          >
            <option value="asc">Date (Oldest First)</option>
            <option value="desc">Date (Newest First)</option>
          </select>
          
          <button
            onClick={fetchEvents}
            className="p-2.5 px-4 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-sm font-medium shadow-sm flex items-center gap-2"
            title="Refresh"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="p-2.5 px-4 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-sm font-medium shadow-sm flex items-center gap-2"
            title="Export CSV"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-[13px] text-gray-500 font-medium px-1">
        Showing <span className="text-gray-900 font-bold">{filtered.length}</span> of {events.length} events
      </p>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-8 h-8 border-2 border-[#8B0000]/20 border-t-[#8B0000] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium text-sm">Loading events database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span className="text-3xl opacity-50">📭</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Events Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {events.length === 0 
              ? 'Your calendar is currently empty. Switch to the "Add Event" tab to create your first event.' 
              : 'No events match your current search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => (
            <div
              key={event.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 group"
            >
              {/* Event info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color || TYPE_COLORS[event.type] || '#6366f1', boxShadow: `0 0 10px ${event.color || TYPE_COLORS[event.type] || '#6366f1'}40` }}
                  />
                  <span className="text-[15px] font-bold text-gray-900 truncate tracking-tight">{event.title}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: `${TYPE_COLORS[event.type]}10`,
                      borderColor: `${TYPE_COLORS[event.type]}30`,
                      color: TYPE_COLORS[event.type] || '#1F2937'
                    }}
                  >
                    {TYPE_ICONS[event.type]} {event.type}
                  </span>
                  {event.branch && event.branch !== 'ALL' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold tracking-wide">{event.branch}</span>
                  )}
                  {(() => {
                    const status = getEventStatus(event);
                    return (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide"
                        style={{ backgroundColor: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap pl-5">
                  <div className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {dayjs(event.start_time || event.start).format('DD MMM YYYY, h:mm A')}
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-1 text-[13px] text-gray-400">
                      <span>📍</span> {event.venue}
                    </div>
                  )}
                  {event.subject && (
                    <div className="flex items-center gap-1 text-[13px] text-gray-400">
                      <span>📚</span> {event.subject}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <button
                  onClick={() => onEdit(event)}
                  className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all text-xs font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingEvent(event)}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-all text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !isDeleting && setDeletingEvent(null)} />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-fadeInUp">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-5 mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Event?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-800">"{deletingEvent.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingEvent(null)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/30 flex justify-center items-center gap-2 text-sm"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Deleting...
                  </>
                ) : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
