from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    read: bool
    link_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AgentActionRequest(BaseModel):
    meeting_id: Optional[int] = None
    action_type: str # 'analyze_followups', 'send_email_summary', 'trigger_n8n_webhook', 'create_task', 'suggest_schedule'
    custom_prompt: Optional[str] = None
    n8n_webhook_url: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class AgentLogResponse(BaseModel):
    id: int
    meeting_id: Optional[int] = None
    action_type: str
    description: str
    payload: Dict[str, Any]
    status: str
    n8n_webhook_url: Optional[str] = None
    result_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatQueryRequest(BaseModel):
    meeting_id: Optional[int] = None
    query: str
    chat_history: Optional[List[Dict[str, str]]] = []

class ChatQueryResponse(BaseModel):
    response: str
    suggested_actions: Optional[List[Dict[str, Any]]] = []
    executed_action: Optional[Dict[str, Any]] = None
    sources: Optional[List[Dict[str, Any]]] = []

class DashboardSummaryResponse(BaseModel):
    total_meetings: int
    upcoming_meetings: int
    missed_meetings: Optional[int] = 0
    pending_tasks: int
    completed_tasks: int
    high_risk_tasks: int
    avg_task_completion_rate: float
    total_meeting_hours: float
    meeting_frequency_chart: List[Dict[str, Any]]
    task_status_distribution: List[Dict[str, Any]]
    risk_breakdown: List[Dict[str, Any]]
    recent_meetings: List[Dict[str, Any]]
    urgent_tasks: List[Dict[str, Any]]
