import { Room, CampusSummary, WSMessage } from './vitspot-types';

const API_BASE = '';
const WS_BASE = `ws://${window.location.host}/ws/updates`;

export async function fetchRooms(params?: Record<string, string | number | boolean | undefined>): Promise<Room[]> {
  const validEntries = Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== '' && v !== null);
  const query = validEntries.length > 0 ? '?' + new URLSearchParams(validEntries.map(([k, v]) => [k, String(v)])).toString() : '';
  const res = await fetch(`${API_BASE}/rooms${query}`);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}

export async function fetchRoomTimeline(roomId: string) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function fetchCampusSummary(day?: string, time?: string, duration?: number): Promise<CampusSummary> {
  const params: Record<string, string> = {};
  if (day) params.day = day;
  if (time) params.time = time;
  if (duration) params.duration = String(duration);
  const query = Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}/campus/summary${query}`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function postQueryTime(day: string, time: string, duration: number = 60) {
  const res = await fetch(`${API_BASE}/sim/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day, start_time: time, duration_minutes: duration }),
  });
  if (!res.ok) throw new Error('Query update failed');
  return res.json();
}

export async function resetQueryTime() {
  const res = await fetch(`${API_BASE}/sim/time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulated_time: null, day_override: null }),
  });
  if (!res.ok) throw new Error('Reset failed');
  return res.json();
}

export async function postFacultyRelease(roomId: string, facultyId: string, reason?: string) {
  const res = await fetch(`${API_BASE}/faculty/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, faculty_id: facultyId, reason }),
  });
  if (!res.ok) throw new Error('Faculty release failed');
  return res.json();
}

export async function postQRReport(roomId: string, reportType: 'ROOM_UNAVAILABLE' | 'ROOM_RELEASED', reason: string) {
  const res = await fetch(`${API_BASE}/qr/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, report_type: reportType, reason }),
  });
  if (!res.ok) throw new Error('QR report failed');
  return res.json();
}

export async function postSimTime(simulatedTime: string | null, dayOverride?: string) {
  const res = await fetch(`${API_BASE}/sim/time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulated_time: simulatedTime, day_override: dayOverride }),
  });
  if (!res.ok) throw new Error('Sim time update failed');
  return res.json();
}

export async function getSimTime() {
  const res = await fetch(`${API_BASE}/sim/time`);
  if (!res.ok) throw new Error('Failed to get sim time');
  return res.json();
}

export async function clearOverride(roomId: string) {
  const res = await fetch(`${API_BASE}/overrides/clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId }),
  });
  if (!res.ok) throw new Error('Clear override failed');
  return res.json();
}

export function createWebSocket(onMessage: (msg: WSMessage) => void, onOpen?: () => void, onClose?: () => void): WebSocket {
  const ws = new WebSocket(WS_BASE);
  ws.onopen = () => onOpen?.();
  ws.onmessage = (event) => {
    try {
      const msg: WSMessage = JSON.parse(event.data);
      onMessage(msg);
    } catch (_) {}
  };
  ws.onclose = () => onClose?.();
  ws.onerror = () => onClose?.();
  return ws;
}
