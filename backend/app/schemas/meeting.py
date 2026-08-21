from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ParticipantBase(BaseModel):
    name: str
    email: str
    role: Optional[str] = "attendee"
    attended: Optional[bool] = True

class ParticipantCreate(ParticipantBase):
    user_id: Optional[int] = None

class ParticipantResponse(ParticipantBase):
    id: int
    meeting_id: int
    joined_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    agenda: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: Optional[datetime] = None
    status: Optional[str] = "scheduled" # 'scheduled', 'in_progress', 'completed', 'cancelled'
    location: Optional[str] = "Online (AI Workspace)"
    meeting_url: Optional[str] = None # Google Meet, Zoom, MS Teams link
    speaker_mapping: Optional[Dict[str, str]] = None

class MeetingCreate(MeetingBase):
    participants: Optional[List[ParticipantBase]] = []

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    agenda: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: Optional[str] = None
    location: Optional[str] = None
    meeting_url: Optional[str] = None

class MeetingResponse(MeetingBase):
    id: int
    host_id: int
    created_at: datetime
    participants: List[ParticipantResponse] = []
    has_recording: Optional[bool] = False
    has_transcript: Optional[bool] = False
    has_summary: Optional[bool] = False
    tasks_count: Optional[int] = 0
    decisions_count: Optional[int] = 0
    is_missed: Optional[bool] = False

    class Config:
        from_attributes = True

class MeetingRescheduleRequest(BaseModel):
    new_scheduled_start: datetime
    new_scheduled_end: Optional[datetime] = None
    reason: Optional[str] = "Missed previous scheduled meeting session"
    meeting_url: Optional[str] = None
    location: Optional[str] = None
    additional_notes: Optional[str] = None
    participant_emails: Optional[List[str]] = None
    send_notifications: Optional[bool] = True
    send_emails: Optional[bool] = True
    create_as_new_meeting: Optional[bool] = False

class AttendeeRescheduleRequest(BaseModel):
    proposed_start: Optional[datetime] = None
    reason: Optional[str] = "Missed previous session, requesting to schedule again"
    notes: Optional[str] = None

class ParticipantAttendanceUpdate(BaseModel):
    attended: bool

class SpeakerMappingUpdate(BaseModel):
    speaker_mapping: Dict[str, str]
