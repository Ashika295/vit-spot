from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import time
from backend.models import RoomStatus, Room, RoomSchedule, LiveOverride
from backend.state_manager import state_manager
from backend.availability_engine import resolve_room_availability, parse_time_str
from backend.database import db_instance

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.get("", response_model=List[RoomStatus])
def get_rooms(
    day: Optional[str] = Query(None, description="Day of the week, e.g. MON, TUE, WED, THU, FRI"),
    start_time: Optional[str] = Query(None, alias="time", description="Start time in HH:MM (24-hr) format, e.g. 11:00"),
    duration: Optional[int] = Query(None, description="Query duration in minutes, e.g. 60"),
    floor: Optional[int] = Query(None, description="Filter by floor index: 0 (Ground) to 7"),
    type: Optional[str] = Query(None, description="Filter by room type: THEORY, LAB, SMART_CLASSROOM, EXAM_HALL"),
    school: Optional[str] = Query(None, description="Filter by school: SCOPE, SENSE, VAIAL, etc."),
    status: Optional[str] = Query(None, description="Filter by status: AVAILABLE, OCCUPIED, ENDING_SOON, UNKNOWN"),
    min_free_minutes: Optional[int] = Query(None, description="Filter rooms free for at least X minutes"),
    search: Optional[str] = Query(None, description="Search room ID or number, e.g. PRP124, 107"),
    include_cabins: bool = Query(False, description="Whether to include faculty cabins (default False)")
):
    """
    Returns verified rooms in Pearl Research Park with mathematically resolved availability.
    If day and time are provided in query, resolves specifically against that window.
    Otherwise, uses the current query state or returns UNKNOWN status prompting the user.
    """
    # Resolve target time window
    if day is not None or start_time is not None:
        target_day = day.strip().upper() if day else None
        target_time = parse_time_str(start_time) if start_time else None
        target_dur = duration or 60
    else:
        target_day, target_time, _ = state_manager.get_query_window()
        target_dur = state_manager.selected_duration or 60

    target_end = None
    if target_time is not None:
        from datetime import datetime, timedelta
        start_dt = datetime.combine(datetime.today(), target_time)
        target_end = (start_dt + timedelta(minutes=target_dur)).time()

    rooms_result: List[RoomStatus] = []

    for room_id, room_data in db_instance.rooms_cache.items():
        room = Room(**room_data)

        # Requirement 4: Exclude teacher cabins from student availability queries by default
        if not include_cabins and not room.student_accessible:
            continue

        schedules = [
            RoomSchedule(**s)
            for s in db_instance.schedules_cache
            if s["room_id"] == room_id
        ]
        override_data = db_instance.overrides_cache.get(room_id)
        live_override = LiveOverride(**override_data) if override_data else None

        r_status = resolve_room_availability(
            room=room,
            day=target_day,
            start_time_obj=target_time,
            end_time_obj=target_end,
            schedule_intervals=schedules,
            live_override=live_override
        )
        rooms_result.append(r_status)

    # Apply filters
    if floor is not None:
        rooms_result = [r for r in rooms_result if r.floor == floor]

    if type:
        rooms_result = [r for r in rooms_result if r.room_type.upper() == type.upper()]

    if school:
        rooms_result = [r for r in rooms_result if r.school and r.school.upper() == school.upper()]

    if status:
        stat_upper = status.upper()
        if stat_upper == "AVAILABLE":
            rooms_result = [r for r in rooms_result if r.status in ["AVAILABLE", "ENDING_SOON"]]
        else:
            rooms_result = [r for r in rooms_result if r.status.upper() == stat_upper]

    if min_free_minutes is not None:
        filtered = []
        for r in rooms_result:
            if r.status in ["AVAILABLE", "ENDING_SOON"]:
                if r.free_duration is None or r.free_duration >= min_free_minutes:
                    filtered.append(r)
        rooms_result = filtered

    if search:
        s_clean = search.strip().upper()
        rooms_result = [r for r in rooms_result if s_clean in r.room_id.upper() or s_clean in r.room_number.upper()]

    # Sort rooms logically: Floor ASC, then Room ID
    rooms_result.sort(key=lambda r: (r.floor, r.room_id))
    return rooms_result

@router.get("/{room_id}")
def get_room_detail(room_id: str, day: Optional[str] = Query(None)):
    """Returns detailed information and schedules for a single room."""
    r_clean = room_id.strip().upper()
    if not r_clean.startswith("PRP"):
        r_clean = f"PRP{r_clean}"

    room_data = db_instance.rooms_cache.get(r_clean)
    if not room_data:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found in PRP")

    target_day = day.strip().upper() if day else (state_manager.selected_day or "MON")

    room = Room(**room_data)
    all_schedules = [
        s for s in db_instance.schedules_cache
        if s["room_id"] == r_clean
    ]
    today_schedules = [s for s in all_schedules if s["day"] == target_day]
    today_schedules.sort(key=lambda s: s["start_time"])

    override_data = db_instance.overrides_cache.get(r_clean)

    return {
        "room": room,
        "query_day": target_day,
        "today_schedule": today_schedules,
        "weekly_schedule": all_schedules,
        "active_override": override_data,
    }

@router.get("/{room_id}/timeline")
def get_room_timeline(room_id: str, day: Optional[str] = Query(None)):
    """Returns timetable timeline intervals for visual inspection."""
    r_clean = room_id.strip().upper()
    if not r_clean.startswith("PRP"):
        r_clean = f"PRP{r_clean}"

    room_data = db_instance.rooms_cache.get(r_clean)
    if not room_data:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found in PRP")

    target_day = day.strip().upper() if day else (state_manager.selected_day or "MON")

    all_schedules = [
        s for s in db_instance.schedules_cache
        if s["room_id"] == r_clean
    ]
    today_schedules = [s for s in all_schedules if s["day"] == target_day]
    today_schedules.sort(key=lambda s: s["start_time"])

    room = Room(**room_data)
    override_data = db_instance.overrides_cache.get(r_clean)
    live_override = LiveOverride(**override_data) if override_data else None

    target_day_state, s_time, e_time = state_manager.get_query_window()

    status = resolve_room_availability(
        room=room,
        day=target_day,
        start_time_obj=s_time,
        end_time_obj=e_time,
        schedule_intervals=[RoomSchedule(**s) for s in all_schedules],
        live_override=live_override
    )

    return {
        "room_id": r_clean,
        "room_number": room.room_number,
        "floor": room.floor,
        "room_type": room.room_type,
        "school": room.school,
        "day": target_day,
        "status": status,
        "intervals": today_schedules,
        "week_schedule": all_schedules,
    }
