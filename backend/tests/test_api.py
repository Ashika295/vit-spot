"""
End-to-End Integration Tests for VitSpot REST Endpoints.
"""

from fastapi.testclient import TestClient
import pytest
from backend.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "VitSpot"
    assert "PRP" in data["building"]

def test_campus_summary_unselected(client):
    """When user hasn't selected a date/time, summary total should reflect 176 student rooms."""
    res = client.get("/campus/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_rooms"] >= 174
    assert data["total_faculty_cabins"] >= 240
    assert "floor_stats" in data
    assert len(data["floor_stats"]) == 8

def test_campus_summary_with_query(client):
    """When user queries Tuesday 11:00, calculates availability deterministically."""
    res = client.get("/campus/summary?day=TUE&time=11:00")
    assert res.status_code == 200
    data = res.json()
    assert data["total_rooms"] >= 174
    assert data["is_query_active"] is True
    assert data["day"] == "TUE"
    assert data["time"] == "11:00"

def test_rooms_list_default_student_accessible(client):
    """Rooms list must only return student-accessible rooms by default."""
    res = client.get("/rooms")
    assert res.status_code == 200
    rooms = res.json()
    assert len(rooms) >= 174
    for r in rooms:
        assert r["building"] == "PRP"
        assert r["student_accessible"] is True
        assert r["room_type"] != "FACULTY_CABIN"

def test_floor_filter(client):
    res = client.get("/rooms?floor=1")
    assert res.status_code == 200
    rooms = res.json()
    assert len(rooms) >= 28 # student rooms on Floor 1
    for r in rooms:
        assert r["floor"] == 1

def test_query_occupied_room_tuesday(client):
    """
    PRP107 has BCHY101L in G2 slot (15:00-15:50) on TUE in Timetable 2.
    Querying TUE 15:00 should return PRP107 as OCCUPIED.
    """
    res = client.get("/rooms?day=TUE&time=15:00&search=PRP107")
    assert res.status_code == 200
    rooms = res.json()
    assert len(rooms) == 1
    r = rooms[0]
    assert r["room_id"] == "PRP107"
    assert r["status"] == "OCCUPIED"
    assert r["current_class"]["course_code"] == "BCHY101L"

def test_query_free_room(client):
    """
    PRP107 on WED at 11:00 has no class (A2 is at 08:00).
    Querying WED 11:00 should return PRP107 as AVAILABLE.
    """
    res = client.get("/rooms?day=WED&time=11:00&search=PRP107")
    assert res.status_code == 200
    rooms = res.json()
    assert len(rooms) == 1
    r = rooms[0]
    assert r["status"] == "AVAILABLE"

def test_query_room_without_timetable(client):
    """
    A classroom with no uploaded schedule for Friday returns UNKNOWN.
    """
    res = client.get("/rooms?day=FRI&time=11:00&search=PRP104")
    assert res.status_code == 200
    rooms = res.json()
    assert len(rooms) == 1
    assert rooms[0]["status"] == "UNKNOWN"

def test_faculty_release_endpoint(client):
    payload = {
        "room_id": "PRP378",
        "faculty_id": "FAC9012",
        "reason": "Lecture ended early for hackathon"
    }
    res = client.post("/faculty/release", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["room_status"]["source"] == "FACULTY_OVERRIDE"

def test_qr_report_endpoint(client):
    payload = {
        "room_id": "PRP232",
        "report_type": "ROOM_UNAVAILABLE",
        "reason": "Room locked by department"
    }
    res = client.post("/qr/report", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["room_status"]["source"] == "QR_VERIFIED"
    assert data["room_status"]["status"] == "OCCUPIED"

def test_query_api_endpoint(client):
    """Test POST /sim/query to set global date/time search window."""
    res = client.post("/sim/query", json={"day": "WED", "start_time": "14:00", "duration": 60})
    assert res.status_code == 200
    data = res.json()
    assert data["is_query_active"] is True
    assert data["day"] == "WED"
    assert data["time"] == "14:00"
