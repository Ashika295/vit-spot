import React from 'react';
import { X, ArrowRight, CheckCircle } from 'lucide-react';

interface PitchModeModalProps {
  onClose: () => void;
}

export default function PitchModeModal({ onClose }: PitchModeModalProps) {
  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content"
        style={{
          background: '#060913', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 24, width: '100%', maxWidth: 720, padding: 32,
          maxHeight: '90vh', overflow: 'auto',
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
              VinHack 2026 · VitSpot Pitch
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
              The Transformation
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* Before vs After */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 32 }}>
          {/* Before: raw timetable */}
          <div style={{
            background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Before: Raw Timetable
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#6b7280',
              background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 14,
              lineHeight: 1.8,
            }}>
              <div>PRP378</div>
              <div>DSA — E1+TE1</div>
              <div style={{ opacity: 0.6, fontSize: 11, marginTop: 4 }}>MON–B1, WED–F1</div>
              <div style={{ opacity: 0.4, fontSize: 11 }}>BCSE202L-TH-PRP378-ALL</div>
            </div>
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 10 }}>
              ❓ Is it free <em>right now</em>? For how long?
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ArrowRight size={28} color="#6366f1" />
            <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, textAlign: 'center' }}>
              Deterministic<br />Engine
            </div>
          </div>

          {/* After: VitSpot card */}
          <div style={{
            background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              After: VitSpot Intelligence
            </div>
            <div style={{ background: 'rgba(17,24,39,0.8)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#f1f5f9', fontSize: 15 }}>PRP378</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                  SCHEDULED
                </span>
              </div>
              <div style={{ color: '#10b981', fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Available Now</div>
              <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>⏱ Free for 35 min</span>
                <span style={{ color: '#4b5563', fontSize: 11, float: 'right' }}>until 11:00</span>
              </div>
              <div style={{ fontSize: 11, color: '#4b5563' }}>Next: BCSE202L at 11:00 AM</div>
            </div>
          </div>
        </div>

        {/* Engineering maturity callout */}
        <div style={{
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16, padding: 20, marginBottom: 24,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', marginBottom: 10 }}>
            Why VitSpot is Architecturally Honest
          </div>
          <div className="space-y-2">
            {[
              { badge: 'SCHEDULED', color: '#818cf8', text: 'Pure deterministic logic — f(time, schedule) = availability. Zero ML.' },
              { badge: 'FACULTY OVERRIDE', color: '#34d399', text: 'Faculty-confirmed early release — recalculates free duration against next real class.' },
              { badge: 'QR VERIFIED', color: '#fbbf24', text: 'Physical exception layer — never overrides SCHEDULE claim, only augments it.' },
              { badge: 'DEMO DATA', color: '#a78bfa', text: 'Clearly labeled synthetic rooms — never presented as official PRP inventory.' },
            ].map(({ badge, color, text }) => (
              <div key={badge} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                  border: `1px solid ${color}40`, color, background: `${color}15`,
                  flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1,
                }}>
                  {badge}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing statement */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 16, padding: 20, textAlign: 'center',
        }}>
          <CheckCircle size={28} color="#6366f1" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>
            Scheduled free ≠ Physically empty
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>
            VitSpot is the only campus space tool that shows you <em>where that information came from</em> —
            every room card carries a source badge, and the system never overclaims physical state.
            That's engineering maturity.
          </div>
        </div>
      </div>
    </div>
  );
}

