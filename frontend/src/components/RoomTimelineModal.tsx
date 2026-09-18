import React, { useEffect, useState } from 'react';
import { X, Clock, BookOpen, Calendar, Users, QrCode } from 'lucide-react';
import { Room, TimelineInterval } from '../vitspot-types';
import { fetchRoomTimeline } from '../api';
import { getStatusColor, getStatusLabel, getSourceBadgeClass, getSourceBadgeLabel, timeToPercent, formatDisplayRoomNumber } from '../utils';

interface RoomTimelineModalProps {
  room: Room;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
  onTriggerFaculty: () => void;
  onTriggerQR: () => void;
}

export default function RoomTimelineModal({ room, onClose, onToast, onTriggerFaculty, onTriggerQR }: RoomTimelineModalProps) {
  const [timeline, setTimeline] = useState<{ intervals: TimelineInterval[]; current_time: string; day: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomTimeline(room.room_id)
      .then(data => { setTimeline(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [room.room_id]);

  const statusColor = getStatusColor(room.status);
  const nowPercent = timeline ? timeToPercent(timeline.current_time) : 0;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content"
        style={{
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, width: '100%', maxWidth: 640,
          maxHeight: '90vh', overflow: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: statusColor, boxShadow: `0 0 10px ${statusColor}`,
              }} />
              <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                {formatDisplayRoomNumber(room)}
              </span>
              <span className={getSourceBadgeClass(room.source)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                {getSourceBadgeLabel(room.source)}
              </span>
            </div>
            <div style={{ color: statusColor, fontWeight: 700, fontSize: 14 }}>
              {getStatusLabel(room.status)}
              {room.free_duration !== null && room.free_duration !== undefined && (
                <span style={{ color: '#6b7280', fontWeight: 500, marginLeft: 8 }}>
                  · free for {room.free_duration} min
                </span>
              )}
              {room.occupied_duration_left !== null && room.occupied_duration_left !== undefined && (
                <span style={{ color: '#6b7280', fontWeight: 500, marginLeft: 8 }}>
                  · frees in {room.occupied_duration_left} min
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Visual Timeline Bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Today's Schedule — {timeline?.day ?? '...'}
            </div>

            {/* Timeline rail */}
            <div style={{ position: 'relative', height: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden' }}>
              {/* Occupied intervals */}
              {timeline?.intervals.map((interval, i) => {
                const left = timeToPercent(interval.start_time);
                const right = 100 - timeToPercent(interval.end_time);
                return (
                  <div
                    key={i}
                    title={`${interval.course_code}: ${interval.start_time}–${interval.end_time}`}
                    style={{
                      position: 'absolute', top: 2, bottom: 2,
                      left: `${left}%`, right: `${right}%`,
                      background: 'rgba(244,63,94,0.65)',
                      borderRadius: 4, cursor: 'pointer',
                    }}
                  />
                );
              })}

              {/* Current time indicator */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${nowPercent}%`, width: 2,
                background: '#6366f1',
                boxShadow: '0 0 8px #6366f1',
                zIndex: 10,
              }} />
            </div>

            {/* Time axis labels */}
            <div className="flex justify-between" style={{ fontSize: 10, color: '#374151', marginTop: 4 }}>
              <span>08:00</span>
              <span>12:00</span>
              <span>14:00</span>
              <span>17:00</span>
              <span>19:50</span>
            </div>
            <div style={{ fontSize: 10, color: '#6366f1', marginTop: 2 }}>
              ▲ Now: {timeline?.current_time}
            </div>
          </div>

          {/* Class intervals list */}
          {loading ? (
            <div style={{ color: '#4b5563', textAlign: 'center', padding: 24 }}>Loading schedule…</div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Class Breakdown
              </div>
              {timeline?.intervals.length === 0 ? (
                <div style={{ color: '#374151', fontSize: 13, padding: '12px 0' }}>
                  No classes scheduled today — room is free all day.
                </div>
              ) : (
                <div className="space-y-2">
                  {timeline?.intervals.map((interval, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                      borderRadius: 10, padding: '10px 14px',
                    }}>
                      <Clock size={14} color="#f43f5e" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9' }}>
                          {interval.course_code}
                          <span style={{ fontSize: 10, fontWeight: 500, color: '#6b7280', marginLeft: 8 }}>
                            Slot: {interval.slot_id}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{interval.course_name}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>
                        {interval.start_time}–{interval.end_time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onTriggerFaculty}
              style={{
                flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.18s',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Users size={14} /> Faculty Release
            </button>
            <button
              onClick={onTriggerQR}
              style={{
                flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.18s',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <QrCode size={14} /> QR Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

