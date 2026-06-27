import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';

dayjs.extend(isToday);

export default function CustomDatePicker({ dateFrom, dateTo, onChange }) {
  // Use today as fallback if no date is selected
  const [currentMonth, setCurrentMonth] = useState(() => 
    dateFrom ? dayjs(dateFrom).startOf('month') : dayjs().startOf('month')
  );

  const handlePrevMonth = () => setCurrentMonth(prev => prev.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(prev => prev.add(1, 'month'));

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = currentMonth.startOf('month').day(); // 0 is Sunday
  
  // Create an array of days
  const calendarDays = useMemo(() => {
    const days = [];
    // empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(currentMonth.date(i));
    }
    return days;
  }, [currentMonth, daysInMonth, startDay]);

  const handleDayClick = (day) => {
    if (!day) return;
    const formatted = day.format('YYYY-MM-DD');

    if (!dateFrom || (dateFrom && dateTo)) {
      // Start new selection
      onChange(formatted, '');
    } else {
      // We have dateFrom, but no dateTo
      if (day.isBefore(dayjs(dateFrom), 'day')) {
        // Selected a date before the start date, make it the new start date
        onChange(formatted, '');
      } else {
        onChange(dateFrom, formatted);
      }
    }
  };

  const isSelected = (day) => {
    if (!day) return false;
    const f = day.format('YYYY-MM-DD');
    return f === dateFrom || f === dateTo;
  };

  const isInRange = (day) => {
    if (!day || !dateFrom || !dateTo) return false;
    return day.isAfter(dayjs(dateFrom), 'day') && day.isBefore(dayjs(dateTo), 'day');
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
        <button 
          onClick={handlePrevMonth} 
          className="w-8 h-8 flex items-center justify-center hover:bg-[#F3F4F6] rounded-full text-[#6B7280] transition-colors"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span className="text-[15px] font-bold text-[#111827]">{currentMonth.format('MMMM YYYY')}</span>
        <button 
          onClick={handleNextMonth} 
          className="w-8 h-8 flex items-center justify-center hover:bg-[#F3F4F6] rounded-full text-[#6B7280] transition-colors"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            
            const selected = isSelected(day);
            const inRange = isInRange(day);
            const isToday = day.isToday();
            
            let bgClass = 'hover:bg-[#F3F4F6] bg-transparent';
            let textClass = 'text-[#374151] font-medium';
            
            if (selected) {
              bgClass = 'bg-[#8B0000] shadow-md shadow-[#8B0000]/20';
              textClass = 'text-white font-bold';
            } else if (inRange) {
              bgClass = 'bg-[#FFF5F5] rounded-none';
              textClass = 'text-[#8B0000] font-bold';
            } else if (isToday) {
              textClass = 'text-[#8B0000] font-bold';
              bgClass = 'hover:bg-[#FFF5F5] bg-transparent border border-[#8B0000]/30';
            }

            // Adjust border radius for range visual continuity
            let roundedClass = 'rounded-lg';
            if (inRange) roundedClass = ''; // Flat sides
            if (selected && dateFrom && dateTo && dateFrom !== dateTo) {
              if (day.format('YYYY-MM-DD') === dateFrom) roundedClass = 'rounded-l-lg rounded-r-none';
              if (day.format('YYYY-MM-DD') === dateTo) roundedClass = 'rounded-r-lg rounded-l-none';
            }

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(day)}
                className={`h-10 w-full flex items-center justify-center text-[14px] transition-all ${roundedClass} ${bgClass} ${textClass}`}
              >
                {day.date()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
