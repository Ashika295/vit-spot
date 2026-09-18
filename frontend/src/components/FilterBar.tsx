import React from 'react';
import { Search, X, Calendar, Clock, RotateCcw } from 'lucide-react';
import { DAYS, DAY_LABELS } from '../utils';

interface FilterBarProps {
  // Query Bar props
  selectedDay: string;
  selectedTime: string;
  selectedDuration: number;
  onDayChange: (day: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (duration: number) => void;
  onClearDateTime: () => void;

  // Filter props
  filterType: string;
  filterStatus: string;
  filterMinutes: number | null;
  searchQuery: string;
  onTypeChange: (t: string) => void;
  onStatusChange: (s: string) => void;
  onMinutesChange: (m: number | null) => void;
  onSearchChange: (s: string) => void;
}

const ROOM_TYPES = ['THEORY', 'LAB', 'SMART_CLASSROOM', 'RESEARCH_LAB'];
const ROOM_TYPE_LABELS: Record<string, string> = {
  THEORY: 'Theory Room',
  LAB: 'Specialized Lab',
  SMART_CLASSROOM: 'Smart Room',
  RESEARCH_LAB: 'Research Lab',
};
const STATUS_OPTIONS = ['AVAILABLE', 'OCCUPIED', 'ENDING_SOON'];
const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  ENDING_SOON: 'Ending Soon',
};
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10b981',
  OCCUPIED: '#f43f5e',
  ENDING_SOON: '#f59e0b',
};
const COMMON_TIMES = [
  { label: '8:30 AM', val: '08:30' },
  { label: '10:00 AM', val: '10:00' },
  { label: '11:30 AM', val: '11:30' },
  { label: '2:00 PM', val: '14:00' },
  { label: '3:30 PM', val: '15:30' },
  { label: '5:00 PM', val: '17:00' },
];
const DURATION_OPTIONS = [
  { label: '30m', val: 30 },
  { label: '50m (1 slot)', val: 50 },
  { label: '1 hour', val: 60 },
  { label: '1.5 hours', val: 90 },
  { label: '2 hours', val: 120 },
];

export default function FilterBar({
  selectedDay, selectedTime, selectedDuration,
  onDayChange, onTimeChange, onDurationChange, onClearDateTime,
  filterType, filterStatus, filterMinutes, searchQuery,
  onTypeChange, onStatusChange, onMinutesChange, onSearchChange,
}: FilterBarProps) {
  const isQueryActive = Boolean(selectedDay && selectedTime);

  return (
    <div className="space-y-4">
      {/* 1. DATE & TIME SELECTION SECTION */}
      <div
        className="glass-card rounded-2xl p-5"
        style={{
          background: 'rgba(17,24,39,0.9)',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} color="#818cf8" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.2px' }}>
              Check Availability by Day & Time
            </span>
            {isQueryActive && (
              <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                Active Query
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const now = new Date();
                const dayIndex = now.getDay();
                const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                const currentDay = dayMap[dayIndex] === 'SUN' ? 'MON' : dayMap[dayIndex];
                const hours = String(now.getHours()).padStart(2, '0');
                const mins = String(now.getMinutes()).padStart(2, '0');
                onDayChange(currentDay);
                onTimeChange(`${hours}:${mins}`);
              }}
              style={{
                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.2) 100%)',
                border: '1px solid rgba(16,185,129,0.4)', color: '#34d399',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                boxShadow: '0 0 10px rgba(16,185,129,0.15)',
              }}
              className="hover:bg-emerald-900/40 transition-all"
            >
              <span>⚡</span>
              <span>Right Now</span>
            </button>

            {isQueryActive && (
              <button
                onClick={onClearDateTime}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-800/60 px-2.5 py-1 rounded-lg border border-gray-700"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Day Selector Chips */}
        <div className="space-y-3">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Select Day
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(d => {
                const active = selectedDay === d;
                return (
                  <button
                    key={d}
                    onClick={() => onDayChange(active ? '' : d)}
                    style={{
                      padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.18s',
                      background: active ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                      color: active ? '#ffffff' : '#94a3b8',
                      boxShadow: active ? '0 0 15px rgba(99,102,241,0.4)' : 'none',
                    }}
                  >
                    {DAY_LABELS[d]} ({d})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Duration row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-800/80">
            {/* Start Time */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Start Time
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div style={{ position: 'relative', width: 130 }}>
                  <Clock size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={e => onTimeChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${selectedTime ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 10, padding: '6px 8px 6px 30px',
                      color: '#f1f5f9', fontSize: 13, fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TIMES.map(t => (
                    <button
                      key={t.val}
                      onClick={() => onTimeChange(t.val)}
                      style={{
                        padding: '5px 9px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: selectedTime === t.val ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedTime === t.val ? '#818cf8' : 'rgba(255,255,255,0.06)'}`,
                        color: selectedTime === t.val ? '#c7d2fe' : '#64748b',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Duration Needed
              </div>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(opt => {
                  const active = selectedDuration === opt.val;
                  return (
                    <button
                      key={opt.val}
                      onClick={() => onDurationChange(opt.val)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? '#818cf8' : 'rgba(255,255,255,0.06)'}`,
                        color: active ? '#c7d2fe' : '#64748b',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH ROW */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Room Type */}
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map(t => (
            <button
              key={t}
              onClick={() => onTypeChange(filterType === t ? '' : t)}
              style={{
                padding: '6px 13px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.18s',
                background: filterType === t ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filterType === t ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                color: filterType === t ? '#a5b4fc' : '#6b7280',
              }}
            >
              {ROOM_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} className="hidden md:block" />

        {/* Status filter (only enabled during query) */}
        {isQueryActive && (
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(filterStatus === s ? '' : s)}
                style={{
                  padding: '6px 13px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.18s',
                  background: filterStatus === s ? `${STATUS_COLORS[s]}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${filterStatus === s ? `${STATUS_COLORS[s]}45` : 'rgba(255,255,255,0.06)'}`,
                  color: filterStatus === s ? STATUS_COLORS[s] : '#6b7280',
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex-1" style={{ minWidth: 160 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#4b5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search room (e.g. PRP 378, 201, SCOPE)..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '7px 12px 7px 34px',
                color: '#f1f5f9', fontSize: 13,
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
