import React, { useState } from 'react';
import { X, Users, CheckCircle } from 'lucide-react';
import { Room } from '../vitspot-types';
import { postFacultyRelease } from '../api';
import { getStatusColor, getStatusLabel } from '../utils';

interface FacultyPortalModalProps {
  rooms: Room[];
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function FacultyPortalModal({ rooms, onClose, onToast }: FacultyPortalModalProps) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [reason, setReason] = useState('Class ended early');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED');

  const handleRelease = async () => {
    if (!selectedRoom) { onToast('Please select a room', 'error'); return; }
    if (!facultyId.trim()) { onToast('Please enter Faculty ID', 'error'); return; }
    setLoading(true);
    try {
      await postFacultyRelease(selectedRoom, facultyId, reason);
      setDone(true);
      onToast(`Room ${selectedRoom} marked as Available via Faculty Override`);
      setTimeout(() => onClose(), 2000);
    } catch (_) {
      onToast('Failed to submit faculty release', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content"
        style={{
          background: '#0d1117', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 20, width: '100%', maxWidth: 480, padding: 24,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={18} color="#34d399" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Faculty Release Portal</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Mark class ended early</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>Room Released!</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {selectedRoom} is now AVAILABLE (Faculty Override)
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Room selector */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                Select Room (Currently Occupied)
              </label>
              <select
                value={selectedRoom}
                onChange={e => setSelectedRoom(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9', fontSize: 13, outline: 'none',
                }}
              >
                <option value="">-- Select Room --</option>
                {occupiedRooms.map(r => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_id} — {r.current_class?.course_code || 'Occupied'}
                  </option>
                ))}
                {/* Allow any PRP room */}
                <optgroup label="Any PRP Room">
                  {rooms.filter(r => !occupiedRooms.find(o => o.room_id === r.room_id)).map(r => (
                    <option key={r.room_id} value={r.room_id}>{r.room_id}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Faculty ID */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                Faculty ID
              </label>
              <input
                type="text"
                placeholder="e.g. FAC9012"
                value={facultyId}
                onChange={e => setFacultyId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9', fontSize: 13, outline: 'none',
                }}
              />
            </div>

            {/* Reason */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                Reason
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9', fontSize: 13, outline: 'none',
                }}
              >
                <option>Class ended early</option>
                <option>Lab test completed ahead of schedule</option>
                <option>Faculty emergency</option>
                <option>Exam concluded early</option>
                <option>Room required for another purpose</option>
              </select>
            </div>

            <button
              onClick={handleRelease}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                background: loading ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.4)', color: '#34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? 'Releasing…' : '✓ Mark Class Ended Early'}
            </button>

            <div style={{ fontSize: 11, color: '#374151', textAlign: 'center' }}>
              This will flip the room to AVAILABLE with source badge: <strong style={{ color: '#34d399' }}>FACULTY OVERRIDE</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

