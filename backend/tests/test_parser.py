"""
Unit tests for Standalone Class ID Parser and Timetable Ingestion.
"""

import pytest
from backend.parser import (
    parse_class_id,
    is_prp_venue,
    normalize_room_id,
    extract_floor,
    parse_raw_token,
    ingest_allocation_entry,
)

def test_composite_class_id_splitting():
    """Verify that composite IDs split into individual sub-slots."""
    assert parse_class_id("L41+L42+L57+L58") == ["L41", "L42", "L57", "L58"]
    assert parse_class_id("E1+TE1") == ["E1", "TE1"]
    assert parse_class_id("L35+L36") == ["L35", "L36"]
    assert parse_class_id("A1") == ["A1"]
    assert parse_class_id("  L13 + L14  ") == ["L13", "L14"]
    assert parse_class_id("") == []

def test_prp_venue_filtering():
    """Verify that non-PRP venues are rejected and PRP venues are accepted."""
    assert is_prp_venue("PRP124") is True
    assert is_prp_venue("PRPG07") is True
    assert is_prp_venue("PRP-378") is True
    assert is_prp_venue("prp 204") is True
    
    # Non-PRP venues from the sample timetables must be rejected
    assert is_prp_venue("SJT513") is False
    assert is_prp_venue("SJTG19") is False
    assert is_prp_venue("TT420") is False
    assert is_prp_venue("SMVG21") is False
    assert is_prp_venue("TT318") is False
    assert is_prp_venue("TT433") is False
    assert is_prp_venue("SJT319") is False

def test_normalize_room_id():
    assert normalize_room_id("prp-124") == "PRP124"
    assert normalize_room_id("PRP G07") == "PRPG07"
    assert normalize_room_id(" PRP204 ") == "PRP204"

def test_extract_floor():
    assert extract_floor("PRPG07") == 0
    assert extract_floor("PRP105") == 1
    assert extract_floor("PRP204") == 2
    assert extract_floor("PRP378") == 3
    assert extract_floor("PRP465") == 4
    assert extract_floor("PRP545") == 5
    assert extract_floor("PRP678") == 6
    assert extract_floor("PRP773") == 7
    
    with pytest.raises(ValueError):
        extract_floor("SJT513")

def test_ingest_single_slot_entry():
    """Test ingestion of a single standard slot."""
    token = "F1-BSTS101P-SS-PRP124-ALL"
    schedules = ingest_allocation_entry("MON", token)
    
    assert len(schedules) == 1
    sched = schedules[0]
    assert sched.day == "MON"
    assert sched.room_id == "PRP124"
    assert sched.slot_id == "F1"
    assert sched.course_code == "BSTS101P"
    assert sched.start_time == "09:00"
    assert sched.end_time == "09:50"

def test_ingest_composite_slot_entry():
    """
    Test that a composite slot produces multiple discrete records,
    each with its own exact slot timing from SlotMaster.
    """
    token = "L35+L36-BCSE102P-LO-PRP232-ALL"
    schedules = ingest_allocation_entry("MON", token)
    
    assert len(schedules) == 2
    s1, s2 = schedules[0], schedules[1]
    
    assert s1.slot_id == "L35"
    assert s1.start_time == "17:40"
    assert s1.end_time == "18:30"
    assert s1.room_id == "PRP232"
    
    assert s2.slot_id == "L36"
    assert s2.start_time == "18:31"
    assert s2.end_time == "19:20"
    assert s2.room_id == "PRP232"

def test_non_prp_entry_filtered_out():
    """Test that entries for venues outside PRP return empty list."""
    token = "TC2-BHUM106L-TH-SMVG21-ALL"
    schedules = ingest_allocation_entry("MON", token)
    assert schedules == []
    
    sjt_token = "G2-BESP101L-TH-SJT513-ALL"
    assert ingest_allocation_entry("TUE", sjt_token) == []
