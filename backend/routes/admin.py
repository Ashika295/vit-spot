from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from backend.models import AdminUploadRequest
from backend.parser import ingest_allocation_entry
from backend.state_manager import state_manager
from backend.database import db_instance
from backend.seed_data import populate_database

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/rooms")
def get_admin_rooms() -> List[Dict[str, Any]]:
    """Returns management view of all tracked PRP rooms."""
    rooms = list(db_instance.rooms_cache.values())
    rooms.sort(key=lambda r: (r["floor"], r["room_id"]))
    
    result = []
    for r in rooms:
        r_id = r["room_id"]
        status = state_manager.status_cache.get(r_id)
        override = db_instance.overrides_cache.get(r_id)
        schedules = [s for s in db_instance.schedules_cache if s["room_id"] == r_id]
        
        result.append({
            "room": r,
            "status": status,
            "has_override": override is not None,
            "override": override,
            "total_classes_week": len(schedules),
        })
    return result

@router.post("/upload-schedule")
async def upload_schedule(req: AdminUploadRequest):
    """
    Ingests raw allocation tokens from admin panel.
    Format per line: 'DAY, TOKEN' e.g. 'MON, F1-BSTS101P-SS-PRP124-ALL'.
    Filters non-PRP venues deterministically and updates state.
    """
    ingested_count = 0
    ignored_count = 0
    
    for line in req.records:
        if not line.strip():
            continue
        parts = line.split(",")
        if len(parts) >= 2:
            day = parts[0].strip()
            token = parts[1].strip()
        else:
            day = "MON"
            token = parts[0].strip()
            
        schedules = ingest_allocation_entry(day, token)
        if not schedules:
            ignored_count += 1
            continue
            
        for s in schedules:
            db_instance.schedules_cache.append(s.model_dump())
            if db_instance.db is not None:
                await db_instance.db.room_schedule.insert_one(s.model_dump())
            ingested_count += 1
            
    # Recompute state
    state_manager.recompute_all()
    await state_manager.broadcast_all()
    
    return {
        "success": True,
        "ingested_records": ingested_count,
        "ignored_records": ignored_count,
        "message": f"Processed {len(req.records)} records ({ingested_count} ingested, {ignored_count} non-PRP filtered)."
    }

@router.post("/reset-demo")
async def reset_demo():
    """Resets database and overrides back to clean reproducible hackathon baseline."""
    r_count, s_count = await populate_database()
    state_manager.simulated_datetime = None
    state_manager.simulated_day_override = None
    state_manager.recompute_all()
    await state_manager.broadcast_all()
    return {
        "success": True,
        "message": f"Demo state reset successfully ({r_count} rooms, {s_count} schedules)."
    }
