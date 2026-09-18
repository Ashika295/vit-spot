import React from 'react';
import { Room } from '../vitspot-types';
import {
  getStatusColor, getStatusLabel, getSourceBadgeClass, getSourceBadgeLabel,
  getRoomTypeLabel, formatFreeTime, formatNextClass, getFloorName, formatDisplayRoomNumber
} from '../utils';
import { Clock, BookOpen, FlaskConical, Monitor, Microscope, Calendar } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
}

const ROOM_TYPE_ICONS: Record<string, React.ReactNode> = {
  THEORY: <BookOpen size={12} />,
  LAB: <FlaskConical size={12} />,
  SMART_CLASSROOM: <Monitor size={12} />,
  RESEARCH_LAB: <Microscope size={12} />,
  FACULTY_CABIN: <BookOpen size={12} />,
  OTHER: <BookOpen size={12} />,
};

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const statusColor = getStatusColor(room.status);
  const freeTimeLabel = formatFreeTime(room);
  const nextClassLabel = formatNextClass(room);
  const isUnknown = room.status === 'UNKNOWN';

  const bgTint = room.status === 'AVAILABLE' ? 'rgba(16,185,129,0.06)'
    : room.status === 'ENDING_SOON' ? 'rgba(245,158,11,0.06)'
    : room.status === 'OCCUPIED' ? 'rgba(244,63,94,0.06)'
    : 'rgba(17,24,39,0.85)';

  const borderTint = room.status === 'AVAILABLE' ? 'rgba(16,185,129,0.25)'
    : room.status === 'ENDING_SOON' ? 'rgba(245,158,11,0.25)'
    : room.status === 'OCCUPIED' ? 'rgba(244,63,94,0.25)'
    : 'rgba(255,255,255,0.06)';

  return (
    <button
      onClick={onClick}
      className="animate-in text-left"
      style={{
        display: 'block', width: '100%',
        background: bgTint,
        border: `1px solid ${borderTint}`,
        borderRadius: 16, padding: '16px',
        cursor: 'pointer', transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = `${statusColor}60`;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = `0 8px 30px ${statusColor}20`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = bgTint;
        el.style.borderColor = borderTint;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Status accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: statusColor, opacity: room.status === 'OCCUPIED' ? 0.8 : 0.6,
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Row 1: Room ID + School Tag + Source Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: statusColor, flexShrink: 0,
            boxShadow: `0 0 8px ${statusColor}`,
          }}
            className={room.status === 'ENDING_SOON' ? 'pulse-dot' : ''}
          />
          <span style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.3px' }}>
            {formatDisplayRoomNumber(room)}
          </span>
          {room.school && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, background: 'rgba(99,102,241,0.15)',
              color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)',
            }}>
              {room.school}
            </span>
          )}
        </div>
        {/* Source Badge */}
        <span
          className={getSourceBadgeClass(room.source)}
          style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          {getSourceBadgeLabel(room.source)}
        </span>
      </div>

      {/* Row 2: Status label + floor/type */}
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>
          {getStatusLabel(room.status)}
        </span>
        <div className="flex items-center gap-1" style={{ fontSize: 11, color: '#6b7280' }}>
          {ROOM_TYPE_ICONS[room.room_type] || ROOM_TYPE_ICONS.THEORY}
          <span>{getRoomTypeLabel(room.room_type)}</span>
          <span>·</span>
          <span>{getFloorName(room.floor)}</span>
        </div>
      </div>

      {/* Row 3: Free time / countdown / unselected prompt */}
      <div style={{
        background: `${statusColor}12`,
        border: `1px solid ${statusColor}25`,
        borderRadius: 10, padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: nextClassLabel ? 8 : 0,
      }}>
        {isUnknown ? (
          <Calendar size={13} color="#94a3b8" />
        ) : (
          <Clock size={13} color={statusColor} />
        )}
        <span style={{ fontSize: 12, fontWeight: 700, color: isUnknown ? '#94a3b8' : statusColor }}>
          {freeTimeLabel}
        </span>
        {room.status === 'AVAILABLE' && room.free_until && (
          <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 'auto' }}>
            until {room.free_until}
          </span>
        )}
        {room.status === 'OCCUPIED' && room.available_from && (
          <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 'auto' }}>
            class ends {room.available_from}
          </span>
        )}
      </div>

      {/* Row 4: Current class / Next class info */}
      {room.status === 'OCCUPIED' && room.current_class && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.3 }}>
          📚 <strong style={{ color: '#cbd5e1' }}>{room.current_class.course_code}</strong> ({room.current_class.slot_id}) – {room.current_class.course_name.slice(0, 26)}
        </div>
      )}
      {nextClassLabel && room.status !== 'OCCUPIED' && !isUnknown && (
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{nextClassLabel}</div>
      )}

      {/* Display note */}
      {room.display_note && !isUnknown && (
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontStyle: 'italic', lineHeight: 1.3 }}>
          {room.display_note.slice(0, 65)}{room.display_note.length > 65 ? '…' : ''}
        </div>
      )}
    </button>
  );
}
