import { Room, SourceBadge, RoomStatus, RoomType } from './vitspot-types';

export function getStatusColor(status: RoomStatus): string {
  switch (status) {
    case 'AVAILABLE': return '#10b981';
    case 'OCCUPIED': return '#f43f5e';
    case 'ENDING_SOON': return '#f59e0b';
    case 'UNKNOWN':
    default: return '#6b7280';
  }
}

export function getStatusBgClass(status: RoomStatus): string {
  switch (status) {
    case 'AVAILABLE': return 'bg-available';
    case 'OCCUPIED': return 'bg-occupied';
    case 'ENDING_SOON': return 'bg-ending-soon';
    case 'UNKNOWN':
    default: return 'bg-unknown';
  }
}

export function getStatusGlowClass(status: RoomStatus): string {
  switch (status) {
    case 'AVAILABLE': return 'glow-available';
    case 'OCCUPIED': return 'glow-occupied';
    case 'ENDING_SOON': return 'glow-ending';
    case 'UNKNOWN':
    default: return '';
  }
}

export function getStatusLabel(status: RoomStatus): string {
  switch (status) {
    case 'AVAILABLE': return 'Available';
    case 'OCCUPIED': return 'Occupied';
    case 'ENDING_SOON': return 'Ending Soon';
    case 'UNKNOWN':
    default: return 'Awaiting Time';
  }
}

export function getSourceBadgeClass(source: SourceBadge): string {
  switch (source) {
    case 'SCHEDULED':
    case 'VERIFIED_TIMETABLE': return 'badge-scheduled';
    case 'OFFICIAL_REGISTRY': return 'badge-official';
    case 'FACULTY_OVERRIDE': return 'badge-faculty';
    case 'QR_VERIFIED': return 'badge-qr';
    case 'SYNTHETIC_DEMO': return 'badge-demo';
    case 'ADMIN': return 'badge-admin';
    default: return 'badge-scheduled';
  }
}

export function getSourceBadgeLabel(source: SourceBadge): string {
  switch (source) {
    case 'SCHEDULED':
    case 'VERIFIED_TIMETABLE': return 'Timetable';
    case 'OFFICIAL_REGISTRY': return 'VIT Registry';
    case 'FACULTY_OVERRIDE': return 'Faculty Override';
    case 'QR_VERIFIED': return 'QR Verified';
    case 'SYNTHETIC_DEMO': return 'Demo Data';
    case 'ADMIN': return 'Admin';
    default: return 'Official';
  }
}

export function formatDisplayRoomNumber(room: Room): string {
  // Use room_number if present, else sanitize room_id
  let num = room.room_number || room.room_id.replace(/^PRP-?/i, '');
  // Clean off trailing parentheses like (1) or (2), trailing index numbers like -1, or trailing duplicate suffixes like -A
  num = num.replace(/\s*\(\d+\)$/, '').replace(/-\d+$/, '').replace(/-[A-Z]$/, '');
  return `PRP ${num.trim()}`;
}

export function getRoomTypeLabel(type: RoomType): string {
  switch (type) {
    case 'THEORY': return 'Theory';
    case 'LAB': return 'Lab';
    case 'SMART_CLASSROOM': return 'Smart Room';
    case 'RESEARCH_LAB': return 'Research Lab';
    case 'FACULTY_CABIN': return 'Faculty Cabin';
    default: return 'Classroom';
  }
}

export function formatFreeTime(room: Room): string {
  if (room.status === 'UNKNOWN') {
    return 'Select day & time';
  }
  if (room.status === 'OCCUPIED') {
    if (room.occupied_duration_left !== null && room.occupied_duration_left !== undefined) {
      return `Free in ${room.occupied_duration_left} min`;
    }
    if (room.available_from) return `Free at ${room.available_from}`;
    return 'Occupied';
  }
  if (room.free_duration !== null && room.free_duration !== undefined) {
    const h = Math.floor(room.free_duration / 60);
    const m = room.free_duration % 60;
    if (h > 0) return `Free for ${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    return `Free for ${m} min`;
  }
  if (room.display_note?.includes('remainder') || room.display_note?.includes('all day')) return 'Free all day';
  return 'Available';
}

export function formatNextClass(room: Room): string | null {
  if (!room.next_class) return null;
  return `Next: ${room.next_class.course_code} at ${room.next_class.start_time}`;
}

export function timeToPercent(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const dayStart = 8 * 60; // 08:00
  const dayEnd = 19 * 60 + 50; // 19:50
  const totalMinutes = h * 60 + m;
  return Math.max(0, Math.min(100, ((totalMinutes - dayStart) / (dayEnd - dayStart)) * 100));
}

export function getFloorName(floor: number): string {
  if (floor === 0) return 'Ground Floor';
  return `Floor ${floor}`;
}

export const FLOOR_LABELS: Record<number, string> = {
  0: 'G', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7'
};

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday'
};

export const DEMO_SIM_SLOTS: { label: string; iso: string; day: string; time: string; desc: string }[] = [
  { label: 'Mon 08:25 AM', iso: '2026-09-14T08:25:00', day: 'MON', time: '08:25', desc: 'A1 / F1 slots in session' },
  { label: 'Mon 11:30 AM', iso: '2026-09-14T11:30:00', day: 'MON', time: '11:30', desc: 'C1 / D1 slots' },
  { label: 'Tue 10:15 AM', iso: '2026-09-15T10:15:00', day: 'TUE', time: '10:15', desc: 'B1 / G1 lectures' },
  { label: 'Wed 13:15 PM', iso: '2026-09-16T13:15:00', day: 'WED', time: '13:15', desc: 'Lunch break — most rooms open' },
  { label: 'Thu 15:45 PM', iso: '2026-09-17T15:45:00', day: 'THU', time: '15:45', desc: 'Afternoon labs & theory' },
  { label: 'Fri 17:50 PM', iso: '2026-09-18T17:50:00', day: 'FRI', time: '17:50', desc: 'Evening slots wrapping up' },
];
