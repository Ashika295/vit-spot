"""
Unit tests for Pure Deterministic Availability Engine and Override Precedence.
"""

from datetime import time
import pytest
from backend.models import Room, RoomSchedule, LiveOverride
from backend.availability_engine import resolve_room_availability

@pytest.fixture
def sample_room():
    return Room(
        room_id="PRP378",
        room_number="378",
        building="PRP",
        block="PRP Block-1",
        floor=3,
        room_type="THEORY",
        capacity=60
    )

@pytest.fixture
def sample_schedule():
    """
    Monday Schedule for PRP378:
    - 08:00 - 08:50: A1 - BMAT201L
    - 09:00 - 09:50: F1 - BECE102L
    - 14:00 - 14:50: A2 - BCSE205L
    """
    return [
        RoomSchedule(
            day="MON",
            room_id="PRP378",
            course_code="BMAT201L",
            course_name="Complex Variables and Linear Algebra",
            class_id="A1-BMAT201L",
            slot_id="A1",
            start_time="08:00",
            end_time="08:50",
            source="SCHEDULED"
        ),
        RoomSchedule(
            day="MON",
            room_id="PRP378",
            course_code="BECE102L",
            course_name="Digital Logic and Microprocessors",
            class_id="F1-BECE102L",
            slot_id="F1",
            start_time="09:00",
            end_time="09:50",
            source="SCHEDULED"
        ),
        RoomSchedule(
            day="MON",
            room_id="PRP378",
            course_code="BCSE205L",
            course_name="Computer Architecture and Organization",
            class_id="A2-BCSE205L",
            slot_id="A2",
            start_time="14:00",
            end_time="14:50",
            source="SCHEDULED"
        ),
    ]

def test_occupied_during_class(sample_room, sample_schedule):
    """At 08:25 AM, class is in session: STATUS = OCCUPIED."""
    curr_time = time(8, 25)
    res = resolve_room_availability(sample_room, "MON", curr_time, None, sample_schedule)
    
    assert res.status == "OCCUPIED"
    assert res.available_from == "08:50"
    assert res.occupied_duration_left == 25
    assert res.source == "VERIFIED_TIMETABLE"
    assert res.current_class is not None
    assert res.current_class["course_code"] == "BMAT201L"
    assert res.next_class["course_code"] == "BECE102L"

def test_ending_soon_break_gap(sample_room, sample_schedule):
    """At 08:52 AM, between 08:50 and 09:00 -> 8 mins free -> ENDING_SOON."""
    curr_time = time(8, 52)
    res = resolve_room_availability(sample_room, "MON", curr_time, None, sample_schedule)
    
    assert res.status == "ENDING_SOON"
    assert res.free_until == "09:00"
    assert res.free_duration == 8
    assert res.source == "VERIFIED_TIMETABLE"
    assert res.next_class["slot_id"] == "F1"

def test_available_lunch_break(sample_room, sample_schedule):
    """At 12:30 PM (lunch break), next class is 14:00 -> free for 90 mins -> AVAILABLE."""
    curr_time = time(12, 30)
    res = resolve_room_availability(sample_room, "MON", curr_time, None, sample_schedule)
    
    assert res.status == "AVAILABLE"
    assert res.free_until == "14:00"
    assert res.free_duration == 90
    assert res.next_class["slot_id"] == "A2"

def test_available_remainder_of_day(sample_room, sample_schedule):
    """At 16:00 PM (after last class today 14:50) -> Available for remainder of working day."""
    curr_time = time(16, 0)
    res = resolve_room_availability(sample_room, "MON", curr_time, None, sample_schedule)
    
    assert res.status == "AVAILABLE"
    assert res.free_until is None
    assert res.free_duration is None
    assert "remainder of day" in res.display_note.lower()

def test_faculty_early_release_precedence(sample_room, sample_schedule):
    """
    At 08:30 AM (during active class A1), faculty submits early-release.
    Room MUST flip to AVAILABLE, source MUST be FACULTY_OVERRIDE.
    """
    curr_time = time(8, 30)
    override = LiveOverride(
        room_id="PRP378",
        status="AVAILABLE",
        override_time="2026-09-19T08:30:00",
        source="FACULTY",
        reason="Mid-term exam concluded early"
    )
    res = resolve_room_availability(sample_room, "MON", curr_time, None, sample_schedule, live_override=override)
    
    assert res.status in ["AVAILABLE", "ENDING_SOON"]
    assert res.source == "FACULTY_OVERRIDE"
    assert "Faculty Early Release" in res.display_note

def test_qr_exception_precedence(sample_room, sample_schedule):
    """
    At 12:30 PM (room scheduled free), a student scans QR and reports room locked/occupied.
    Status MUST flip to OCCUPIED with source QR_VERIFIED.
    """
    curr_time = time(12, 30)
    override = LiveOverride(
        room_id="PRP378",
        status="OCCUPIED",
        override_time="2026-09-19T12:30:00",
        source="QR",
        reason="Room locked by department for lab audit"
    )
    res = resolve_room_availability(sample_room, "MON", curr_time, None, sample_schedule, live_override=override)
    
    assert res.status == "OCCUPIED"
    assert res.source == "QR_VERIFIED"
    assert "QR Exception" in res.display_note
