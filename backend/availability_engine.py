"""
Deterministic Availability Engine for VitSpot.
Computes space availability strictly through mathematical interval overlap against
official timetable schedules, without mock defaults or artificial data.
"""

from datetime import datetime, time, timedelta
from typing import List, Optional, Dict, Any
from backend.models import RoomSchedule, LiveOverride, RoomStatus, Room

WORKING_DAY_START = "08:00"
WORKING_DAY_END = "19:50"

def parse_time_str(t_str: str) -> time:
    """Parses 'HH:MM' string into datetime.time object."""
    parts = t_str.strip().split(":")
    return time(int(parts[0]), int(parts[1]))

def time_to_minutes(t: time) -> int:
    """Converts a datetime.time object to minutes from midnight."""
    return t.hour * 60 + t.minute

def minutes_diff(t_end_str_or_time: Any, t_start_str_or_time: Any) -> int:
    """Calculates difference in minutes between two times."""
    t_end = parse_time_str(t_end_str_or_time) if isinstance(t_end_str_or_time, str) else t_end_str_or_time
    t_start = parse_time_str(t_start_str_or_time) if isinstance(t_start_str_or_time, str) else t_start_str_or_time
    return time_to_minutes(t_end) - time_to_minutes(t_start)

def resolve_room_availability(
    room: Room,
    day: Optional[str] = None,
    start_time_obj: Optional[time] = None,
    end_time_obj: Optional[Any] = None,
    schedule_intervals: Optional[List[RoomSchedule]] = None,
    live_override: Optional[LiveOverride] = None
) -> RoomStatus:
    if isinstance(end_time_obj, list):
        schedule_intervals = end_time_obj
        end_time_obj = None
    elif schedule_intervals is None:
        schedule_intervals = []

    now_iso = datetime.now().isoformat()
    room_number = room.room_number or room.room_id.replace("PRP", "")

    status = "UNKNOWN"
    free_until: Optional[str] = None
    free_duration: Optional[int] = None
    available_from: Optional[str] = None
    occupied_duration_left: Optional[int] = None
    next_change: Optional[str] = None
    display_note: Optional[str] = "Select a date and time to check availability."
    current_class: Optional[Dict[str, Any]] = None
    next_class: Optional[Dict[str, Any]] = None
    source = "OFFICIAL_REGISTRY"

    if day is not None and start_time_obj is not None:
        day_upper = day.strip().upper()
        q_start_min = time_to_minutes(start_time_obj)
        q_end_min = time_to_minutes(end_time_obj) if end_time_obj is not None else None

        today_intervals = [s for s in schedule_intervals if s.day.upper() == day_upper]
        today_intervals.sort(key=lambda s: parse_time_str(s.start_time))

        source = "VERIFIED_TIMETABLE" if today_intervals else "OFFICIAL_REGISTRY"

        if today_intervals:
            # Find currently active class at start_time_obj
            active_class = None
            upcoming_intervals: List[RoomSchedule] = []

            for interval in today_intervals:
                int_s = time_to_minutes(parse_time_str(interval.start_time))
                int_e = time_to_minutes(parse_time_str(interval.end_time))

                if int_s <= q_start_min < int_e:
                    active_class = interval
                elif int_s > q_start_min:
                    upcoming_intervals.append(interval)

            if active_class is not None:
                status = "OCCUPIED"
                available_from = active_class.end_time
                next_change = active_class.end_time
                occupied_duration_left = minutes_diff(active_class.end_time, start_time_obj)
                current_class = {
                    "course_code": active_class.course_code,
                    "course_name": active_class.course_name,
                    "slot_id": active_class.slot_id,
                    "start_time": active_class.start_time,
                    "end_time": active_class.end_time,
                }
                if upcoming_intervals:
                    next_class = {
                        "course_code": upcoming_intervals[0].course_code,
                        "course_name": upcoming_intervals[0].course_name,
                        "slot_id": upcoming_intervals[0].slot_id,
                        "start_time": upcoming_intervals[0].start_time,
                        "end_time": upcoming_intervals[0].end_time,
                    }
                display_note = f"Occupied by {active_class.course_code} ({active_class.slot_id}) until {available_from}"
            else:
                # No active class right now at start_time_obj
                req_dur = (q_end_min - q_start_min) if q_end_min is not None else 60

                if upcoming_intervals:
                    next_int = upcoming_intervals[0]
                    free_until = next_int.start_time
                    next_change = next_int.start_time
                    free_duration = minutes_diff(next_int.start_time, start_time_obj)
                    next_class = {
                        "course_code": next_int.course_code,
                        "course_name": next_int.course_name,
                        "slot_id": next_int.slot_id,
                        "start_time": next_int.start_time,
                        "end_time": next_int.end_time,
                    }
                    if free_duration >= req_dur:
                        status = "AVAILABLE"
                        display_note = f"Free until {free_until} ({free_duration} mins available)"
                    elif free_duration <= 30:
                        status = "ENDING_SOON"
                        display_note = f"Ending soon: Free for only {free_duration} mins until {free_until} (less than {req_dur}m requested)"
                    else:
                        status = "OCCUPIED"
                        display_note = f"Conflict: Class starts at {free_until} ({free_duration} mins available, but {req_dur}m requested)"
                else:
                    status = "AVAILABLE"
                    free_until = None
                    free_duration = None
                    display_note = "Free for remainder of day (no further classes scheduled)"
                    next_change = WORKING_DAY_END
        else:
            status = "UNKNOWN"
            display_note = f"No uploaded timetable records for {room.room_id} on {day_upper}."
            source = "OFFICIAL_REGISTRY"

    # Apply live override if active
    if live_override is not None:
        ov_src = live_override.source.upper()
        if ov_src == "FACULTY":
            status = "AVAILABLE"
            source = "FACULTY_OVERRIDE"
            display_note = f"Faculty Early Release: {live_override.reason}"
            current_class = None
            occupied_duration_left = None
            available_from = None
            if day and start_time_obj:
                today_intervals = [s for s in schedule_intervals if s.day.upper() == day.upper()]
                upcoming = [s for s in today_intervals if time_to_minutes(parse_time_str(s.start_time)) > time_to_minutes(start_time_obj)]
                if upcoming:
                    upcoming.sort(key=lambda s: parse_time_str(s.start_time))
                    next_int = upcoming[0]
                    free_until = next_int.start_time
                    next_change = next_int.start_time
                    free_duration = minutes_diff(next_int.start_time, start_time_obj)
                    if free_duration <= 30:
                        status = "ENDING_SOON"
        elif ov_src == "QR":
            source = "QR_VERIFIED"
            if live_override.status.upper() == "OCCUPIED" or "UNAVAILABLE" in live_override.reason.upper():
                status = "OCCUPIED"
                display_note = f"QR Exception: {live_override.reason}"
                free_until = None
                free_duration = None
            else:
                status = "AVAILABLE"
                display_note = f"QR Verified: {live_override.reason}"
        elif ov_src == "ADMIN":
            status = live_override.status.upper()
            source = "ADMIN"
            display_note = f"Admin Override: {live_override.reason}"

    return RoomStatus(
        room_id=room.room_id,
        room_number=room_number,
        building=room.building,
        block=room.block,
        floor=room.floor,
        room_type=room.room_type,
        raw_type=room.raw_type,
        school=room.school,
        student_accessible=room.student_accessible,
        capacity=room.capacity,
        status=status,
        next_change=next_change,
        free_until=free_until,
        free_duration=free_duration,
        available_from=available_from,
        occupied_duration_left=occupied_duration_left,
        source=source,
        display_note=display_note,
        current_class=current_class,
        next_class=next_class,
        updated_at=now_iso,
    )
