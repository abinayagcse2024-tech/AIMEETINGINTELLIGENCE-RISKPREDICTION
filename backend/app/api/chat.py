from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.agent import ChatQueryRequest, ChatQueryResponse
from app.agent.agent_engine import agent_engine

router = APIRouter(prefix="/chat", tags=["Module 15: AI Meeting Intelligence Chatbox"])

@router.post("/query", response_model=ChatQueryResponse)
async def query_ai_chatbox(
    req: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module 15 & 17: Interactive AI Chatbox with Meeting Intelligence Context & Tool Execution
    """
    res = await agent_engine.process_chatbox_query(
        db=db,
        current_user=current_user,
        query=req.query,
        meeting_id=req.meeting_id
    )
    return res
