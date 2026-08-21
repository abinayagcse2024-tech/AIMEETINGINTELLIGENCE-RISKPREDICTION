from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.agent_log import AgentLog
from app.schemas.agent import AgentActionRequest, AgentLogResponse
from app.agent.agent_engine import agent_engine
from app.agent.n8n_integration import n8n_client

router = APIRouter(prefix="/agent", tags=["Module 17: Agentic AI Automation & n8n"])

@router.post("/execute-meeting-automations/{meeting_id}")
async def execute_meeting_automations(
    meeting_id: int,
    req: AgentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module 17: Autonomous AI Agent analyzes meeting outcomes:
    - Decides follow-up actions
    - Triggers reminders
    - Sends email summaries
    - Triggers n8n automated webhook workflows
    """
    logs = await agent_engine.analyze_and_execute_meeting_automations(
        db=db,
        meeting_id=meeting_id,
        n8n_webhook_url=req.n8n_webhook_url
    )

    return {
        "success": True,
        "message": f"Autonomous AI Agent executed {len(logs)} automation actions",
        "actions": logs
    }

@router.post("/test-n8n-trigger")
async def test_n8n_webhook(
    req: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Test bench endpoint for manual n8n workflow dispatch
    """
    webhook_url = req.get("webhook_url")
    event_name = req.get("event", "test_ping_event")
    payload = req.get("payload", {"test": True, "initiated_by": current_user.email})

    res = await n8n_client.trigger_webhook(
        event_name=event_name,
        payload=payload,
        webhook_url=webhook_url
    )
    return res

@router.get("/logs", response_model=List[AgentLogResponse])
def get_agent_execution_logs(
    meeting_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AgentLog)
    if meeting_id:
        query = query.filter(AgentLog.meeting_id == meeting_id)
    
    logs = query.order_by(AgentLog.created_at.desc()).limit(50).all()
    return logs
