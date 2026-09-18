import React from 'react';
import { Building2, CheckCircle, XCircle, AlertTriangle, GitBranch, Calendar, Clock, Info } from 'lucide-react';
import { CampusSummary, SimTime } from '../vitspot-types';

interface CampusPulseProps {
  summary: CampusSummary;
  simTime: SimTime | null;
}

export default function CampusPulse({ summary, simTime }: CampusPulseProps) {
  const total = summary.total_rooms || 174;
  const isQueryActive = summary.is_query_active;
  const availPct = isQueryActive ? ((summary.available_count + summary.ending_soon_count) / total) * 100 : 0;
  const endingPct = isQueryActive ? (summary.ending_soon_count / total) * 100 : 0;
  const occupiedPct = isQueryActive ? (summary.occupied_count / total) * 100 : 0;

  return (
    <div
      className="glass-card rounded-2xl p-6"
      style={{ background: 'rgba(13,17,23,0.85)' }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.25) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={22} color="#818cf8" />
          </div>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
              Pearl Research Park — Space Pulse
            </h1>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span>VIT Vellore · G+7 Floors</span>
              <span>·</span>
              <span style={{ color: '#94a3b8' }}>{total} Student Rooms</span>
              <span>·</span>
              <span style={{ color: '#64748b' }}>{summary.total_faculty_cabins || 248} Faculty Cabins</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
          {isQueryActive ? (
            <div className="flex items-center gap-2 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-300">
              <Clock size={13} />
              <span>{summary.day} · {summary.time} ({summary.duration || 60}m)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400 bg-gray-900/60 px-3 py-1.5 rounded-lg border border-gray-800">
              <Calendar size={13} />
              <span>No time selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Unselected Banner */}
      {!isQueryActive && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 18,
        }}>
          <Info size={18} color="#818cf8" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
            <strong style={{ color: '#f1f5f9' }}>Select a Date & Time</strong> in the bar below to check room availability across all {total} rooms in Pearl Research Park.
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={<CheckCircle size={18} />}
          value={isQueryActive ? summary.available_count : '-'}
          label="Available"
          color="#10b981"
          dimColor="rgba(16,185,129,0.12)"
          subtitle={isQueryActive ? `${Math.round((summary.available_count / total) * 100)}% of building` : 'Select time'}
        />
        <StatCard
          icon={<XCircle size={18} />}
          value={isQueryActive ? summary.occupied_count : '-'}
          label="Occupied"
          color="#f43f5e"
          dimColor="rgba(244,63,94,0.12)"
          subtitle={isQueryActive ? `${Math.round((summary.occupied_count / total) * 100)}% of building` : 'Select time'}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          value={isQueryActive ? summary.ending_soon_count : '-'}
          label="Ending Soon"
          color="#f59e0b"
          dimColor="rgba(245,158,11,0.12)"
          subtitle={isQueryActive ? '<= 30 min left' : 'Select time'}
        />
        <StatCard
          icon={<GitBranch size={18} />}
          value={summary.overrides_count}
          label="Live Overrides"
          color="#8b5cf6"
          dimColor="rgba(139,92,246,0.12)"
          subtitle="Faculty & QR"
        />
      </div>

      {/* Segmented bar */}
      {isQueryActive && (
        <div>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Campus Occupancy Breakdown
          </div>
          <div style={{
            height: 10, borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            overflow: 'hidden', display: 'flex',
          }}>
            <div style={{
              width: `${occupiedPct}%`, background: '#f43f5e',
              transition: 'width 0.6s ease',
            }} />
            <div style={{
              width: `${endingPct}%`, background: '#f59e0b',
              transition: 'width 0.6s ease',
            }} />
            <div style={{
              width: `${availPct - endingPct}%`, background: '#10b981',
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div className="flex items-center gap-4 mt-2" style={{ fontSize: 11, color: '#6b7280' }}>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Available ({summary.available_count})
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
              Occupied ({summary.occupied_count})
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Ending Soon ({summary.ending_soon_count})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, value, label, color, dimColor, subtitle
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  dimColor: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: dimColor, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1, fontFamily: 'JetBrains Mono, monospace' }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
