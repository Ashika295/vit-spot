import React, { useState } from 'react';
import { X, QrCode, CheckCircle } from 'lucide-react';
import { Room } from '../vitspot-types';
import { postQRReport } from '../api';

interface QRVerifyModalProps {
  rooms: Room[];
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function QRVerifyModal({ rooms, onClose, onToast }: QRVerifyModalProps) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [reportType, setReportType] = useState<'ROOM_UNAVAILABLE' | 'ROOM_RELEASED'>('ROOM_UNAVAILABLE');
  const [reason, setReason] = useState('Room locked');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRoom) { onToast('Please select a room', 'error'); return; }
    setLoading(true);
    try {
      await postQRReport(selectedRoom, reportType, reason);
      setDone(true);
      const msg = reportType === 'ROOM_UNAVAILABLE'
        ? `${selectedRoom} marked as OCCUPIED (QR Verified exception)`
        : `${selectedRoom} confirmed RELEASED (QR Verified)`;
      onToast(msg);
      setTimeout(() => onClose(), 2000);
    } catch (_) {
      onToast('QR report submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const UNAVAILABLE_REASONS = ['Room locked', 'Department meeting in progress', 'AV equipment setup', 'Faculty using room privately', 'Access control active'];
  const RELEASED_REASONS = ['Class ended early — room empty', 'Scheduled class cancelled', 'Lab session moved to another room', 'Room confirmed physically empty'];

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
          background: '#0d1117', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 20, width: '100%', maxWidth: 480, padding: 24,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <QrCode size={18} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>QR Physical Verification</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Report physical room status exception</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <CheckCircle size={48} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>QR Report Submitted!</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Room {selectedRoom} status updated (QR Verified)</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div style={{
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400e',
            }}>
              ⚠️ This is an <strong>exception layer</strong> — only use this when you physically observe a discrepancy from the schedule. VitSpot never claims physical occupancy from scheduling alone.
            </div>

            {/* Room selector */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Room</label>
              <select
                value={selectedRoom}
                onChange={e => setSelectedRoom(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9', fontSize: 13, outline: 'none',
                }}
              >
                <option value="">-- Select PRP Room --</option>
                {rooms.map(r => (
                  <option key={r.room_id} value={r.room_id}>{r.room_id} (Scheduled: {r.status})</option>
                ))}
              </select>
            </div>

            {/* Report type toggle */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Exception Type</label>
              <div className="flex gap-2">
                {(['ROOM_UNAVAILABLE', 'ROOM_RELEASED'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setReportType(type);
                      setReason(type === 'ROOM_UNAVAILABLE' ? UNAVAILABLE_REASONS[0] : RELEASED_REASONS[0]);
                    }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.18s',
                      background: reportType === type
                        ? (type === 'ROOM_UNAVAILABLE' ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)')
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${reportType === type
                        ? (type === 'ROOM_UNAVAILABLE' ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.4)')
                        : 'rgba(255,255,255,0.08)'}`,
                      color: reportType === type
                        ? (type === 'ROOM_UNAVAILABLE' ? '#fb7185' : '#34d399')
                        : '#6b7280',
                    }}
                  >
                    {type === 'ROOM_UNAVAILABLE' ? '🔒 Unavailable' : '✓ Released'}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
                {reportType === 'ROOM_UNAVAILABLE'
                  ? 'Schedule says free, but room is locked/occupied in person'
                  : 'Schedule says occupied, but class has already vacated the room'}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Reason</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9', fontSize: 13, outline: 'none',
                }}
              >
                {(reportType === 'ROOM_UNAVAILABLE' ? UNAVAILABLE_REASONS : RELEASED_REASONS).map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)',
                color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? 'Submitting…' : '📲 Submit QR Exception Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

