import React, { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import CalendarView from './components/CalendarView';
import EventPopup from './components/EventPopup';
import FilterBar from './components/FilterBar';
import UpcomingList from './components/UpcomingList';
import CustomDatePicker from './components/CustomDatePicker';
import { useEvents } from './hooks/useEvents';
import API_CONFIG from './config/api-config';
import './index.css';

dayjs.extend(isToday);

const ALL_TYPES = API_CONFIG.sources.map(s => s.id.toUpperCase());

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function App() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTypes, setActiveTypes] = useState(ALL_TYPES);
  const [search, setSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTodayModalOpen, setIsTodayModalOpen] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [todayBannerDismissed, setTodayBannerDismissed] = useState(false);

  const filters = useMemo(() => ({ activeTypes, search }), [activeTypes, search]);
  const { events, loading, error, refetch, lastFetched } = useEvents({ filters });

  const today = dayjs();

  const eventCounts = useMemo(() => {
    const counts = {};
    events.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return counts;
  }, [events]);

  const todayEvents = useMemo(() =>
    events.filter(e => dayjs(e.start).isToday()),
    [events]
  );

  // Date-range filtered events (used in the date filter modal)
  const dateRangeEvents = useMemo(() => {
    if (!dateFrom && !dateTo) return [];
    return events.filter(e => {
      const d = dayjs(e.start);
      const from = dateFrom ? dayjs(dateFrom).startOf('day') : null;
      const to = dateTo ? dayjs(dateTo).endOf('day') : null;
      if (from && to) return (d.isAfter(from) || d.isSame(from)) && (d.isBefore(to) || d.isSame(to));
      if (from) return d.isAfter(from) || d.isSame(from);
      if (to) return d.isBefore(to) || d.isSame(to);
      return true;
    }).sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [events, dateFrom, dateTo]);

  const handleToggleType = useCallback((type) => {
    setActiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveTypes(ALL_TYPES);
    setSearch('');
  }, []);

  const handleClearDateFilter = useCallback(() => {
    setDateFrom('');
    setDateTo('');
  }, []);

  const handleExportAllICS = useCallback(() => {
    const eventsToExport = (dateFrom || dateTo) ? dateRangeEvents : events;
    if (eventsToExport.length === 0) return;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LPU Academic Calendar//EN',
      ...eventsToExport.map(event => {
        const s = dayjs(event.start).format('YYYYMMDDTHHmm00');
        const e = dayjs(event.end).format('YYYYMMDDTHHmm00');
        return [
          'BEGIN:VEVENT',
          `UID:${event.id || Date.now()}@lpu.edu`,
          `DTSTAMP:${dayjs().format('YYYYMMDDTHHmm00')}Z`,
          `DTSTART:${s}`,
          `DTEND:${e}`,
          `SUMMARY:${event.title}`,
          `DESCRIPTION:${(event.description || '').replace(/\\n/g, '\\\\n')}`,
          `LOCATION:${event.venue || ''}`,
          'END:VEVENT'
        ].join('\\r\\n');
      }),
      'END:VCALENDAR'
    ].join('\\r\\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lpu_calendar_${dayjs().format('YYYYMMDD')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [events, dateRangeEvents, dateFrom, dateTo]);

  return (
    <div className="h-screen flex flex-col bg-[#F0F2F5] font-sans">

      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-3 md:px-5 h-[60px] shrink-0 bg-[#8B0000] border-b border-[#6b0000] shadow-sm z-20 relative">
        {/* Left — Logo + Title + Hamburger */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Hamburger (Mobile Only) */}
          <button
            className="md:hidden text-white/80 p-1 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[#C9A84C] flex items-center justify-center text-base md:text-lg font-bold text-[#8B0000] shadow-md shrink-0">
            L
          </div>
          <div className="hidden sm:block">
            <p className="text-[15px] md:text-[16px] font-bold text-white leading-tight tracking-tight">
              Academic Calendar
            </p>
            <p className="text-[10px] md:text-[11px] text-white/60 mt-[1px] tracking-wide">
              Lovely Professional University
            </p>
          </div>
        </div>

        {/* Center — Spacer */}
        <div className="flex-1 mx-2 md:mx-6" />

        {/* Right — Sync badge */}
        <div className="flex items-center gap-2 md:gap-3">
          {lastFetched && (
            <span className="hidden md:inline text-[11px] text-white/45">
              {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-2 md:px-3 py-1.5 text-white text-[11px] md:text-xs font-medium hover:bg-white/20 transition-colors"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </header>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 z-40 md:z-10 w-[280px] md:w-[260px] shrink-0 bg-white border-r border-[#E2E5EA]
          flex flex-col overflow-hidden shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Mobile Close Button */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-[#8B0000] text-white">
            <span className="font-bold text-sm">Filters & Options</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-white/20 rounded text-lg">✕</button>
          </div>

          {/* ── TODAY AT A GLANCE CARD ─────────────────────────────────────── */}
          <div 
            onClick={() => setIsTodayModalOpen(true)}
            style={{
              margin: '14px 12px 10px',
              background: 'linear-gradient(135deg, #8B0000 0%, #C41E3A 100%)',
              borderRadius: '14px',
              padding: '14px 16px',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139,0,0,0.2)',
              transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(139,0,0,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,0,0,0.2)';
            }}
          >
            {/* Background pattern */}
            <div style={{
              position: 'absolute', right: -10, top: -10,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }} />
            <div style={{
              position: 'absolute', right: 16, bottom: -20,
              width: 50, height: 50, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }} />

            {/* Content */}
            <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {DAYS[today.day()]}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '38px', fontWeight: '800', color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {today.format('DD')}
              </span>
              <div style={{ paddingBottom: '4px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
                  {MONTHS[today.month()]}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.2 }}>
                  {today.format('YYYY')}
                </p>
              </div>
            </div>

            {/* Today events count chip */}
            {!loading && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
                  padding: '3px 10px', fontSize: '11px', fontWeight: '600', color: '#fff',
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: todayEvents.length > 0 ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                    display: 'inline-block',
                    boxShadow: todayEvents.length > 0 ? '0 0 0 3px rgba(74,222,128,0.25)' : 'none',
                  }} />
                  {todayEvents.length > 0
                    ? `${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today`
                    : 'No events today'}
                </div>
              </div>
            )}
          </div>

          {/* ── SEARCH BAR ─────────────────────────────────────── */}
          <div style={{ padding: '0 12px 10px', flexShrink: 0 }}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-8 text-[13px] text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#8B0000]/30 focus:ring-2 focus:ring-[#8B0000]/10"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
              )}
            </div>
          </div>

          {/* Event count + Filters (Compact Horizontal) */}
          <div style={{ padding: '0 12px 12px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Filter Categories
              </span>
            </div>

            <FilterBar
              activeTypes={activeTypes}
              onToggle={handleToggleType}
              eventCounts={eventCounts}
            />

            {/* Date Range Filter Button */}
            <button
              onClick={() => setIsDateFilterOpen(true)}
              style={{
                marginTop: '10px',
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: '10px', border: `1.5px solid ${(dateFrom || dateTo) ? '#8B0000' : '#E5E7EB'}`,
                background: (dateFrom || dateTo) ? '#FFF5F5' : '#F9FAFB',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#8B0000'}
              onMouseLeave={e => e.currentTarget.style.borderColor = (dateFrom || dateTo) ? '#8B0000' : '#E5E7EB'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <svg width="14" height="14" fill="none" stroke={(dateFrom || dateTo) ? '#8B0000' : '#6B7280'} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span style={{ fontSize: '12px', fontWeight: '600', color: (dateFrom || dateTo) ? '#8B0000' : '#6B7280' }}>
                  {(dateFrom || dateTo)
                    ? `${dateFrom ? dayjs(dateFrom).format('D MMM') : '…'} → ${dateTo ? dayjs(dateTo).format('D MMM') : '…'}`
                    : 'Date Range Filter'}
                </span>
              </div>
              {(dateFrom || dateTo) ? (
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#8B0000', background: '#FECACA', padding: '2px 7px', borderRadius: '10px' }}>
                  {dateRangeEvents.length}
                </span>
              ) : (
                <svg width="14" height="14" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              )}
            </button>

            {/* Export Schedule Button */}
            {!loading && events.length > 0 && (
              <button
                onClick={handleExportAllICS}
                style={{
                  marginTop: '10px',
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
                  background: '#fff', color: '#1F2937', fontWeight: '700', fontSize: '12px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff'; }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export Schedule (.ics)
              </button>
            )}
          </div>

          {/* Upcoming section (Takes remaining space) */}
          {!loading && events.length > 0 && (
            <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                Upcoming Events
              </p>
              <UpcomingList
                events={events}
                onEventClick={(e) => { setSelectedEvent(e); setIsSidebarOpen(false); }}
                limit={15}
              />
            </div>
          )}
        </aside>

        {/* ── CALENDAR MAIN AREA ──────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">

          {/* ── HAPPENING TODAY BANNER ───────────────────────────────────── */}
          {!loading && todayEvents.length > 0 && !todayBannerDismissed && (
            <div style={{
              background: 'linear-gradient(90deg, #FFF5F5 0%, #FFF0F0 100%)',
              borderBottom: '1px solid #FECACA',
              padding: '8px 16px',
              display: 'flex', alignItems: 'center', gap: '10px',
              flexShrink: 0,
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#EF4444', flexShrink: 0,
                boxShadow: '0 0 0 3px rgba(239,68,68,0.2)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <p style={{ fontSize: '12.5px', color: '#991B1B', fontWeight: '600', flex: 1 }}>
                <span style={{ fontWeight: '800' }}>{todayEvents.length} event{todayEvents.length > 1 ? 's' : ''}</span>
                {' '}happening today —{' '}
                {todayEvents.slice(0, 2).map(e => e.title).join(', ')}
                {todayEvents.length > 2 ? ` +${todayEvents.length - 2} more` : ''}
              </p>
              <button
                onClick={() => setTodayBannerDismissed(true)}
                style={{
                  background: 'none', border: 'none',
                  color: '#F87171', cursor: 'pointer',
                  fontSize: '13px', padding: '2px 4px',
                  borderRadius: '4px', flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="lpu-spinner" />
              <p className="text-gray-400 text-sm">Loading your academic events...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="m-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-800">{error}</p>
                <button onClick={refetch} className="text-xs text-red-600 underline hover:text-red-800 mt-1">
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Empty state — no events match filters */}
          {!loading && !error && dateRangeEvents.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '16px', padding: '40px 20px',
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="80" height="80" rx="20" fill="#FFF5F5"/>
                <rect x="16" y="22" width="48" height="42" rx="6" fill="#FECACA" stroke="#FCA5A5" strokeWidth="1.5"/>
                <rect x="16" y="22" width="48" height="12" rx="6" fill="#8B0000"/>
                <rect x="26" y="22" width="4" height="8" rx="2" fill="white" opacity="0.5"/>
                <rect x="50" y="22" width="4" height="8" rx="2" fill="white" opacity="0.5"/>
                <circle cx="40" cy="52" r="8" fill="white"/>
                <path d="M36 52l3 3 5-5" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937', marginBottom: '6px' }}>
                  No events found
                </p>
                <p style={{ fontSize: '13px', color: '#9CA3AF', maxWidth: '260px', lineHeight: 1.6 }}>
                  {search
                    ? `No results for "${search}". Try a different keyword.`
                    : 'No events match the selected filters. Try enabling more categories.'}
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                style={{
                  padding: '9px 20px', borderRadius: '10px',
                  background: '#8B0000', color: '#fff',
                  fontSize: '13px', fontWeight: '600',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s',
                  boxShadow: '0 2px 8px rgba(139,0,0,0.25)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#A31515'}
                onMouseLeave={e => e.currentTarget.style.background = '#8B0000'}
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Calendar */}
          {!loading && dateRangeEvents.length > 0 && (
            <div className="flex-1 overflow-hidden min-h-0">
              <CalendarView 
                events={dateRangeEvents} 
                onEventClick={setSelectedEvent} 
                onOpenDateFilter={() => setIsDateFilterOpen(true)} 
                filterStartDate={dateFrom}
                filterEndDate={dateTo}
              />
            </div>
          )}
        </main>
      </div>

      {/* ── EVENT POPUP ─────────────────────────────────────────────────── */}
      {selectedEvent && (
        <EventPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* ── TODAY'S EVENTS MODAL ─────────────────────────────────────── */}
      {isTodayModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsTodayModalOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #8B0000 0%, #C41E3A 100%)', padding: '20px 20px 16px', flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    {today.format('dddd')}
                  </p>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>
                    Today's Events
                  </h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>
                    {today.format('D MMMM YYYY')}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => setIsTodayModalOpen(false)}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                    {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
              {todayEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {todayEvents.map(event => {
                    const sourceConfig = API_CONFIG.sources.find(s => s.id.toUpperCase() === event.type?.toUpperCase());
                    const color = sourceConfig?.color || event.color || '#8B0000';
                    const startD = dayjs(event.start);
                    const endD = dayjs(event.end);
                    const isAllDay = startD.format('HH:mm') === '00:00' && (
                      endD.format('HH:mm') === '00:00' || endD.format('HH:mm') === '23:59'
                    );
                    return (
                      <button
                        key={event.id}
                        onClick={() => { setSelectedEvent(event); setIsTodayModalOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'stretch', gap: '0',
                          background: '#fff', border: `1px solid ${color}25`,
                          borderRadius: '14px', overflow: 'hidden',
                          cursor: 'pointer', width: '100%', textAlign: 'left',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${color}30`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {/* Color accent strip */}
                        <div style={{ width: '5px', background: color, flexShrink: 0 }} />
                        {/* Content */}
                        <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', lineHeight: 1.3 }}>{event.title}</span>
                            {sourceConfig && (
                              <span style={{ fontSize: '10px', fontWeight: '700', color: '#fff', background: color, padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {sourceConfig.label}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                            {!isAllDay && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151', fontWeight: '600' }}>
                                <svg width="13" height="13" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                {startD.format('h:mm A')}{event.end ? ` – ${endD.format('h:mm A')}` : ''}
                              </span>
                            )}
                            {isAllDay && (
                              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>All day</span>
                            )}
                            {event.venue && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                {event.venue}
                              </span>
                            )}
                            {event.subject && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                                {event.subject}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5, marginTop: '2px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {event.description}
                            </p>
                          )}
                        </div>
                        {/* Arrow */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', color: '#D1D5DB' }}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937', marginBottom: '6px' }}>All clear today!</p>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.6 }}>No events scheduled for today.<br/>Enjoy your free time!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DATE RANGE FILTER MODAL ─────────────────────────────────────── */}
      {isDateFilterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsDateFilterOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>Filter by Date Range</h2>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>Find events in a specific period</p>
                </div>
                <button
                  onClick={() => setIsDateFilterOpen(false)}
                  style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* ── SMART DATE PICKER ─────────────────────────────────── */}
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Quick Range Pills — FIRST for mobile-first speed */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                  ⚡ Quick Select
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                  {[
                    { label: 'Today', emoji: '📌', from: today.format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') },
                    { label: 'This Week', emoji: '📅', from: today.startOf('week').format('YYYY-MM-DD'), to: today.endOf('week').format('YYYY-MM-DD') },
                    { label: 'This Month', emoji: '📆', from: today.startOf('month').format('YYYY-MM-DD'), to: today.endOf('month').format('YYYY-MM-DD') },
                    { label: 'Next 7 Days', emoji: '⏩', from: today.format('YYYY-MM-DD'), to: today.add(7, 'day').format('YYYY-MM-DD') },
                    { label: 'Next 30 Days', emoji: '📆', from: today.format('YYYY-MM-DD'), to: today.add(30, 'day').format('YYYY-MM-DD') },
                    { label: 'Next 3 Months', emoji: '🚀', from: today.format('YYYY-MM-DD'), to: today.add(3, 'month').format('YYYY-MM-DD') },
                  ].map(range => {
                    const isActive = dateFrom === range.from && dateTo === range.to;
                    return (
                      <button
                        key={range.label}
                        onClick={() => { setDateFrom(range.from); setDateTo(range.to); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '11px 14px', borderRadius: '12px', border: '2px solid',
                          borderColor: isActive ? '#8B0000' : '#F3F4F6',
                          background: isActive ? '#8B0000' : '#F9FAFB',
                          color: isActive ? '#fff' : '#374151',
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                          transition: 'all 0.15s', textAlign: 'left',
                          boxShadow: isActive ? '0 4px 12px rgba(139,0,0,0.25)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{range.emoji}</span>
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: '#F3F4F6' }} />
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', letterSpacing: '0.06em' }}>OR CUSTOM RANGE</span>
                <div style={{ flex: 1, height: '1px', background: '#F3F4F6' }} />
              </div>

              {/* Custom Inline Calendar Selector */}
              <CustomDatePicker 
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChange={(from, to) => {
                  setDateFrom(from);
                  setDateTo(to);
                }}
              />

              {/* Results preview */}
              {(dateFrom || dateTo) && (
                <div style={{
                  background: dateRangeEvents.length > 0 ? '#F0FDF4' : '#FFF5F5',
                  border: `1px solid ${dateRangeEvents.length > 0 ? '#BBF7D0' : '#FECACA'}`,
                  borderRadius: '12px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: dateRangeEvents.length > 0 ? '#166534' : '#991B1B', marginBottom: '2px' }}>
                      {dateRangeEvents.length} event{dateRangeEvents.length !== 1 ? 's' : ''} found
                    </p>
                    <p style={{ fontSize: '11.5px', color: '#6B7280' }}>
                      {dateFrom ? dayjs(dateFrom).format('D MMM YYYY') : '…'} → {dateTo ? dayjs(dateTo).format('D MMM YYYY') : '…'}
                    </p>
                  </div>
                  {dateRangeEvents.length > 0 && <span style={{ fontSize: '22px' }}>✅</span>}
                </div>
              )}
            </div>

            {/* Results list */}
            {dateRangeEvents.length > 0 && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid #F3F4F6', marginTop: '4px', paddingTop: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Matching Events</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dateRangeEvents.map(event => {
                    const sourceConfig = API_CONFIG.sources.find(s => s.id.toUpperCase() === event.type?.toUpperCase());
                    const color = sourceConfig?.color || event.color || '#8B0000';
                    return (
                      <button
                        key={event.id}
                        onClick={() => { setSelectedEvent(event); setIsDateFilterOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', borderRadius: '10px',
                          background: `${color}08`, border: `1px solid ${color}20`,
                          cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = `${color}15`}
                        onMouseLeave={e => e.currentTarget.style.background = `${color}08`}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                          {sourceConfig?.icon || '📅'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
                          <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{dayjs(event.start).format('ddd, D MMM YYYY')} · {dayjs(event.start).format('h:mm A')}</p>
                        </div>
                        <svg width="16" height="16" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </div>

            {/* Footer actions */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: '10px', flexShrink: 0 }}>
              {(dateFrom || dateTo) && (
                <button
                  onClick={handleClearDateFilter}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsDateFilterOpen(false)}
                style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: '#8B0000', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
