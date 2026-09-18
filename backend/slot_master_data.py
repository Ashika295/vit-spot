"""
VIT Slot Master Data.
Defines the exact timings for Theory and Lab slots at VIT Vellore.
Values match official FFCS timetable grids.
"""

from typing import Dict, Tuple, List

# (start_time, end_time, session_type)
SLOT_TIMINGS: Dict[str, Dict[str, Tuple[str, str, str]]] = {
    "MON": {
        # Theory Morning
        "A1": ("08:00", "08:50", "THEORY"),
        "F1": ("09:00", "09:50", "THEORY"),
        "D1": ("10:00", "10:50", "THEORY"),
        "TB1": ("11:00", "11:50", "THEORY"),
        "TG1": ("12:00", "12:50", "THEORY"),
        # Theory Afternoon
        "A2": ("14:00", "14:50", "THEORY"),
        "F2": ("15:00", "15:50", "THEORY"),
        "D2": ("16:00", "16:50", "THEORY"),
        "TB2": ("17:00", "17:50", "THEORY"),
        "TG2": ("18:00", "18:50", "THEORY"),
        "V3": ("19:01", "19:50", "THEORY"),
        # Lab Morning
        "L1": ("08:00", "08:50", "LAB"),
        "L2": ("08:51", "09:40", "LAB"),
        "L3": ("09:51", "10:40", "LAB"),
        "L4": ("10:41", "11:30", "LAB"),
        "L5": ("11:40", "12:30", "LAB"),
        "L6": ("12:31", "13:20", "LAB"),
        # Lab Afternoon
        "L31": ("14:00", "14:50", "LAB"),
        "L32": ("14:51", "15:40", "LAB"),
        "L33": ("15:51", "16:40", "LAB"),
        "L34": ("16:41", "17:30", "LAB"),
        "L35": ("17:40", "18:30", "LAB"),
        "L36": ("18:31", "19:20", "LAB"),
    },
    "TUE": {
        # Theory Morning
        "B1": ("08:00", "08:50", "THEORY"),
        "G1": ("09:00", "09:50", "THEORY"),
        "E1": ("10:00", "10:50", "THEORY"),
        "TC1": ("11:00", "11:50", "THEORY"),
        "TAA1": ("12:00", "12:50", "THEORY"),
        # Theory Afternoon
        "B2": ("14:00", "14:50", "THEORY"),
        "G2": ("15:00", "15:50", "THEORY"),
        "E2": ("16:00", "16:50", "THEORY"),
        "TC2": ("17:00", "17:50", "THEORY"),
        "TAA2": ("18:00", "18:50", "THEORY"),
        "V4": ("19:01", "19:50", "THEORY"),
        # Lab Morning
        "L7": ("08:00", "08:50", "LAB"),
        "L8": ("08:51", "09:40", "LAB"),
        "L9": ("09:51", "10:40", "LAB"),
        "L10": ("10:41", "11:30", "LAB"),
        "L11": ("11:40", "12:30", "LAB"),
        "L12": ("12:31", "13:20", "LAB"),
        # Lab Afternoon
        "L37": ("14:00", "14:50", "LAB"),
        "L38": ("14:51", "15:40", "LAB"),
        "L39": ("15:51", "16:40", "LAB"),
        "L40": ("16:41", "17:30", "LAB"),
        "L41": ("17:40", "18:30", "LAB"),
        "L42": ("18:31", "19:20", "LAB"),
    },
    "WED": {
        # Theory Morning
        "C1": ("08:00", "08:50", "THEORY"),
        "A1": ("09:00", "09:50", "THEORY"),
        "F1": ("10:00", "10:50", "THEORY"),
        "V1": ("11:00", "11:50", "THEORY"),
        "V2": ("12:00", "12:50", "THEORY"),
        # Theory Afternoon
        "C2": ("14:00", "14:50", "THEORY"),
        "A2": ("15:00", "15:50", "THEORY"),
        "F2": ("16:00", "16:50", "THEORY"),
        "TD2": ("17:00", "17:50", "THEORY"),
        "TBB2": ("18:00", "18:50", "THEORY"),
        "V5": ("19:01", "19:50", "THEORY"),
        # Lab Morning
        "L13": ("08:00", "08:50", "LAB"),
        "L14": ("08:51", "09:40", "LAB"),
        "L15": ("09:51", "10:40", "LAB"),
        "L16": ("10:41", "11:30", "LAB"),
        "L17": ("11:40", "12:30", "LAB"),
        "L18": ("12:31", "13:20", "LAB"),
        # Lab Afternoon
        "L43": ("14:00", "14:50", "LAB"),
        "L44": ("14:51", "15:40", "LAB"),
        "L45": ("15:51", "16:40", "LAB"),
        "L46": ("16:41", "17:30", "LAB"),
        "L47": ("17:40", "18:30", "LAB"),
        "L48": ("18:31", "19:20", "LAB"),
    },
    "THU": {
        # Theory Morning
        "D1": ("08:00", "08:50", "THEORY"),
        "B1": ("09:00", "09:50", "THEORY"),
        "G1": ("10:00", "10:50", "THEORY"),
        "TE1": ("11:00", "11:50", "THEORY"),
        "TCC1": ("12:00", "12:50", "THEORY"),
        # Theory Afternoon
        "D2": ("14:00", "14:50", "THEORY"),
        "B2": ("15:00", "15:50", "THEORY"),
        "G2": ("16:00", "16:50", "THEORY"),
        "TE2": ("17:00", "17:50", "THEORY"),
        "TCC2": ("18:00", "18:50", "THEORY"),
        "V6": ("19:01", "19:50", "THEORY"),
        # Lab Morning
        "L19": ("08:00", "08:50", "LAB"),
        "L20": ("08:51", "09:40", "LAB"),
        "L21": ("09:51", "10:40", "LAB"),
        "L22": ("10:41", "11:30", "LAB"),
        "L23": ("11:40", "12:30", "LAB"),
        "L24": ("12:31", "13:20", "LAB"),
        # Lab Afternoon
        "L49": ("14:00", "14:50", "LAB"),
        "L50": ("14:51", "15:40", "LAB"),
        "L51": ("15:51", "16:40", "LAB"),
        "L52": ("16:41", "17:30", "LAB"),
        "L53": ("17:40", "18:30", "LAB"),
        "L54": ("18:31", "19:20", "LAB"),
    },
    "FRI": {
        # Theory Morning
        "E1": ("08:00", "08:50", "THEORY"),
        "C1": ("09:00", "09:50", "THEORY"),
        "TA1": ("10:00", "10:50", "THEORY"),
        "TF1": ("11:00", "11:50", "THEORY"),
        "TD1": ("12:00", "12:50", "THEORY"),
        # Theory Afternoon
        "E2": ("14:00", "14:50", "THEORY"),
        "C2": ("15:00", "15:50", "THEORY"),
        "TA2": ("16:00", "16:50", "THEORY"),
        "TF2": ("17:00", "17:50", "THEORY"),
        "TDD2": ("18:00", "18:50", "THEORY"),
        "V7": ("19:01", "19:50", "THEORY"),
        # Lab Morning
        "L25": ("08:00", "08:50", "LAB"),
        "L26": ("08:51", "09:40", "LAB"),
        "L27": ("09:51", "10:40", "LAB"),
        "L28": ("10:41", "11:30", "LAB"),
        "L29": ("11:40", "12:30", "LAB"),
        "L30": ("12:31", "13:20", "LAB"),
        # Lab Afternoon
        "L55": ("14:00", "14:50", "LAB"),
        "L56": ("14:51", "15:40", "LAB"),
        "L57": ("15:51", "16:40", "LAB"),
        "L58": ("16:41", "17:30", "LAB"),
        "L59": ("17:40", "18:30", "LAB"),
        "L60": ("18:31", "19:20", "LAB"),
    }
}

def get_slot_timing(day: str, slot_id: str) -> Tuple[str, str, str]:
    """
    Look up exact start and end times for a slot.
    Returns (start_time, end_time, session_type) or raises KeyError.
    """
    day_upper = day.upper()
    slot_upper = slot_id.upper()
    if day_upper in SLOT_TIMINGS and slot_upper in SLOT_TIMINGS[day_upper]:
        return SLOT_TIMINGS[day_upper][slot_upper]
    # Fallback search across all days if day not provided or slot occurs on standard day
    for d, slots in SLOT_TIMINGS.items():
        if slot_upper in slots:
            return slots[slot_upper]
    raise KeyError(f"Slot {slot_id} on {day} not found in slot master")
