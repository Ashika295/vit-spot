from fastapi import APIRouter
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from backend.models import SimTimeRequest
from backend.state_manager import state_manager

router = APIRouter(prefix="/sim", tags=["Simulation"])

class QueryTimeRequest(BaseModel):
    day: Optional[str] = Field(None, description="Day of week: MON, TUE, WED, THU, FRI, SAT, SUN or null to clear")
    start_time: Optional[str] = Field(None, description="Start time HH:MM or null to clear")
    duration: Optional[int] = Field(60, description="Duration in minutes")

@router.get("/time")
def get_sim_time() -> Dict[str, Any]:
    """Returns current query state and simulation status."""
    day, s_time, e_time = state_manager.get_query_window()
    return {
        "is_query_active": day is not None and s_time is not None,
        "day": day,
        "time": s_time.strftime("%H:%M") if s_time else None,
        "end_time": e_time.strftime("%H:%M") if e_time else None,
        "duration": state_manager.selected_duration,
        "is_simulated": state_manager.simulated_datetime is not None,
    }

@router.post("/query")
async def set_query_time(req: QueryTimeRequest):
    """
    Sets the active date/time/duration query across the platform.
    If day or start_time is null, resets query to unselected state.
    """
    state_manager.set_query(
        day=req.day,
        time_str=req.start_time,
        duration=req.duration or 60
    )
    await state_manager.broadcast_all()
    day, s_time, e_time = state_manager.get_query_window()
    return {
        "success": True,
        "is_query_active": day is not None and s_time is not None,
        "day": day,
        "time": s_time.strftime("%H:%M") if s_time else None,
        "end_time": e_time.strftime("%H:%M") if e_time else None,
        "duration": state_manager.selected_duration,
    }

@router.post("/time")
async def set_sim_time(req: SimTimeRequest):
    """
    Sets simulated date/time or resets to unselected live state.
    Immediately recomputes all rooms and pushes state over WebSocket.
    """
    state_manager.set_simulation_time(
        iso_string=req.simulated_time,
        day_override=req.day_override
    )
    await state_manager.broadcast_all()
    day, s_time, e_time = state_manager.get_query_window()
    return {
        "success": True,
        "message": "Simulation time updated.",
        "is_query_active": day is not None and s_time is not None,
        "day": day,
        "time": s_time.strftime("%H:%M") if s_time else None,
        "is_simulated": state_manager.simulated_datetime is not None,
    }
