from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class TranscriptSegmentSchema(BaseModel):
    id: Optional[int] = None
    speaker_label: str
    speaker_id: Optional[int] = None
    start_time: float
    end_time: float
    text: str
    sentiment: Optional[str] = "neutral"

    class Config:
        from_attributes = True

class TranscriptResponse(BaseModel):
    id: int
    meeting_id: int
    full_text: str
    language: str
    word_count: int
    confidence_score: float
    created_at: datetime
    segments: List[TranscriptSegmentSchema] = []

    class Config:
        from_attributes = True

class TopicSchema(BaseModel):
    name: str
    relevance: float
    discussion_time_mins: Optional[float] = None

class SummaryResponse(BaseModel):
    id: int
    meeting_id: int
    executive_summary: str
    key_points: List[str]
    topics: List[Dict[str, Any]]
    sentiment_overview: str
    action_items_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class DecisionBase(BaseModel):
    decision_text: str
    context: Optional[str] = None
    responsible_person: Optional[str] = None
    impact_level: Optional[str] = "medium"
    status: Optional[str] = "approved"

class DecisionCreate(DecisionBase):
    meeting_id: int

class DecisionResponse(DecisionBase):
    id: int
    meeting_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_name: str
    assignee_email: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    complexity_score: Optional[int] = 3

class TaskCreate(TaskBase):
    meeting_id: Optional[int] = None
    assignee_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_name: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    complexity_score: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    meeting_id: Optional[int] = None
    assignee_id: Optional[int] = None
    risk_level: str
    risk_score: float
    risk_factors: List[str]
    ai_mitigation_tip: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RiskAssessmentRequest(BaseModel):
    title: str
    deadline_days_away: float
    priority: str # low, medium, high, urgent
    complexity_score: int # 1 to 5
    assignee_pending_tasks: int
    historical_delay_rate: float # 0.0 to 1.0

class RiskAssessmentResponse(BaseModel):
    risk_level: str # 'low', 'medium', 'high'
    risk_score: float # 0.00 to 1.00
    risk_factors: List[str]
    ai_mitigation_tip: str
    confidence: float
