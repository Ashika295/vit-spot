"""
State Manager for VitSpot.
Coordinates room caching, live query parameters, WebSocket broadcasts,
overrides, and simulation clocks.
"""

from datetime import datetime, time, timedelta
from typing import Dict, List, Optional, Set, Any, Tuple
import asyncio
import json
import logging
from fastapi import WebSocket

from backend.models import Room, RoomSchedule, LiveOverride, RoomStatus
from backend.availability_engine import resolve_room_availability, parse_time_str
from backend.database import db_instance

logger = logging.getLogger("vitspot.state")

WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

class StateManager:
    def __init__(self):
        self.active_websockets: Set[WebSocket] = set()

        # Selected query parameters (None by default so we don't assume Monday / random time)
        self.selected_day: Optional[str] = None
        self.selected_time: Optional[time] = None
        self.selected_duration: Optional[int] = 60 # default 60 minutes when time is selected

        # Simulation clock state (if user uses sim panel)
        self.simulated_datetime: Optional[datetime] = None
        self.simulated_day_override: Optional[str] = None

        # Cached statuses
        self.status_cache: Dict[str, RoomStatus] = {}

    def get_query_window(self) -> Tuple[Optional[str], Optional[time], Optional[time]]:
        """
        Resolves effective day, start_time, and end_time.
        Returns (None, None, None) if user has not selected date/time.
        """
        if self.simulated_datetime is not None:
            day = self.simulated_day_override or WEEKDAYS[self.simulated_datetime.weekday()]
            s_time = self.simulated_datetime.time()
            dur = self.selected_duration or 60
            start_dt = datetime.combine(datetime.today(), s_time)
            e_time = (start_dt + timedelta(minutes=dur)).time()
            return day, s_time, e_time

        if self.selected_day is not None and self.selected_time is not None:
            dur = self.selected_duration or 60
            start_dt = datetime.combine(datetime.today(), self.selected_time)
            e_time = (start_dt + timedelta(minutes=dur)).time()
            return self.selected_day, self.selected_time, e_time

        return None, None, None

    def set_query(self, day: Optional[str], time_str: Optional[str], duration: Optional[int] = 60):
        """Sets the active availability query window."""
        self.selected_day = day.strip().upper() if day else None
        if time_str:
            self.selected_time = parse_time_str(time_str)
        else:
            self.selected_time = None
        self.selected_duration = duration or 60
        self.recompute_all()

    def set_simulation_time(self, iso_string: Optional[str], day_override: Optional[str] = None):
        """Sets or resets the simulation clock."""
        if iso_string:
            self.simulated_datetime = datetime.fromisoformat(iso_string)
        else:
            self.simulated_datetime = None
        self.simulated_day_override = day_override.strip().upper() if day_override else None
        self.recompute_all()

    async def connect_ws(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        day, s_time, _ = self.get_query_window()
        initial_payload = {
            "type": "INITIAL_STATE",
            "rooms": [s.model_dump() for s in self.status_cache.values()],
            "simulated_time": self.simulated_datetime.isoformat() if self.simulated_datetime else None,
            "day": day,
            "time": s_time.strftime("%H:%M") if s_time else None,
            "is_query_active": day is not None and s_time is not None,
        }
        await websocket.send_text(json.dumps(initial_payload))

    def disconnect_ws(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)

    async def broadcast_room_update(self, room_status: RoomStatus):
        payload = {
            "type": "ROOM_UPDATE",
            "room": room_status.model_dump(),
        }
        message = json.dumps(payload)
        stale = set()
        for ws in self.active_websockets:
            try:
                await ws.send_text(message)
            except Exception:
                stale.add(ws)
        for s in stale:
            self.active_websockets.discard(s)

    async def broadcast_all(self):
        day, s_time, _ = self.get_query_window()
        payload = {
            "type": "ROOM_STATE_UPDATE",
            "rooms": [s.model_dump() for s in self.status_cache.values()],
            "simulated_time": self.simulated_datetime.isoformat() if self.simulated_datetime else None,
            "day": day,
            "time": s_time.strftime("%H:%M") if s_time else None,
            "is_query_active": day is not None and s_time is not None,
        }
        message = json.dumps(payload)
        stale = set()
        for ws in self.active_websockets:
            try:
                await ws.send_text(message)
            except Exception:
                stale.add(ws)
        for s in stale:
            self.active_websockets.discard(s)

    def recompute_room(self, room_id: str) -> Optional[RoomStatus]:
        room_data = db_instance.rooms_cache.get(room_id)
        if not room_data:
            return None

        room = Room(**room_data)
        day, s_time, e_time = self.get_query_window()

        schedules = [
            RoomSchedule(**s)
            for s in db_instance.schedules_cache
            if s["room_id"] == room_id
        ]

        override_data = db_instance.overrides_cache.get(room_id)
        live_override = LiveOverride(**override_data) if override_data else None

        new_status = resolve_room_availability(
            room=room,
            day=day,
            start_time_obj=s_time,
            end_time_obj=e_time,
            schedule_intervals=schedules,
            live_override=live_override
        )
        self.status_cache[room_id] = new_status
        return new_status

    def recompute_all(self):
        for room_id in db_instance.rooms_cache.keys():
            self.recompute_room(room_id)

    async def trigger_override(self, room_id: str, status: str, source: str, reason: str):
        now_iso = datetime.now().isoformat()
        override = LiveOverride(
            room_id=room_id,
            status=status,
            override_time=now_iso,
            source=source,
            reason=reason,
            expires_at=None
        )
        db_instance.overrides_cache[room_id] = override.model_dump()

        if db_instance.db is not None:
            await db_instance.db.live_overrides.replace_one(
                {"room_id": room_id},
                override.model_dump(),
                upsert=True
            )

        new_status = self.recompute_room(room_id)
        if new_status:
            await self.broadcast_room_update(new_status)

    async def clear_override(self, room_id: str):
        if room_id in db_instance.overrides_cache:
            del db_instance.overrides_cache[room_id]
        if db_instance.db is not None:
            await db_instance.db.live_overrides.delete_one({"room_id": room_id})
        new_status = self.recompute_room(room_id)
        if new_status:
            await self.broadcast_room_update(new_status)

    async def event_scheduler_loop(self):
        """
        Periodically checks for room state transitions when query is active.
        """
        while True:
            try:
                await asyncio.sleep(10)
                day, s_time, _ = self.get_query_window()
                if day and s_time:
                    # If query is active, verify if any room status needs update
                    self.recompute_all()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in scheduler loop: %s", e)

state_manager = StateManager()
