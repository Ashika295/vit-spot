from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.models import FacultyReleaseRequest, QRReportRequest
from backend.state_manager import state_manager
from backend.database import db_instance

router = APIRouter(tags=["Overrides"])

@router.post("/faculty/release")
async def faculty_release(req: FacultyReleaseRequest):
    """
    Faculty portal action: marks currently allocated class as ended early.
    Flips room immediately to AVAILABLE with source = FACULTY_OVERRIDE,
    recalculates free_duration against the true next scheduled interval,
    and broadcasts to all connected clients.
    """
    r_id = req.room_id.strip().upper()
    if r_id not in db_instance.rooms_cache:
        raise HTTPException(status_code=404, detail=f"Room {req.room_id} not recognized.")
        
    reason_text = f"Faculty {req.faculty_id}: {req.reason or 'Class ended early'}"
    await state_manager.trigger_override(
        room_id=r_id,
        status="AVAILABLE",
        source="FACULTY",
        reason=reason_text
    )
    
    updated_status = state_manager.status_cache.get(r_id)
    return {
        "success": True,
        "message": f"Class ended early in {r_id}. Room flipped to AVAILABLE.",
        "room_status": updated_status
    }

@router.post("/qr/report")
async def qr_report(req: QRReportRequest):
    """
    QR Physical Verification exception reporting:
    - 'ROOM_UNAVAILABLE': schedule says free, but room is locked/in-use.
    - 'ROOM_RELEASED': schedule says occupied, but room physically empty.
    """
    r_id = req.room_id.strip().upper()
    if r_id not in db_instance.rooms_cache:
        raise HTTPException(status_code=404, detail=f"Room {req.room_id} not recognized.")
        
    report_type = req.report_type.strip().upper()
    status_target = "OCCUPIED" if report_type == "ROOM_UNAVAILABLE" else "AVAILABLE"
    
    await state_manager.trigger_override(
        room_id=r_id,
        status=status_target,
        source="QR",
        reason=req.reason
    )
    
    updated_status = state_manager.status_cache.get(r_id)
    return {
        "success": True,
        "message": f"Physical QR report registered for {r_id}.",
        "room_status": updated_status
    }

@router.post("/overrides/clear")
async def clear_override(payload: Dict[str, str]):
    """Clears an active override for a room and restores scheduled baseline."""
    room_id = payload.get("room_id", "").strip().upper()
    if not room_id or room_id not in db_instance.rooms_cache:
        raise HTTPException(status_code=404, detail="Room not found.")
        
    await state_manager.clear_override(room_id)
    return {
        "success": True,
        "message": f"Override cleared for {room_id}.",
        "room_status": state_manager.status_cache.get(room_id)
    }

@router.get("/overrides")
def list_overrides():
    """Returns all currently active overrides."""
    return list(db_instance.overrides_cache.values())
