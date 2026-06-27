import React from 'react';
import API_CONFIG from '../config/api-config';

/**
 * FilterBar — vertical (sidebar) or horizontal (bar) mode
 */
export default function FilterBar({ activeTypes, onToggle, eventCounts = {}, vertical = false }) {
  const sources = API_CONFIG.sources.filter(s => s.enabled);

  if (vertical) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sources.map(source => {
          const isActive = activeTypes.includes(source.id.toUpperCase());
          const count = eventCounts[source.id.toUpperCase()] || 0;
          return (
            <button
              key={source.id}
              onClick={() => onToggle(source.id.toUpperCase())}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 8px', borderRadius: '8px', border: 'none',
                background: isActive ? `${source.color}12` : 'transparent',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'all 0.15s',
                position: 'relative',
                overflow: 'hidden',
              }}
              className="filter-item"
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Active left-accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: '20%', bottom: '20%',
                width: isActive ? '3px' : '0px',
                background: source.color,
                borderRadius: '0 3px 3px 0',
                transition: 'width 0.2s ease',
              }} />

              {/* Color dot with checkmark */}
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: isActive ? source.color : '#E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: isActive ? `0 0 0 3px ${source.color}22` : 'none',
              }}>
                {isActive && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {!isActive && (
                  <span style={{ fontSize: '9px' }}>{source.icon}</span>
                )}
              </div>

              <span style={{
                fontSize: '12.5px', fontWeight: isActive ? '600' : '400',
                color: isActive ? '#1F2937' : '#6B7280', flex: 1,
                letterSpacing: '-0.01em',
              }}>
                {source.label}
              </span>

              {count > 0 ? (
                <span style={{
                  fontSize: '10px', fontWeight: '700',
                  color: isActive ? '#fff' : '#9CA3AF',
                  background: isActive ? source.color : '#F3F4F6',
                  padding: '1px 6px', borderRadius: '20px',
                  minWidth: '20px', textAlign: 'center',
                  transition: 'all 0.2s',
                }}>
                  {count}
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: '#D1D5DB' }}>—</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Horizontal pill mode
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      {sources.map(source => {
        const isActive = activeTypes.includes(source.id.toUpperCase());
        return (
          <button
            key={source.id}
            onClick={() => onToggle(source.id.toUpperCase())}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '20px', border: '1.5px solid',
              borderColor: isActive ? source.color : '#E5E7EB',
              background: isActive ? source.color : 'transparent',
              color: isActive ? '#fff' : '#6B7280',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '10px' }}>{source.icon}</span>
            {source.label}
          </button>
        );
      })}
    </div>
  );
}
