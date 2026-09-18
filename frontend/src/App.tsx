import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Room, CampusSummary, WSMessage, SimTime } from './vitspot-types';
import { createWebSocket, fetchRooms, fetchCampusSummary, getSimTime, postQueryTime, resetQueryTime } from './api';
import Navbar from './components/Navbar';
import CampusPulse from './components/CampusPulse';
import FloorSelector from './components/FloorSelector';
import FilterBar from './components/FilterBar';
import RoomGrid from './components/RoomGrid';
import RoomTimelineModal from './components/RoomTimelineModal';
import FacultyPortalModal from './components/FacultyPortalModal';
import QRVerifyModal from './components/QRVerifyModal';
import SimClockPanel from './components/SimClockPanel';
import PitchModeModal from './components/PitchModeModal';

export type ModalType = 'faculty' | 'qr' | 'sim' | 'pitch' | null;

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [summary, setSummary] = useState<CampusSummary | null>(null);
  const [simTime, setSimTime] = useState<SimTime | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Date & Time Query State (Default is unselected to prevent fake Monday/time)
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

  // Filter & Search State
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMinutes, setFilterMinutes] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllRegistryRooms, setShowAllRegistryRooms] = useState<boolean>(false);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const toastId = useRef(0);

  const addToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const loadSummary = useCallback(async (day?: string, time?: string, dur?: number) => {
    try {
      const s = await fetchCampusSummary(day, time, dur);
      setSummary(s);
    } catch (_) {}
  }, []);

  const loadSimTime = useCallback(async () => {
    try {
      const s = await getSimTime();
      setSimTime(s);
      if (s?.is_simulated && s.day && s.time) {
        setSelectedDay(s.day);
        setSelectedTime(s.time);
      }
    } catch (_) {}
  }, []);

  const loadRooms = useCallback(async (day?: string, time?: string, dur?: number) => {
    try {
      const params: Record<string, string | number> = {};
      if (day) params.day = day;
      if (time) params.time = time;
      if (dur) params.duration = dur;
      const r = await fetchRooms(params);
      setRooms(r);
    } catch (_) {}
  }, []);

  // Handle WebSocket messages — live updates, no polling
  const handleWsMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'INITIAL_STATE') {
      setRooms(msg.rooms);
      loadSummary(selectedDay || undefined, selectedTime || undefined, selectedDuration);
      loadSimTime();
    } else if (msg.type === 'ROOM_UPDATE') {
      setRooms(prev => prev.map(r => r.room_id === msg.room.room_id ? msg.room : r));
      loadSummary(selectedDay || undefined, selectedTime || undefined, selectedDuration);
    } else if (msg.type === 'ROOM_STATE_UPDATE') {
      setRooms(msg.rooms);
      loadSummary(selectedDay || undefined, selectedTime || undefined, selectedDuration);
      if (msg.simulated_time !== undefined) loadSimTime();
    }
  }, [loadSummary, loadSimTime, selectedDay, selectedTime, selectedDuration]);

  // Establish WebSocket connection on mount
  useEffect(() => {
    const connect = () => {
      const ws = createWebSocket(
        handleWsMessage,
        () => setWsConnected(true),
        () => {
          setWsConnected(false);
          setTimeout(connect, 3000); // Reconnect
        }
      );
      wsRef.current = ws;
    };
    connect();
    loadRooms();
    loadSummary();
    loadSimTime();

    return () => {
      wsRef.current?.close();
    };
  }, [handleWsMessage, loadRooms, loadSummary, loadSimTime]);

  // Handle Day & Time Query changes
  const handleDayChange = async (day: string) => {
    setSelectedDay(day);
    if (day && selectedTime) {
      try {
        await postQueryTime(day, selectedTime, selectedDuration);
        addToast(`Checking availability for ${day} at ${selectedTime}`);
      } catch (_) {
        loadRooms(day, selectedTime, selectedDuration);
        loadSummary(day, selectedTime, selectedDuration);
      }
    } else if (!day && !selectedTime) {
      await resetQueryTime();
      loadRooms();
      loadSummary();
    } else {
      loadRooms(day || undefined, selectedTime || undefined, selectedDuration);
      loadSummary(day || undefined, selectedTime || undefined, selectedDuration);
    }
  };

  const handleTimeChange = async (time: string) => {
    setSelectedTime(time);
    if (selectedDay && time) {
      try {
        await postQueryTime(selectedDay, time, selectedDuration);
        addToast(`Checking availability for ${selectedDay} at ${time}`);
      } catch (_) {
        loadRooms(selectedDay, time, selectedDuration);
        loadSummary(selectedDay, time, selectedDuration);
      }
    } else if (!selectedDay && !time) {
      await resetQueryTime();
      loadRooms();
      loadSummary();
    } else {
      loadRooms(selectedDay || undefined, time || undefined, selectedDuration);
      loadSummary(selectedDay || undefined, time || undefined, selectedDuration);
    }
  };

  const handleDurationChange = async (dur: number) => {
    setSelectedDuration(dur);
    if (selectedDay && selectedTime) {
      try {
        await postQueryTime(selectedDay, selectedTime, dur);
      } catch (_) {
        loadRooms(selectedDay, selectedTime, dur);
        loadSummary(selectedDay, selectedTime, dur);
      }
    }
  };

  const handleClearDateTime = async () => {
    setSelectedDay('');
    setSelectedTime('');
    try {
      await resetQueryTime();
    } catch (_) {}
    loadRooms();
    loadSummary();
    addToast('Cleared date & time query');
  };

  // Derived filtered rooms — HIDE UNKNOWN gray cards by default so user isn't overwhelmed by 150+ empty boxes!
  const filteredRooms = rooms.filter(room => {
    if (!showAllRegistryRooms && !searchQuery && filterStatus !== 'UNKNOWN') {
      if (room.status === 'UNKNOWN') return false;
    }
    if (selectedFloor !== null && room.floor !== selectedFloor) return false;
    if (filterType && room.room_type !== filterType) return false;
    if (filterStatus) {
      const s = filterStatus.toUpperCase();
      if (s === 'AVAILABLE') {
        if (!['AVAILABLE', 'ENDING_SOON'].includes(room.status)) return false;
      } else {
        if (room.status !== s) return false;
      }
    }
    if (filterMinutes !== null) {
      if (!['AVAILABLE', 'ENDING_SOON'].includes(room.status)) return false;
      if (room.free_duration !== null && room.free_duration < filterMinutes) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = room.room_id.toLowerCase().includes(q);
      const matchSchool = room.school?.toLowerCase().includes(q) || false;
      const matchType = room.room_type.toLowerCase().includes(q);
      if (!matchId && !matchSchool && !matchType) return false;
    }
    return true;
  });

  const onRoomSelect = (room: Room) => setSelectedRoom(room);
  const closeRoomModal = () => setSelectedRoom(null);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <Navbar
        wsConnected={wsConnected}
        simTime={simTime}
        onOpenFaculty={() => setModal('faculty')}
        onOpenQR={() => setModal('qr')}
        onOpenSim={() => setModal('sim')}
        onOpenPitch={() => setModal('pitch')}
      />

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Campus Pulse Summary Strip */}
        {summary && (
          <CampusPulse
            summary={summary}
            simTime={simTime}
          />
        )}

        {/* Floor Selector */}
        <FloorSelector
          selected={selectedFloor}
          onChange={setSelectedFloor}
          floorStats={summary?.floor_stats}
        />

        {/* Date / Time Query + Filters + Break Duration Search */}
        <FilterBar
          selectedDay={selectedDay}
          selectedTime={selectedTime}
          selectedDuration={selectedDuration}
          onDayChange={handleDayChange}
          onTimeChange={handleTimeChange}
          onDurationChange={handleDurationChange}
          onClearDateTime={handleClearDateTime}
          filterType={filterType}
          filterStatus={filterStatus}
          filterMinutes={filterMinutes}
          searchQuery={searchQuery}
          onTypeChange={setFilterType}
          onStatusChange={setFilterStatus}
          onMinutesChange={setFilterMinutes}
          onSearchChange={setSearchQuery}
        />

        {/* Room Grid */}
        <RoomGrid
          rooms={filteredRooms}
          allRoomsCount={rooms.length}
          onSelectRoom={onRoomSelect}
          showAllRegistryRooms={showAllRegistryRooms}
          onToggleShowAll={() => setShowAllRegistryRooms(prev => !prev)}
        />
      </main>

      {/* Modals */}
      {selectedRoom && (
        <RoomTimelineModal
          room={selectedRoom}
          onClose={closeRoomModal}
          onToast={addToast}
          onTriggerFaculty={() => { closeRoomModal(); setModal('faculty'); }}
          onTriggerQR={() => { closeRoomModal(); setModal('qr'); }}
        />
      )}
      {modal === 'faculty' && (
        <FacultyPortalModal
          rooms={rooms.filter(r => r.status === 'OCCUPIED' || r.source === 'SCHEDULED' || r.source === 'VERIFIED_TIMETABLE')}
          onClose={() => setModal(null)}
          onToast={addToast}
        />
      )}
      {modal === 'qr' && (
        <QRVerifyModal
          rooms={rooms}
          onClose={() => setModal(null)}
          onToast={addToast}
        />
      )}
      {modal === 'sim' && (
        <SimClockPanel
          simTime={simTime}
          onClose={() => setModal(null)}
          onUpdate={(st) => {
            setSimTime(st);
            if (st.day && st.time) {
              setSelectedDay(st.day);
              setSelectedTime(st.time);
            }
          }}
          onToast={addToast}
        />
      )}
      {modal === 'pitch' && (
        <PitchModeModal onClose={() => setModal(null)} />
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-[200]">
        {toasts.map(t => (
          <div
            key={t.id}
            className="animate-in px-5 py-3 rounded-xl text-sm font-medium shadow-2xl"
            style={{
              background: t.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`,
              color: t.type === 'success' ? '#34d399' : '#fb7185',
            }}
          >
            {t.type === 'success' ? '✓ ' : '✕ '}{t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
