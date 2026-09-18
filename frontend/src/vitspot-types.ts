// VitSpot core data models matching backend schemas

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'ENDING_SOON' | 'UNKNOWN';
export type SourceBadge = 'SCHEDULED' | 'VERIFIED_TIMETABLE' | 'OFFICIAL_REGISTRY' | 'FACULTY_OVERRIDE' | 'QR_VERIFIED' | 'SYNTHETIC_DEMO' | 'ADMIN';
export type RoomType = 'THEORY' | 'LAB' | 'SMART_CLASSROOM' | 'RESEARCH_LAB' | 'FACULTY_CABIN' | 'OTHER';

export interface ClassInfo {
  course_code: string;
  course_name: string;
  slot_id: string;
  start_time: string;
  end_time: string;
}

export interface Room {
  room_id: string;
  room_number?: string;
  building: string;
  block?: string;
  floor: number;
  room_type: RoomType;
  school?: string;
  student_accessible?: boolean;
  capacity: number | null;
  status: RoomStatus;
  next_change: string | null;
  free_until: string | null;
  free_duration: number | null;
  available_from: string | null;
  occupied_duration_left: number | null;
  source: SourceBadge;
  display_note: string | null;
  current_class: ClassInfo | null;
  next_class: ClassInfo | null;
  updated_at: string;
}

export interface FloorStats {
  total: number;
  available: number;
  occupied: number;
  ending_soon: number;
  unknown?: number;
}

export interface CampusSummary {
  building: string;
  total_rooms: number;
  total_faculty_cabins?: number;
  is_query_active: boolean;
  available_count: number;
  occupied_count: number;
  ending_soon_count: number;
  unknown_count: number;
  overrides_count: number;
  day: string | null;
  time: string | null;
  duration?: number;
  is_simulated?: boolean;
  prompt_message?: string;
  floor_stats: Record<string, FloorStats>;
}

export interface TimelineInterval {
  day: string;
  room_id: string;
  course_code: string;
  course_name: string;
  class_id: string;
  slot_id: string;
  start_time: string;
  end_time: string;
  source: string;
}

export interface SimTime {
  effective_iso: string | null;
  day: string | null;
  time: string | null;
  is_simulated: boolean;
  is_query_active?: boolean;
  duration?: number;
}

export type WSMessage =
  | { type: 'INITIAL_STATE'; rooms: Room[]; simulated_time: string | null; day: string | null }
  | { type: 'ROOM_UPDATE'; room: Room }
  | { type: 'ROOM_STATE_UPDATE'; rooms: Room[]; simulated_time: string | null; day: string | null };

// Runtime fallback exports to prevent any module resolution errors in browser ESM
export const Room = {};
export const CampusSummary = {};
export const WSMessage = {};
export const SimTime = {};
export const FloorStats = {};
export const TimelineInterval = {};
export const ClassInfo = {};
