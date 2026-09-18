import React, { useState } from 'react';
import { X, Clock, Play, RotateCcw } from 'lucide-react';
import { SimTime } from '../vitspot-types';
import { postSimTime } from '../api';
import { DEMO_SIM_SLOTS } from '../utils';

interface SimClockPanelProps {
  simTime: SimTime | null;
  onClose: () => void;
  onUpdate: (st: SimTime) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SimClockPanel({ simTime, onClose, onUpdate, onToast }: SimClockPanelProps) {
  const [loading, setLoading] = useState(false);

  const setSlot = async (iso: string, day: string) => {
    setLoading(true);
    try {
      const res = await postSimTime(iso, day);
      onUpdate(res);
      onToast(`Campus time set to ${day} ${res.time}`);
    } catch (_) {
      onToast('Failed to set simulation time', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetToLive = async () => {
    setLoading(true);
    try {
      const res = await postSimTime(null);
      onUpdate(res);
      onToast('Campus time reset to live system time');
    } catch (_) {
      onToast('Failed to reset simulation time', 'error');
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
          background: '#0d1117', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20, width: '100%', maxWidth: 480, padding: 24,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={18} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Simulation Clock</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Fast-forward campus time for demo</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        {/* Current time */}
        <div style={{
          background: simTime?.is_simulated ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
          border: `1px solid ${simTime?.is_simulated ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {simTime?.is_simulated ? '⚡ Simulated Time' : '🟢 Live Time'}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
              color: simTime?.is_simulated ? '#fbbf24' : '#34d399', marginTop: 2,
            }}>
              {simTime?.day} {simTime?.time}
            </div>
          </div>
          {simTime?.is_simulated && (
            <button
              onClick={resetToLive}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: '#34d399',
              }}
            >
              <RotateCcw size={13} /> Go Live
            </button>
          )}
        </div>

        {/* Demo slots */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Demo Time Scenarios
        </div>
        <div className="space-y-2">
          {DEMO_SIM_SLOTS.map(slot => (
            <button
              key={slot.iso}
              disabled={loading}
              onClick={() => setSlot(slot.iso, slot.day)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                background: simTime?.is_simulated && simTime.time === slot.iso.slice(11, 16) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '11px 14px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.18s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
              }}
            >
              <Play size={13} color="#6366f1" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{slot.label}</div>
                <div style={{ fontSize: 11, color: '#4b5563' }}>{slot.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

