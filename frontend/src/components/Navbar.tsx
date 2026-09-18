import React from 'react';
import { Wifi, WifiOff, Zap, Users, QrCode, Clock, Presentation } from 'lucide-react';
import { SimTime } from '../vitspot-types';

interface NavbarProps {
  wsConnected: boolean;
  simTime: SimTime | null;
  onOpenFaculty: () => void;
  onOpenQR: () => void;
  onOpenSim: () => void;
  onOpenPitch: () => void;
}

export default function Navbar({ wsConnected, simTime, onOpenFaculty, onOpenQR, onOpenSim, onOpenPitch }: NavbarProps) {
  return (
    <header style={{
      background: 'rgba(6,9,19,0.9)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: '#f1f5f9' }}>
              VitSpot
            </div>
            <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: -2 }}>
              Pearl Research Park
            </div>
          </div>
        </div>

        {/* Simulated time badge */}
        {simTime?.is_simulated && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, color: '#fbbf24',
          }}>
            <Clock size={12} />
            <span>SIM: {simTime.day} {simTime.time}</span>
          </div>
        )}

        {/* Nav actions */}
        <nav className="flex items-center gap-2">
          <NavBtn icon={<Users size={14} />} label="Faculty" onClick={onOpenFaculty}
            color="#10b981" />
          <NavBtn icon={<QrCode size={14} />} label="QR Verify" onClick={onOpenQR}
            color="#f59e0b" />
          <NavBtn icon={<Clock size={14} />} label="Sim Time" onClick={onOpenSim}
            color="#6366f1" active={simTime?.is_simulated} />
          <NavBtn icon={<Presentation size={14} />} label="Pitch Mode" onClick={onOpenPitch}
            color="#8b5cf6" />

          {/* WS indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: wsConnected ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            border: `1px solid ${wsConnected ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
            borderRadius: 20, padding: '5px 12px',
            fontSize: 12, fontWeight: 600,
            color: wsConnected ? '#34d399' : '#fb7185',
          }}>
            {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavBtn({ icon, label, onClick, color, active }: {
  icon: React.ReactNode; label: string; onClick: () => void; color: string; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: active ? `${color}22` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, padding: '6px 12px',
        fontSize: 12, fontWeight: 600,
        color: active ? color : '#94a3b8',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}20`;
        (e.currentTarget as HTMLButtonElement).style.color = color;
        (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}50`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = active ? `${color}22` : 'rgba(255,255,255,0.05)';
        (e.currentTarget as HTMLButtonElement).style.color = active ? color : '#94a3b8';
        (e.currentTarget as HTMLButtonElement).style.borderColor = active ? `${color}55` : 'rgba(255,255,255,0.08)';
      }}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

