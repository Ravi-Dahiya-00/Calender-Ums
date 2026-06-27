import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const TYPE_META = {
  MTE:      { label: 'Mid Term Exam',        bg: '#FEF2F2', border: '#FECACA', badge: '#DC2626', text: '#991B1B', icon: '📝' },
  ETE:      { label: 'End Term Exam',         bg: '#F5F3FF', border: '#DDD6FE', badge: '#7C3AED', text: '#5B21B6', icon: '📋' },
  CA:       { label: 'Continuous Assessment', bg: '#FFFBEB', border: '#FDE68A', badge: '#D97706', text: '#92400E', icon: '✏️' },
  HOLIDAY:  { label: 'Holiday',               bg: '#ECFDF5', border: '#A7F3D0', badge: '#059669', text: '#065F46', icon: '🎉' },
  WORKSHOP: { label: 'Workshop',              bg: '#ECFEFF', border: '#A5F3FC', badge: '#0891B2', text: '#164E63', icon: '🔧' },
  EVENT:    { label: 'Event',                 bg: '#FDF2F8', border: '#F9A8D4', badge: '#DB2777', text: '#9D174D', icon: '🎯' },
  DEADLINE: { label: 'Deadline',              bg: '#FFF1F2', border: '#FECDD3', badge: '#E11D48', text: '#9F1239', icon: '⚠️' },
};

function getCountdownInfo(startDate) {
  const d = dayjs(startDate);
  if (d.isToday()) return { label: '🔴 Today', color: '#DC2626', bg: '#FEF2F2', urgent: true };
  if (d.isTomorrow()) return { label: '🟠 Tomorrow', color: '#D97706', bg: '#FFFBEB', urgent: true };
  const daysAway = d.diff(dayjs().startOf('day'), 'day');
  if (daysAway > 0) return { label: `In ${daysAway} day${daysAway === 1 ? '' : 's'}`, color: '#6B7280', bg: '#F9FAFB', urgent: false };
  const daysAgo = Math.abs(daysAway);
  return { label: `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`, color: '#9CA3AF', bg: '#F9FAFB', urgent: false };
}

export default function EventPopup({ event, onClose }) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!event) return null;

  const start = dayjs(event.start);
  const end = dayjs(event.end);
  const now = dayjs();
  const isLive = now.isAfter(start) && now.isBefore(end);
  const liveProgress = isLive
    ? Math.min(100, Math.max(0, (now.diff(start, 'second') / end.diff(start, 'second')) * 100))
    : 0;
  // All-day: start at 00:00 AND (end at 00:00 next day OR end at 23:59 same day)
  const isAllDay = start.format('HH:mm') === '00:00' && (
    end.format('HH:mm') === '00:00' || end.format('HH:mm') === '23:59'
  );
  const isMultiDay = !start.isSame(end, 'day');
  const meta = TYPE_META[event.type] || { label: event.type, bg: '#F9FAFB', border: '#E5E7EB', badge: '#6B7280', text: '#374151', icon: '📅' };
  const countdown = getCountdownInfo(event.start);

  const handleDownloadICS = () => {
    const s = start.format('YYYYMMDDTHHmm00');
    const e = end.format('YYYYMMDDTHHmm00');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LPU Academic Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id || Date.now()}@lpu.edu`,
      `DTSTAMP:${dayjs().format('YYYYMMDDTHHmm00')}Z`,
      `DTSTART:${s}`,
      `DTEND:${e}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.venue || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(event.title).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      className="animate-fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '460px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
        className="animate-fade-in-up"
      >
        {/* Colored top bar — thicker, gradient; LIVE gets a green stripe */}
        <div style={{
          height: '5px',
          background: isLive
            ? 'linear-gradient(90deg, #16A34A, #22C55E)'
            : `linear-gradient(90deg, ${event.color || '#8B0000'}, ${event.color || '#8B0000'}aa)`,
        }} />

        {/* Live progress bar */}
        {isLive && (
          <div style={{ height: '2px', background: '#D1FAE5', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${liveProgress}%`, background: '#16A34A',
              transition: 'width 1s linear',
            }} />
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              {/* Type badge + countdown */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {isLive && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '10.5px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: '20px',
                    background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D',
                  }}>
                    <span className="live-dot" style={{ '--live-color': '#16A34A' }} />
                    Happening Now
                  </span>
                )}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: '20px',
                  background: meta.bg, border: `1px solid ${meta.border}`, color: meta.badge,
                }}>
                  {meta.icon} {meta.label}
                </span>
                {!isLive && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: '10.5px', fontWeight: '700',
                    padding: '3px 10px', borderRadius: '20px',
                    background: countdown.bg, color: countdown.color,
                    border: `1px solid ${countdown.urgent ? `${countdown.color}40` : '#E5E7EB'}`,
                    letterSpacing: '0.02em',
                  }}>
                    {countdown.label}
                  </span>
                )}
              </div>

              {/* Branch / Semester tags */}
              {(event.branch && event.branch !== 'ALL' || event.semester) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {event.branch && event.branch !== 'ALL' && (
                    <span style={{ fontSize: '10.5px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#F3F4F6', color: '#6B7280' }}>
                      {event.branch}
                    </span>
                  )}
                  {event.semester && (
                    <span style={{ fontSize: '10.5px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#F3F4F6', color: '#6B7280' }}>
                      Sem {event.semester}
                    </span>
                  )}
                </div>
              )}

              {/* Title */}
              <h2 style={{
                fontSize: '18px', fontWeight: '800', color: '#111827',
                lineHeight: '1.25', letterSpacing: '-0.02em',
              }}>
                {event.title}
              </h2>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: '#F3F4F6', color: '#9CA3AF',
                fontSize: '14px', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '13px', overflowY: 'auto', flex: 1 }}>

          {/* Date */}
          <InfoRow icon={<CalIcon />} label="Date">
            {isAllDay || isMultiDay
              ? `${start.format('ddd, DD MMM YYYY')}${isMultiDay ? ` – ${end.format('DD MMM YYYY')}` : ''}`
              : start.format('dddd, DD MMMM YYYY')
            }
          </InfoRow>

          {/* Time */}
          {!isAllDay && (
            <InfoRow icon={<ClockIcon />} label="Time">
              {start.format('h:mm A')} – {end.format('h:mm A')}
              {' '}
              <span style={{ color: '#9CA3AF', fontSize: '11.5px' }}>
                ({Math.abs(end.diff(start, 'minute'))} min)
              </span>
            </InfoRow>
          )}

          {/* Venue */}
          {event.venue && (
            <InfoRow icon={<PinIcon />} label="Venue">{event.venue}</InfoRow>
          )}

          {/* Subject */}
          {event.subject && (
            <InfoRow icon={<BookIcon />} label="Subject">{event.subject}</InfoRow>
          )}

          {/* Description */}
          {event.description && (
            <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '13px 14px', border: '1px solid #F3F4F6' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Notes</p>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.65' }}>{event.description}</p>
            </div>
          )}

          {/* Dynamic metadata grid */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(event.metadata).map(([key, value]) => (
                <div key={key} style={{
                  background: '#F9FAFB', borderRadius: '12px', padding: '11px 13px',
                  border: '1px solid #F3F4F6',
                }}>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'capitalize', marginBottom: '3px', letterSpacing: '0.04em', fontWeight: '600' }}>
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>{String(value)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '13px 22px', borderTop: '1px solid #F3F4F6', flexShrink: 0,
          background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '8px',
        }}>
          {/* Copy title */}
          <button
            onClick={handleCopyTitle}
            title="Copy event title"
            style={{
              padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB',
              background: copied ? '#F0FDF4' : '#fff', color: copied ? '#16A34A' : '#6B7280',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            {copied ? '✓ Copied' : (
              <>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2"/>
                </svg>
                Copy
              </>
            )}
          </button>

          <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
            <button
              onClick={handleDownloadICS}
              style={{
                padding: '7px 12px', borderRadius: '9px', border: '1px solid #E5E7EB',
                background: '#fff', color: '#374151', fontSize: '12.5px', fontWeight: '600',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
            >
              <span>📅</span> Add to Calendar
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '7px 18px', borderRadius: '9px', border: 'none',
                background: '#8B0000', color: '#fff', fontSize: '12.5px', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: '0 2px 8px rgba(139,0,0,0.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#A31515'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,0,0,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#8B0000'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,0,0,0.25)'; }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{
        color: '#9CA3AF', marginTop: '1px', flexShrink: 0,
        width: 32, height: 32, borderRadius: '8px',
        background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ paddingTop: '6px' }}>
        <p style={{ fontSize: '10.5px', color: '#9CA3AF', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: '13.5px', color: '#1F2937', fontWeight: '500', lineHeight: 1.4 }}>{children}</p>
      </div>
    </div>
  );
}

const CalIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8"/>
    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" strokeWidth="1.8"/>
    <path d="M12 7v5l3 3" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const PinIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="1.8"/>
    <circle cx="12" cy="9" r="2.5" strokeWidth="1.8"/>
  </svg>
);
const BookIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeWidth="1.8"/>
  </svg>
);
