import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import isBetween from 'dayjs/plugin/isBetween';
import API_CONFIG from '../config/api-config';
import CustomDatePicker from './CustomDatePicker';

dayjs.extend(isBetween);

// Helper to determine text color based on background luminance
function getContrastColor(hexColor) {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // If bright, use dark text. If dark, use white text.
  return luminance > 0.55 ? '#111827' : '#ffffff';
}

const localizer = dayjsLocalizer(dayjs);

// ── Helper ───────────────────────────────────────────────────────────────────
function isLiveNow(event) {
  const now = dayjs();
  return now.isAfter(dayjs(event.start)) && now.isBefore(dayjs(event.end));
}

// ── Custom Toolbar ──────────────────────────────────────────────────────────
function CustomToolbar({ label, onNavigate, onView, view, onOpenDateFilter }) {
  const views = [
    { key: 'month',  label: 'Month',    icon: '▦' },
    { key: 'week',   label: 'Week',     icon: '▤' },
    { key: 'day',    label: 'Day',      icon: '◧' },
    { key: 'agenda', label: 'Schedule', icon: '☰' }
  ];
  
  // Map 'view' string to navigation labels (e.g., month -> 'Month', week -> 'Week')
  const navLabel = view.charAt(0).toUpperCase() + view.slice(1);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-3 border-b border-gray-100 bg-white gap-3 w-full shrink-0 shadow-sm z-10 relative">
      
      {/* Date Navigation */}
      <div className="flex items-center justify-between w-full md:w-auto bg-gray-50/80 rounded-xl p-1 border border-gray-200/60 shadow-inner">
        <button
          onClick={() => onNavigate('PREV')}
          title={navLabel ? `Previous ${navLabel}` : 'Previous'}
          className="flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <label className="flex items-center gap-2 px-3 relative cursor-pointer hover:bg-gray-100 rounded-lg transition-colors py-1 group" title="Jump to date">
          <svg width="15" height="15" fill="none" stroke="#8B0000" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span className="text-[14px] md:text-[15px] font-extrabold text-gray-800 whitespace-nowrap min-w-[120px] text-center tracking-tight">
            {label}
          </span>
          <input
            type="date"
            className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-');
                const newDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                onNavigate('DATE', newDate);
              }
            }}
          />
        </label>

        <button
          onClick={() => onNavigate('NEXT')}
          title={navLabel ? `Next ${navLabel}` : 'Next'}
          className="flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7-7"/>
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <button
          onClick={() => onNavigate('TODAY')}
          className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-red-100 bg-red-50 text-[#8B0000] text-sm font-bold shadow-sm transition-all hover:bg-[#8B0000] hover:text-white hover:border-[#8B0000]"
        >
          Today
        </button>

        {/* Filter Button */}
        <button
          onClick={onOpenDateFilter}
          className="shrink-0 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center border border-gray-200 shadow-sm"
          title="Filter events"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>

        {/* View Switcher */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-[2] md:flex-none shadow-inner overflow-x-auto no-scrollbar">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => onView(v.key)}
              title={v.label}
              className={`shrink-0 flex-1 md:flex-none px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all text-[12px] font-bold whitespace-nowrap ${
                view === v.key 
                  ? 'bg-white text-[#8B0000] shadow-sm ring-1 ring-gray-200/50' 
                  : 'bg-transparent text-gray-500 hover:bg-gray-200/50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarView({ events, onEventClick, onOpenDateFilter, filterStartDate, filterEndDate }) {
  const [view, setView] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768 ? 'agenda' : 'month');
  const [date, setDate] = useState(new Date());

  // Jump to the start date if a date filter is applied
  useEffect(() => {
    if (filterStartDate) {
      setDate(new Date(filterStartDate));
    }
  }, [filterStartDate]);

  // Calculate length for agenda view based on filter
  const agendaLength = useMemo(() => {
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);
      // Calculate days difference
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Give it +1 to be inclusive, but limit to some reasonable max like 365 days
      return Math.min(diffDays + 1, 365);
    }
    return 30; // default for react-big-calendar
  }, [filterStartDate, filterEndDate]);

  // Tick every 30 s so LIVE badges refresh automatically
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Auto-switch view on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && view === 'month') setView('agenda');
      else if (window.innerWidth >= 768 && view === 'agenda') setView('month');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  const eventStyleGetter = useCallback((event) => {
    const sourceConfig = API_CONFIG.sources.find(s => s.id.toUpperCase() === event.type?.toUpperCase());
    const backgroundColor = sourceConfig?.color || event.color || '#8B0000';
    const textColor = getContrastColor(backgroundColor);
    const live = isLiveNow(event);

    return {
      style: {
        backgroundColor,
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '8px',
        color: textColor,
        padding: '3px',
        cursor: 'pointer',
        boxShadow: live 
          ? `0 0 0 2px #fff, 0 0 0 4px ${backgroundColor}, 0 4px 15px ${backgroundColor}80` 
          : 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 6px rgba(0,0,0,0.06)',
        textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.15)' : 'none',
        outline: 'none',
        zIndex: live ? 10 : undefined,
      },
    };
  }, []);

  const EventComponent = useCallback(({ event }) => {
    const live = isLiveNow(event);
    const sourceConfig = API_CONFIG.sources.find(s => s.id.toUpperCase() === event.type?.toUpperCase());
    const backgroundColor = sourceConfig?.color || event.color || '#8B0000';
    const textColor = getContrastColor(backgroundColor);
    const isDark = textColor === '#111827';
    
    return (
      <div className="event-content-wrapper" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', overflow: 'hidden', padding: '1px 2px' }}>
        {live ? (
          <span className="live-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.25)', 
            borderRadius: '4px',
            padding: '2px 6px', fontSize: '9px', fontWeight: '800',
            letterSpacing: '0.08em', flexShrink: 0, marginTop: '1px',
            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            <span className="live-dot" style={{ width: 6, height: 6, background: textColor }} />
            <span className="live-text">LIVE</span>
          </span>
        ) : (
          <span className="event-icon" style={{ flexShrink: 0, fontSize: '13px', marginTop: '-1px' }}>{event.sourceIcon}</span>
        )}
        <span className="event-title-text" style={{ 
          overflow: 'hidden', 
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
          lineHeight: 1.3, fontSize: '12px', fontWeight: '600'
        }}>
          {event.title}
        </span>
      </div>
    );
  }, []);

  const components = useMemo(() => ({
    event: EventComponent,
    toolbar: (props) => <CustomToolbar {...props} onOpenDateFilter={onOpenDateFilter} />,
  }), [EventComponent, onOpenDateFilter]);

  return (
    <div className="rbc-wrap" style={{ height: '100%' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        date={date}
        length={agendaLength}
        onView={setView}
        onNavigate={setDate}
        onSelectEvent={onEventClick}
        eventPropGetter={eventStyleGetter}
        components={components}
        popup
        style={{ height: '100%' }}
        views={['month', 'week', 'day', 'agenda']}
        messages={{
          noEventsInRange: 'No events scheduled.',
          showMore: (count) => `+${count} more`,
          today: 'Today',
          previous: 'Back',
          next: 'Next',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          agenda: 'Schedule',
          date: 'Date',
          time: 'Time',
          event: 'Event',
        }}
      />
    </div>
  );
}
