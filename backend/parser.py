"""
Standalone Class ID & Timetable Token Parser for VitSpot.
Splits composite IDs into individual slot-mapped records, validates PRP venues,
and maps slot timings strictly via SlotMaster lookup.
"""

import re
from typing import List, Optional, Dict, Any
from backend.models import RoomSchedule
from backend.slot_master_data import get_slot_timing, SLOT_TIMINGS

COURSE_CATALOG: Dict[str, str] = {
    "BSTS101P": "Quantitative Skills Practice I",
    "BSTS201P": "Qualitative Skills Practice II",
    "BSTS202P": "Advanced Competitive Coding",
    "BSTS102P": "Quantitative Aptitude",
    "BCSE102L": "Structured and Object-Oriented Programming",
    "BCSE102P": "Structured and Object-Oriented Programming Lab",
    "BCSE103E": "Computer Programming: Python",
    "BCSE202L": "Data Structures and Algorithms",
    "BCSE202P": "Data Structures and Algorithms Lab",
    "BCSE203E": "Web Programming",
    "BCSE204L": "Design and Analysis of Algorithms",
    "BCSE204P": "Design and Analysis of Algorithms Lab",
    "BCSE205L": "Computer Architecture and Organization",
    "BCSE304L": "Theory of Computation",
    "BCSE101E": "Problem Solving with Python",
    "BENG101L": "Technical English Communication",
    "BENG101P": "Technical English Communication Lab",
    "BENG102P": "Technical Communication Lab",
    "BPHY101L": "Engineering Physics",
    "BPHY101P": "Engineering Physics Lab",
    "BMAT101L": "Calculus",
    "BMAT101P": "Calculus Lab",
    "BMAT102L": "Differential Equations and Transforms",
    "BMAT201L": "Complex Variables and Linear Algebra",
    "BMAT202L": "Probability and Statistics",
    "BMAT202P": "Probability and Statistics Lab",
    "BMAT205L": "Discrete Mathematics and Graph Theory",
    "BCHY101L": "Engineering Chemistry",
    "BCHY101P": "Engineering Chemistry Lab",
    "BEEE102L": "Basic Electrical and Electronics Engineering",
    "BEEE102P": "Basic Electrical and Electronics Engineering Lab",
    "BECE102L": "Digital Logic and Microprocessors",
    "BECE102P": "Digital Logic and Microprocessors Lab",
    "BECE204L": "Microprocessors and Microcontrollers",
    "BECE204P": "Microprocessors and Microcontrollers Lab",
    "BHUM106L": "Ethics and Values",
    "BESP101L": "Spanish",
}

def parse_class_id(class_id_str: str) -> List[str]:
    """
    Splits composite class/slot IDs such as 'L41+L42+L57+L58', 'E1+TE1', 'L35+L36'.
    Returns list of discrete sub-slot strings.
    """
    if not class_id_str:
        return []
    # Replace common separators like +, /, comma
    clean_str = class_id_str.strip()
    sub_ids = [sub.strip() for sub in re.split(r"[\+\/,]", clean_str) if sub.strip()]
    return sub_ids

def is_prp_venue(venue: str) -> bool:
    """
    Verifies if a venue is located in the Pearl Research Park (PRP) building.
    Returns True for PRP124, PRPG07, PRP-378, PRP 232.
    Returns False for SJT513, TT420, SMVG21, etc.
    """
    if not venue:
        return False
    normalized = venue.strip().upper().replace(" ", "").replace("-", "")
    return normalized.startswith("PRP")

def normalize_room_id(venue: str) -> str:
    """
    Normalizes venue string to standard format: PRPxxx or PRPGxx.
    Example: 'prp-124' -> 'PRP124', 'prp g07' -> 'PRPG07'.
    """
    if not venue:
        return ""
    cleaned = venue.strip().upper().replace(" ", "").replace("-", "")
    return cleaned

def extract_floor(room_id: str) -> int:
    """
    Extracts floor integer (0 to 7) from PRP room ID.
    PRPG07 -> 0
    PRP124 -> 1
    PRP204 -> 2
    PRP378 -> 3
    PRP465 -> 4
    PRP545 -> 5
    PRP678 -> 6
    PRP773 -> 7
    """
    norm = normalize_room_id(room_id)
    if not norm.startswith("PRP"):
        raise ValueError(f"Not a PRP room: {room_id}")
    
    after_prp = norm[3:]
    if after_prp.startswith("G"):
        return 0
    
    first_char = after_prp[0]
    if first_char.isdigit():
        return int(first_char)
    raise ValueError(f"Cannot extract floor from {room_id}")

def parse_raw_token(token: str, default_day: str = "MON") -> Dict[str, Any]:
    """
    Parses a timetable token like:
    'F1-BSTS101P-SS-PRP124-ALL'
    'L35+L36-BCSE102P-LO-PRP232-ALL'
    'B1-BCSE102L-TH-PRP204-ALL'
    Returns dict with keys: slot, course_code, session_type, venue, batch.
    """
    parts = token.strip().split("-")
    if len(parts) < 4:
        raise ValueError(f"Invalid token format (expected at least 4 segments): {token}")
    
    slot_raw = parts[0].strip()
    course_code = parts[1].strip().upper()
    session_type = parts[2].strip().upper()
    venue = parts[3].strip().upper()
    batch = parts[4].strip().upper() if len(parts) > 4 else "ALL"
    
    return {
        "slot_raw": slot_raw,
        "course_code": course_code,
        "session_type": session_type,
        "venue": venue,
        "batch": batch,
    }

def ingest_allocation_entry(
    day: str,
    raw_token: str,
    source: str = "SCHEDULED",
    course_name_override: Optional[str] = None
) -> List[RoomSchedule]:
    """
    Full pipeline ingestion for a single allocation token.
    1. Parse token.
    2. Check is_prp_venue. If False, return [] (filtered out).
    3. Normalize room_id.
    4. Split composite slots via parse_class_id.
    5. For each sub-slot, resolve exact start and end times via SlotMaster.
    6. Return list of RoomSchedule objects.
    """
    day_upper = day.strip().upper()
    parsed = parse_raw_token(raw_token, default_day=day_upper)
    
    venue = parsed["venue"]
    if not is_prp_venue(venue):
        # Exclude non-PRP venues deterministically
        return []
    
    room_id = normalize_room_id(venue)
    course_code = parsed["course_code"]
    course_name = course_name_override or COURSE_CATALOG.get(course_code, f"{course_code} Course")
    
    sub_slots = parse_class_id(parsed["slot_raw"])
    schedules: List[RoomSchedule] = []
    
    for slot_id in sub_slots:
        try:
            start_time, end_time, _ = get_slot_timing(day_upper, slot_id)
            schedule_item = RoomSchedule(
                day=day_upper,
                room_id=room_id,
                course_code=course_code,
                course_name=course_name,
                class_id=f"{slot_id}-{course_code}",
                slot_id=slot_id,
                start_time=start_time,
                end_time=end_time,
                source=source,
            )
            schedules.append(schedule_item)
        except KeyError:
            # Slot not found for this day, skip or handle gracefully
            continue
            
    return schedules
