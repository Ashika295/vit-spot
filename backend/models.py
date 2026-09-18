from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class Room(BaseModel):
    room_id: str = Field(..., description="Standardized room ID, e.g. PRP104, PRPG08, PRP773")
    room_number: str = Field(..., description="Physical room number as per VIT signage, e.g. 104, G08, 773")
    building: str = Field(default="PRP", description="Building code: Pearl Research Park")
    block: str = Field(default="PRP Block-1", description="Block division from VIT building map")
    floor: int = Field(..., description="Floor index: 0 for Ground, 1 to 7")
    room_type: str = Field(default="THEORY", description="THEORY, LAB, SMART_CLASSROOM, EXAM_HALL, CAFETERIA, FACULTY_CABIN, AUDITORIUM")
    raw_type: Optional[str] = Field(default=None, description="Original room type from official VIT registry")
    school: Optional[str] = Field(default="PRP", description="Affiliated VIT School: SCOPE, SENSE, VAIAL, SELECT, SBST, SAS, SSL, PAT-CDC")
    student_accessible: bool = Field(default=True, description="True for student rooms/labs; False for faculty cabins and admin offices")
    capacity: Optional[int] = Field(default=None, description="Estimated seat capacity based on verified room area")
    source: str = Field(default="OFFICIAL_VIT_WEBSITE", description="Data provenance: OFFICIAL_VIT_WEBSITE, TIMETABLE")

class RoomSchedule(BaseModel):
    day: str = Field(..., description="MON, TUE, WED, THU, FRI, SAT, SUN")
    room_id: str
    course_code: str
    course_name: str
    class_id: str
    slot_id: str
    start_time: str = Field(..., description="HH:MM format in 24-hr")
    end_time: str = Field(..., description="HH:MM format in 24-hr")
    source: str = Field(default="SCHEDULED_TIMETABLE", description="Source timetable tag")

class LiveOverride(BaseModel):
    room_id: str
    status: str = Field(..., description="AVAILABLE or OCCUPIED")
    override_time: str = Field(..., description="ISO timestamp")
    source: str = Field(..., description="FACULTY, QR, or ADMIN")
    reason: str
    expires_at: Optional[str] = None

class RoomStatus(BaseModel):
    room_id: str
    room_number: str
    building: str = "PRP"
    block: str = "PRP Block-1"
    floor: int
    room_type: str
    raw_type: Optional[str] = None
    school: Optional[str] = None
    student_accessible: bool = True
    capacity: Optional[int] = None
    status: str = Field(..., description="AVAILABLE, OCCUPIED, ENDING_SOON, UNKNOWN")
    next_change: Optional[str] = None
    free_until: Optional[str] = None
    free_duration: Optional[int] = None # in minutes
    available_from: Optional[str] = None
    occupied_duration_left: Optional[int] = None # in minutes
    source: str = Field(default="OFFICIAL_REGISTRY", description="Data resolution source")
    display_note: Optional[str] = None
    current_class: Optional[Dict[str, Any]] = None
    next_class: Optional[Dict[str, Any]] = None
    updated_at: str

class FacultyReleaseRequest(BaseModel):
    room_id: str
    faculty_id: str
    reason: Optional[str] = "Class ended early"

class QRReportRequest(BaseModel):
    room_id: str
    report_type: str = Field(..., description="ROOM_UNAVAILABLE or ROOM_RELEASED")
    reason: str = Field(..., description="e.g. Room locked, Class ended early, Projector maintenance")

class AdminUploadRequest(BaseModel):
    records: List[str] # raw timetable lines or allocations

class SimTimeRequest(BaseModel):
    simulated_time: Optional[str] = None # ISO format "YYYY-MM-DDTHH:MM:SS" or None to reset
    day_override: Optional[str] = None # e.g. "MON", "TUE", etc.
