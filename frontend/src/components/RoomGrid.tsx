import React, { useState } from 'react';
import { Room } from '../vitspot-types';
import RoomCard from './RoomCard';
import { getFloorName, formatDisplayRoomNumber, getStatusColor, getStatusLabel, formatFreeTime, getRoomTypeLabel } from '../utils';
import { LayoutGrid, List, ChevronDown, ChevronRight, Layers } from 'lucide-react';

interface RoomGridProps {
  rooms: Room[];
  allRoomsCount: number;
  onSelectRoom: (room: Room) => void;
  showAllRegistryRooms?: boolean;
  onToggleShowAll?: () => void;
}

export default function RoomGrid({
  rooms, allRoomsCount, onSelectRoom, showAllRegistryRooms, onToggleShowAll
}: RoomGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [collapsedFloors, setCollapsedFloors] = useState<Record<number, boolean>>({});

  if (rooms.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '64px 24px',
        background: 'rgba(17,24,39,0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>No rooms match your filters</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Try adjusting floor, room type, status, or search query. Total {allRoomsCount} rooms in Pearl Research Park.
        </div>
        {onToggleShowAll && !showAllRegistryRooms && (
          <button
            onClick={onToggleShowAll}
            style={{
              marginTop: 16, padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8',
              cursor: 'pointer',
            }}
          >
            Show All Unscheduled Registry Rooms ({allRoomsCount})
          </button>
        )}
      </div>
    );
  }

  // Group rooms by floor (0 to 7)
  const floorGroups = rooms.reduce((acc, room) => {
    const f = room.floor ?? 0;
    if (!acc[f]) acc[f] = [];
    acc[f].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  const sortedFloorKeys = Object.keys(floorGroups).map(Number).sort((a, b) => a - b);

  const toggleFloor = (floor: number) => {
    setCollapsedFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
  };

  const toggleAll = (collapse: boolean) => {
    const next: Record<number, boolean> = {};
    sortedFloorKeys.forEach(f => { next[f] = collapse; });
    setCollapsedFloors(next);
  };

  return (
    <div className="space-y-6">
      {/* Grid Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
        <div className="flex items-center gap-3">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }} className="flex items-center gap-2">
            <Layers size={15} color="#818cf8" />
            <span>Pearl Research Park Rooms</span>
          </div>
          <span style={{ fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6 }}>
            Showing {rooms.length} active rooms
          </span>
          {onToggleShowAll && (
            <button
              onClick={onToggleShowAll}
              style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                background: showAllRegistryRooms ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${showAllRegistryRooms ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                color: showAllRegistryRooms ? '#a5b4fc' : '#6b7280',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {showAllRegistryRooms ? '✓ Showing All Registry Rooms' : '+ Show Unscheduled Registry Rooms'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse/Expand toggles for clean grouped view */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              onClick={() => toggleAll(false)}
              style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}
              className="hover:text-white transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={() => toggleAll(true)}
              style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}
              className="hover:text-white transition-colors"
            >
              Collapse All
            </button>
          </div>

          {/* View Switcher (Grid vs List) */}
          <div className="flex bg-gray-800/80 p-1 rounded-lg border border-gray-700/80">
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                background: viewMode === 'grid' ? '#4f46e5' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : '#94a3b8',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                background: viewMode === 'list' ? '#4f46e5' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : '#94a3b8',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <List size={13} />
              <span>Compact List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Rooms Grouped by Floor */}
      <div className="space-y-6">
        {sortedFloorKeys.map(floorNum => {
          const floorRooms = floorGroups[floorNum];
          const isCollapsed = collapsedFloors[floorNum];
          const availableInFloor = floorRooms.filter(r => r.status === 'AVAILABLE' || r.status === 'ENDING_SOON').length;

          return (
            <div
              key={floorNum}
              style={{
                background: 'rgba(17,24,39,0.4)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16, overflow: 'hidden',
              }}
            >
              {/* Floor Header Bar */}
              <button
                onClick={() => toggleFloor(floorNum)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '14px 18px',
                  background: 'rgba(30,41,59,0.5)',
                  borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer', textAlign: 'left',
                }}
                className="hover:bg-gray-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? <ChevronRight size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#818cf8" />}
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.2px' }}>
                    {getFloorName(floorNum)}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6 }}>
                    {floorRooms.length} rooms
                  </span>
                  {availableInFloor > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: 6 }}>
                      {availableInFloor} available
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                  {isCollapsed ? 'Click to show' : 'Click to hide'}
                </div>
              </button>

              {/* Floor Content */}
              {!isCollapsed && (
                <div className="p-4">
                  {viewMode === 'grid' ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: 12,
                      }}
                    >
                      {floorRooms.map(room => (
                        <RoomCard
                          key={room.room_id}
                          room={room}
                          onClick={() => onSelectRoom(room)}
                        />
                      ))}
                    </div>
                  ) : (
                    /* Compact List View for zero clutter */
                    <div className="overflow-x-auto">
                      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '8px 12px' }}>Room</th>
                            <th style={{ padding: '8px 12px' }}>School</th>
                            <th style={{ padding: '8px 12px' }}>Type</th>
                            <th style={{ padding: '8px 12px' }}>Capacity</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                            <th style={{ padding: '8px 12px' }}>Availability / Free Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {floorRooms.map(room => {
                            const statusColor = getStatusColor(room.status);
                            return (
                              <tr
                                key={room.room_id}
                                onClick={() => onSelectRoom(room)}
                                style={{
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                className="hover:bg-indigo-950/30"
                              >
                                <td style={{ padding: '10px 12px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#f1f5f9' }}>
                                  {formatDisplayRoomNumber(room)}
                                </td>
                                <td style={{ padding: '10px 12px', color: '#818cf8', fontWeight: 600, fontSize: 12 }}>
                                  {room.school || '—'}
                                </td>
                                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                                  {getRoomTypeLabel(room.room_type)}
                                </td>
                                <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {room.capacity ? `${room.capacity} seats` : '—'}
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    fontSize: 12, fontWeight: 700, color: statusColor,
                                    background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
                                    padding: '3px 9px', borderRadius: 6,
                                  }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                                    {getStatusLabel(room.status)}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', color: '#cbd5e1', fontWeight: 600 }}>
                                  {formatFreeTime(room)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
