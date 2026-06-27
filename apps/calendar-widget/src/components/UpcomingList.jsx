import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import API_CONFIG from '../config/api-config';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

function isLiveNow(event) {
  const now = dayjs();
  return now.isAfter(dayjs(event.start)) && now.isBefore(dayjs(event.end));
}

function getLiveProgress(event) {
  const now = dayjs();
  const total = dayjs(event.end).diff(dayjs(event.start), 'second');
  const elapsed = now.diff(dayjs(event.start), 'second');
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function getUrgency(startDate) {
  const d = dayjs(startDate);
  if (d.isToday()) return { label: 'Today', bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' };
  if (d.isTomorrow()) return { label: 'Tomorrow', bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' };
  const daysAway = d.diff(dayjs().startOf('day'), 'day');
  if (daysAway <= 7) return { label: `In ${daysAway}d`, bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' };
  return { label: d.format('DD MMM'), bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' };
}

export default function UpcomingList({ events, onEventClick, limit = 8 }) {
  const now = dayjs();

  const upcoming = events
    // Include events that are currently happening OR start in the future
    .filter(e => dayjs(e.end).isAfter(now))
    .sort((a, b) => {
      // Ongoing events bubble to top
      const aLive = isLiveNow(a) ? 0 : 1;
      const bLive = isLiveNow(b) ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(a.start) - new Date(b.start);
    })
    .slice(0, limit);

  if (upcoming.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 8px' }}>
        <div style={{ fontSize: '22px', marginBottom: '6px' }}>📭</div>
        <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>
          No upcoming events
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {upcoming.map(event => {
        const start = dayjs(event.start);
        const isAllDay = start.format('HH:mm') === '00:00' && (
          dayjs(event.end).format('HH:mm') === '00:00' || dayjs(event.end).format('HH:mm') === '23:59'
        );
        const urgency = getUrgency(event.start);
        const live = isLiveNow(event);
        const progress = live ? getLiveProgress(event) : 0;

        const sourceConfig = API_CONFIG.sources.find(s => s.id.toUpperCase() === event.type?.toUpperCase());
        const eventColor = sourceConfig?.color || event.color || '#8B0000';


        return (
          <button
            key={event.id}
            onClick={() => onEventClick(event)}
            style={{
              display: 'flex', alignItems: 'stretch', gap: '10px',
              padding: '8px 6px', borderRadius: '10px', border: 'none',
              background: live ? `${eventColor}0D` : 'transparent',
              cursor: 'pointer', width: '100%', textAlign: 'left',
              transition: 'all 0.15s',
              position: 'relative',
              overflow: 'hidden',
              outline: live ? `1.5px solid ${eventColor}30` : 'none',
            }}
            className="upcoming-item"
            onMouseEnter={e => e.currentTarget.style.background = live ? `${eventColor}18` : '#F9FAFB'}
            onMouseLeave={e => e.currentTarget.style.background = live ? `${eventColor}0D` : 'transparent'}
          >
            {/* Progress bar along the bottom — only for live events */}
            {live && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
                background: `${eventColor}20`,
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: eventColor,
                  borderRadius: '0 2px 2px 0',
                  transition: 'width 1s linear',
                }} />
              </div>
            )}

            {/* Left color bar — pulses for live */}
            <div style={{
              width: 3, borderRadius: '3px',
              background: eventColor,
              flexShrink: 0,
              opacity: live ? 1 : 0.7,
            }} className={live ? 'today-bar' : ''} />

            {/* Icon — show live dot overlay for live events */}
            <div style={{
              width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
              background: live ? `${eventColor}25` : `${eventColor}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', position: 'relative',
            }}>
              {event.sourceIcon || sourceConfig?.icon || '📅'}
              {live && (
                <span style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#22C55E', border: '1.5px solid #fff',
                }} className="live-dot-green" />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>

              {/* Title & Live badge / Type badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                <p style={{
                  fontSize: '13px', fontWeight: live ? '700' : '600', color: '#1F2937',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: 1.3, marginTop: '1px',
                }}>
                  {event.title}
                </p>
                {live ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '9px', fontWeight: '800', color: '#fff',
                    background: '#22C55E', padding: '2px 7px', borderRadius: '4px',
                    whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    <span className="live-dot" />
                    LIVE
                  </span>
                ) : sourceConfig && (
                  <span style={{
                    fontSize: '9px', fontWeight: '700', color: eventColor,
                    background: `${eventColor}15`, padding: '2px 6px', borderRadius: '4px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {sourceConfig.label}
                  </span>
                )}
              </div>

              {/* Sub-details (Subject / Venue) */}
              {(event.subject || event.venue) && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                  {event.subject && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                      {event.subject}
                    </span>
                  )}
                  {event.venue && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {event.venue}
                    </span>
                  )}
                </div>
              )}

              {/* Time row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                {live ? (
                  <span style={{
                    fontSize: '10px', fontWeight: '700', color: '#166534',
                    background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px',
                    letterSpacing: '0.02em', flexShrink: 0,
                  }}>
                    Ends {dayjs(event.end).format('h:mm A')}
                  </span>
                ) : (
                  <span style={{
                    fontSize: '10px', fontWeight: '700',
                    color: urgency.color, background: urgency.bg,
                    padding: '2px 6px', borderRadius: '4px',
                    letterSpacing: '0.02em', flexShrink: 0,
                  }}>
                    {urgency.label}
                  </span>
                )}
                {!isAllDay && (
                  <span style={{ fontSize: '11px', color: '#4B5563', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3.5px' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {live ? `${start.format('h:mm A')} – ${dayjs(event.end).format('h:mm A')}` : start.format('h:mm A')}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>

  );
}
