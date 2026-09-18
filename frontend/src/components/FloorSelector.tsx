import React from 'react';
import { FloorStats } from '../vitspot-types';
import { getFloorName, FLOOR_LABELS } from '../utils';

interface FloorSelectorProps {
  selected: number | null;
  onChange: (floor: number | null) => void;
  floorStats?: Record<string, FloorStats>;
}

const FLOORS = [0, 1, 2, 3, 4, 5, 6, 7];

export default function FloorSelector({ selected, onChange, floorStats }: FloorSelectorProps) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Floor Explorer
      </div>
      <div className="flex flex-wrap gap-2">
        <FloorBtn
          label="All Floors"
          active={selected === null}
          onClick={() => onChange(null)}
          available={floorStats ? Object.values(floorStats).reduce((a, s) => a + s.available + s.ending_soon, 0) : null}
          total={floorStats ? Object.values(floorStats).reduce((a, s) => a + s.total, 0) : null}
          shortLabel="All"
        />
        {FLOORS.map(f => {
          const stats = floorStats?.[String(f)];
          return (
            <FloorBtn
              key={f}
              label={getFloorName(f)}
              shortLabel={FLOOR_LABELS[f]}
              active={selected === f}
              onClick={() => onChange(f === selected ? null : f)}
              available={stats ? stats.available + stats.ending_soon : null}
              total={stats?.total ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}

function FloorBtn({ label, shortLabel, active, onClick, available, total }: {
  label: string; shortLabel: string; active: boolean; onClick: () => void;
  available: number | null; total: number | null;
}) {
  const ratio = (available !== null && total !== null && total > 0) ? available / total : null;
  const dotColor = ratio === null ? '#4b5563'
    : ratio > 0.5 ? '#10b981'
    : ratio > 0.2 ? '#f59e0b'
    : '#f43f5e';

  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12, padding: '8px 14px',
        color: active ? '#818cf8' : '#6b7280',
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.18s',
        minWidth: 56,
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.08)';
          (e.currentTarget as HTMLButtonElement).style.color = '#a5b4fc';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
        }
      }}
    >
      {/* Dot indicator */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: dotColor, flexShrink: 0,
        boxShadow: active ? `0 0 6px ${dotColor}` : 'none',
      }} />

      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>

      {total !== null && (
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: active ? '#6366f1' : '#374151',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {available}/{total}
        </span>
      )}
    </button>
  );
}

