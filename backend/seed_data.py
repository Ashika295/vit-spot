"""
Seed Data & Initialization for VitSpot.
Populates:
1. Physical G+7 PRP structure (174 student rooms + 248 teacher cabins) directly from
   official VIT Pearl Research Park infrastructure records (https://vit.ac.in/about/infrastructure/prp-block).
2. Schedule records parsed deterministically from all 5 uploaded student timetables.
3. Live overrides store.
"""

import os
import json
import asyncio
from typing import List, Dict, Tuple
from backend.models import Room, RoomSchedule, LiveOverride
from backend.parser import ingest_allocation_entry
from backend.database import db_instance, connect_db

# All 5 uploaded timetable files represented as validated token allocations
TIMETABLE_FILES_DATA: List[Tuple[str, str, str]] = [
    # (Timetable_Source, Day, Token)
    # Timetable 1
    ("TIMETABLE_1", "MON", "F1-BSTS101P-SS-PRP124-ALL"),
    ("TIMETABLE_1", "MON", "L35+L36-BCSE102P-LO-PRP232-ALL"),
    ("TIMETABLE_1", "TUE", "B1-BCSE102L-TH-PRP204-ALL"),
    ("TIMETABLE_1", "TUE", "G1-BENG101L-TH-PRP123-ALL"),
    ("TIMETABLE_1", "TUE", "E1-BPHY101L-TH-PRP105-ALL"),
    ("TIMETABLE_1", "TUE", "TC1-BMAT102L-TH-PRP122-ALL"),
    ("TIMETABLE_1", "WED", "C1-BMAT102L-TH-PRP122-ALL"),
    ("TIMETABLE_1", "WED", "F1-BSTS101P-SS-PRP124-ALL"),
    ("TIMETABLE_1", "THU", "B1-BCSE102L-TH-PRP204-ALL"),
    ("TIMETABLE_1", "THU", "G1-BENG101L-TH-PRP123-ALL"),
    ("TIMETABLE_1", "THU", "TE1-BPHY101L-TH-PRP105-ALL"),
    ("TIMETABLE_1", "THU", "TCC1-BMAT102L-TH-PRP122-ALL"),
    ("TIMETABLE_1", "FRI", "E1-BPHY101L-TH-PRP105-ALL"),
    ("TIMETABLE_1", "FRI", "C1-BMAT102L-TH-PRP122-ALL"),
    ("TIMETABLE_1", "FRI", "TF1-BSTS101P-SS-PRP124-ALL"),
    ("TIMETABLE_1", "FRI", "L59+L60-BCSE102P-LO-PRP232-ALL"),

    # Timetable 2
    ("TIMETABLE_2", "MON", "L5+L6-BCHY101P-LO-PRPG07-ALL03"),
    ("TIMETABLE_2", "MON", "A2-BEEE102L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "MON", "F2-BSTS201P-SS-PRP204-ALL03"),
    ("TIMETABLE_2", "MON", "TG2-BCHY101L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "TUE", "L11+L12-BMAT101P-LO-PRP119-ALL03"),
    ("TIMETABLE_2", "TUE", "G2-BCHY101L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "TUE", "E2-BMAT101L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "TUE", "TAA2-BCSE101E-ETH-PRP107-ALL03"),
    ("TIMETABLE_2", "WED", "A2-BEEE102L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "WED", "F2-BSTS201P-SS-PRP204-ALL03"),
    ("TIMETABLE_2", "THU", "G2-BCHY101L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "THU", "TE2-BMAT101L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "FRI", "E2-BMAT101L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "FRI", "TA2-BEEE102L-TH-PRP107-ALL03"),
    ("TIMETABLE_2", "FRI", "TF2-BSTS201P-SS-PRP204-ALL03"),

    # Timetable 3
    ("TIMETABLE_3", "MON", "A1-BMAT201L-TH-PRP333-ALL"),
    ("TIMETABLE_3", "MON", "F1-BECE102L-TH-PRP378-ALL"),
    ("TIMETABLE_3", "MON", "D1-BSTS202P-SS-PRP465-ALL"),
    ("TIMETABLE_3", "MON", "TG1-BCSE103E-ETH-PRP678-ALL"),
    ("TIMETABLE_3", "TUE", "E1-BCSE202L-TH-PRP378-ALL"),
    ("TIMETABLE_3", "TUE", "TC1-BMAT205L-TH-PRP465-ALL"),
    ("TIMETABLE_3", "TUE", "TAA1-BMAT201L-TH-PRP333-ALL"),
    ("TIMETABLE_3", "TUE", "L41+L42-BCSE103E-ELA-PRP233-ALL"),
    ("TIMETABLE_3", "WED", "C1-BMAT205L-TH-PRP465-ALL"),
    ("TIMETABLE_3", "WED", "A1-BMAT201L-TH-PRP333-ALL"),
    ("TIMETABLE_3", "WED", "F1-BECE102L-TH-PRP378-ALL"),
    ("TIMETABLE_3", "WED", "L43+L44-BECE102P-LO-PRP135-ALL"),
    ("TIMETABLE_3", "THU", "D1-BSTS202P-SS-PRP465-ALL"),
    ("TIMETABLE_3", "THU", "TE1-BCSE202L-TH-PRP378-ALL"),
    ("TIMETABLE_3", "THU", "TCC1-BMAT205L-TH-PRP465-ALL"),
    ("TIMETABLE_3", "THU", "L53+L54-BENG102P-LO-PRP246-ALL"),
    ("TIMETABLE_3", "FRI", "E1-BCSE202L-TH-PRP378-ALL"),
    ("TIMETABLE_3", "FRI", "C1-BMAT205L-TH-PRP465-ALL"),
    ("TIMETABLE_3", "FRI", "TA1-BMAT201L-TH-PRP333-ALL"),
    ("TIMETABLE_3", "FRI", "TF1-BECE102L-TH-PRP378-ALL"),
    ("TIMETABLE_3", "FRI", "TD1-BSTS202P-SS-PRP465-ALL"),
    ("TIMETABLE_3", "FRI", "L57+L58-BCSE103E-ELA-PRP233-ALL"),

    # Timetable 4
    ("TIMETABLE_4", "MON", "L3+L4-BCSE203E-ELA-PRP138-ALL"),
    ("TIMETABLE_4", "MON", "A2-BCSE205L-TH-PRP318-ALL"),
    ("TIMETABLE_4", "MON", "F2-BCSE204L-TH-PRP223-ALL"),
    ("TIMETABLE_4", "MON", "D2-BSTS102P-SS-PRPG31-ALL"),
    ("TIMETABLE_4", "MON", "TB2-BMAT202L-TH-PRP323-ALL"),
    ("TIMETABLE_4", "TUE", "L11+L12-BCSE203E-ELA-PRP138-ALL"),
    ("TIMETABLE_4", "TUE", "B2-BMAT202L-TH-PRP323-ALL"),
    ("TIMETABLE_4", "TUE", "E2-BCSE304L-TH-PRP319-ALL"),
    ("TIMETABLE_4", "TUE", "TC2-BECE204L-TH-PRPG32-ALL"),
    ("TIMETABLE_4", "TUE", "TAA2-BCSE203E-ETH-PRP224-ALL"),
    ("TIMETABLE_4", "WED", "L13+L14-BCSE204P-LO-PRP232-ALL"),
    ("TIMETABLE_4", "WED", "L15+L16-BMAT202P-LO-PRP449-ALL"),
    ("TIMETABLE_4", "WED", "C2-BECE204L-TH-PRPG32-ALL"),
    ("TIMETABLE_4", "WED", "A2-BCSE205L-TH-PRP318-ALL"),
    ("TIMETABLE_4", "WED", "F2-BCSE204L-TH-PRP223-ALL"),
    ("TIMETABLE_4", "WED", "TD2-BSTS102P-SS-PRPG31-ALL"),
    ("TIMETABLE_4", "THU", "D2-BSTS102P-SS-PRPG31-ALL"),
    ("TIMETABLE_4", "THU", "B2-BMAT202L-TH-PRP323-ALL"),
    ("TIMETABLE_4", "THU", "TE2-BCSE304L-TH-PRP319-ALL"),
    ("TIMETABLE_4", "FRI", "E2-BCSE304L-TH-PRP319-ALL"),
    ("TIMETABLE_4", "FRI", "C2-BECE204L-TH-PRPG32-ALL"),
    ("TIMETABLE_4", "FRI", "TA2-BCSE205L-TH-PRP318-ALL"),
    ("TIMETABLE_4", "FRI", "TF2-BCSE204L-TH-PRP223-ALL"),

    # Timetable 5
    ("TIMETABLE_5", "MON", "L3+L4-BCSE202P-LO-PRP233-ALL"),
    ("TIMETABLE_5", "MON", "A2-BMAT201L-TH-PRP678-ALL"),
    ("TIMETABLE_5", "MON", "F2-BECE102L-TH-PRP671-ALL"),
    ("TIMETABLE_5", "MON", "D2-BSTS202P-SS-PRP773-ALL"),
    ("TIMETABLE_5", "MON", "TG2-BCSE103E-ETH-PRP378-ALL"),
    ("TIMETABLE_5", "TUE", "E2-BCSE202L-TH-PRP472-ALL"),
    ("TIMETABLE_5", "TUE", "TC2-BMAT205L-TH-PRP773-ALL"),
    ("TIMETABLE_5", "TUE", "TAA2-BMAT201L-TH-PRP678-ALL"),
    ("TIMETABLE_5", "WED", "L13+L14-BCSE103E-ELA-PRP138-ALL"),
    ("TIMETABLE_5", "WED", "C2-BMAT205L-TH-PRP773-ALL"),
    ("TIMETABLE_5", "WED", "A2-BMAT201L-TH-PRP678-ALL"),
    ("TIMETABLE_5", "WED", "F2-BECE102L-TH-PRP671-ALL"),
    ("TIMETABLE_5", "WED", "TD2-BSTS202P-SS-PRP773-ALL"),
    ("TIMETABLE_5", "THU", "L21+L22-BECE102P-LO-PRP136-ALL"),
    ("TIMETABLE_5", "THU", "D2-BSTS202P-SS-PRP773-ALL"),
    ("TIMETABLE_5", "THU", "TE2-BCSE202L-TH-PRP472-ALL"),
    ("TIMETABLE_5", "THU", "TCC2-BMAT205L-TH-PRP773-ALL"),
    ("TIMETABLE_5", "FRI", "L29+L30-BCSE103E-ELA-PRP138-ALL"),
    ("TIMETABLE_5", "FRI", "E2-BCSE202L-TH-PRP472-ALL"),
    ("TIMETABLE_5", "FRI", "C2-BMAT205L-TH-PRP773-ALL"),
    ("TIMETABLE_5", "FRI", "TA2-BMAT201L-TH-PRP678-ALL"),
    ("TIMETABLE_5", "FRI", "TF2-BECE102L-TH-PRP671-ALL"),
]

INITIAL_OVERRIDES = [
    LiveOverride(
        room_id="PRP204",
        status="AVAILABLE",
        override_time="2026-09-19T10:30:00",
        source="FACULTY",
        reason="Faculty Dr. R. Ramanathan released class early (lab test concluded)",
    ),
    LiveOverride(
        room_id="PRP105",
        status="OCCUPIED",
        override_time="2026-09-19T11:00:00",
        source="QR",
        reason="Student exception scan: Room locked for department AV projector check",
    ),
]

def load_official_rooms() -> Tuple[List[Room], List[Room]]:
    """Loads validated official rooms from official_prp_rooms.json."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "official_prp_rooms.json")
    if not os.path.exists(data_path):
        # Fallback to absolute
        data_path = r"c:\Users\DELL\Desktop\VIT-SPOT\backend\data\official_prp_rooms.json"
        
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    student_rooms = [Room(**r) for r in data["student_rooms"]]
    teacher_cabins = [Room(**r) for r in data["teacher_cabins"]]
    return student_rooms, teacher_cabins

async def populate_database():
    """Populates rooms, timetables and active overrides into cache & MongoDB."""
    student_rooms, teacher_cabins = load_official_rooms()

    # Dictionary of all physical rooms in PRP
    all_rooms_dict: Dict[str, Room] = {}
    for r in student_rooms:
        all_rooms_dict[r.room_id] = r
    for c in teacher_cabins:
        all_rooms_dict[c.room_id] = c

    # Parse and ingest all timetable files
    all_schedules: List[RoomSchedule] = []
    for source_name, day, token in TIMETABLE_FILES_DATA:
        schedules = ingest_allocation_entry(day, token, source=source_name)
        for s in schedules:
            # Ensure the room exists in our physical room catalog
            if s.room_id in all_rooms_dict:
                all_schedules.append(s)
            else:
                # Room from timetable might be formatted differently or needs entry
                r_floor = int(s.room_id[3]) if len(s.room_id) > 3 and s.room_id[3].isdigit() else (0 if 'G' in s.room_id else 0)
                new_room = Room(
                    room_id=s.room_id,
                    room_number=s.room_id.replace("PRP", ""),
                    building="PRP",
                    block="PRP Block-1",
                    floor=r_floor,
                    room_type="THEORY" if "TH" in token or "SS" in token else "LAB",
                    student_accessible=True,
                    source="TIMETABLE_EXTRACTED"
                )
                all_rooms_dict[s.room_id] = new_room
                all_schedules.append(s)

    # In-memory storage caches
    db_instance.rooms_cache = {r.room_id: r.model_dump() for r in all_rooms_dict.values()}
    db_instance.schedules_cache = [s.model_dump() for s in all_schedules]
    db_instance.overrides_cache = {ov.room_id: ov.model_dump() for ov in INITIAL_OVERRIDES}

    # MongoDB persistence if available
    if db_instance.db is not None:
        await db_instance.db.rooms.delete_many({})
        await db_instance.db.room_schedule.delete_many({})
        await db_instance.db.live_overrides.delete_many({})

        await db_instance.db.rooms.insert_many([r.model_dump() for r in all_rooms_dict.values()])
        await db_instance.db.room_schedule.insert_many([s.model_dump() for s in all_schedules])
        await db_instance.db.live_overrides.insert_many([ov.model_dump() for ov in INITIAL_OVERRIDES])
        print(f"[Seed] Successfully seeded {len(all_rooms_dict)} rooms and {len(all_schedules)} schedules into MongoDB.")
    else:
        print(f"[Seed] Loaded {len(all_rooms_dict)} physical spaces ({len(student_rooms)} student-accessible) and {len(all_schedules)} schedule records.")

    return len(student_rooms), len(teacher_cabins), len(all_schedules)

if __name__ == "__main__":
    async def main():
        await connect_db()
        s_cnt, c_cnt, sched_cnt = await populate_database()
        print(f"Student Rooms: {s_cnt}, Teacher Cabins: {c_cnt}, Schedule Records: {sched_cnt}")
    asyncio.run(main())
