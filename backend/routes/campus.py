from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from backend.state_manager import state_manager
from backend.database import db_instance
from backend.models import Room, RoomSchedule, LiveOverride
from backend.availability_engine import resolve_room_availability, parse_time_str
from datetime import datetime, timedelta

router = APIRouter(prefix="/campus", tags=["Campus"])

@router.get("/summary")
def get_campus_summary(
    day: Optional[str] = Query(None),
    time: Optional[str] = Query(None),
    duration: Optional[int] = Query(None),
) -> Dict[str, Any]:
    """
    Returns high-level space intelligence stats for Pearl Research Park.
    Reflects the exact query window or prompts user when unselected.
    """
    if day is not None or time is not None:
        target_day = day.strip().upper() if day else None
        target_time = parse_time_str(time) if time else None
        target_dur = duration or 60
    else:
        target_day, target_time, _ = state_manager.get_query_window()
        target_dur = state_manager.selected_duration or 60

    target_end = None
    if target_time is not None:
        start_dt = datetime.combine(datetime.today(), target_time)
        target_end = (start_dt + timedelta(minutes=target_dur)).time()

    is_query_active = target_day is not None and target_time is not None

    student_rooms = [
        Room(**r) for r in db_instance.rooms_cache.values()
        if r.get("student_accessible", True)
    ]
    total_student_rooms = len(student_rooms)
    total_teacher_cabins = sum(1 for r in db_instance.rooms_cache.values() if not r.get("student_accessible", True))

    floor_stats: Dict[int, Dict[str, int]] = {}
    for f in range(8):
        floor_rooms = [r for r in student_rooms if r.floor == f]
        floor_stats[f] = {
            "total": len(floor_rooms),
            "available": 0,
            "occupied": 0,
            "ending_soon": 0,
            "unknown": len(floor_rooms),
        }

    available_count = 0
    occupied_count = 0
    ending_soon_count = 0
    unknown_count = total_student_rooms

    if is_query_active:
        unknown_count = 0
        for room in student_rooms:
            schedules = [
                RoomSchedule(**s)
                for s in db_instance.schedules_cache
                if s["room_id"] == room.room_id
            ]
            override_data = db_instance.overrides_cache.get(room.room_id)
            live_override = LiveOverride(**override_data) if override_data else None

            status = resolve_room_availability(
                room=room,
                day=target_day,
                start_time_obj=target_time,
                end_time_obj=target_end,
                schedule_intervals=schedules,
                live_override=live_override
            )

            f = room.floor
            if status.status == "AVAILABLE":
                available_count += 1
                floor_stats[f]["available"] += 1
                floor_stats[f]["unknown"] -= 1
            elif status.status == "OCCUPIED":
                occupied_count += 1
                floor_stats[f]["occupied"] += 1
                floor_stats[f]["unknown"] -= 1
            elif status.status == "ENDING_SOON":
                ending_soon_count += 1
                floor_stats[f]["ending_soon"] += 1
                floor_stats[f]["unknown"] -= 1
            else:
                unknown_count += 1

    return {
        "building": "Pearl Research Park (PRP)",
        "total_rooms": total_student_rooms,
        "total_faculty_cabins": total_teacher_cabins,
        "is_query_active": is_query_active,
        "day": target_day,
        "time": target_time.strftime("%H:%M") if target_time else None,
        "duration": target_dur,
        "available_count": available_count,
        "occupied_count": occupied_count,
        "ending_soon_count": ending_soon_count,
        "unknown_count": unknown_count,
        "overrides_count": len(db_instance.overrides_cache),
        "floor_stats": floor_stats,
    }
