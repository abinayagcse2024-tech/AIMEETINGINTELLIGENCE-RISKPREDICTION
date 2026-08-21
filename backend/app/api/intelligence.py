from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.decision import Decision
from app.models.task import Task
from app.schemas.intelligence import SummaryResponse, DecisionResponse, DecisionCreate, TaskResponse
from app.services.nlp_service import nlp_service
from app.ml.risk_model import risk_predictor

router = APIRouter(prefix="/intelligence", tags=["Module 8, 9, 12: Summary, Tasks & Decisions"])

@router.post("/process/{meeting_id}")
def generate_full_meeting_intelligence(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes complete NLP pipeline on meeting transcript:
    - Module 8: Executive Summary & Key Points
    - Module 9: Task & Deadline Extraction
    - Module 11: ML Task Risk Prediction
    - Module 12: Decision Tracking
    """
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript is required before generating intelligence. Run STT first.")

    participant_names = [p.name for p in meeting.participants]

    # Run NLP Extraction
    extracted = nlp_service.extract_all(meeting.title, transcript.full_text, participant_names)

    # 1. Save or Update Summary (Module 8)
    summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
    if summary:
        summary.executive_summary = extracted["summary"]["executive_summary"]
        summary.key_points = extracted["summary"]["key_points"]
        summary.topics = extracted["summary"]["topics"]
        summary.sentiment_overview = extracted["summary"]["sentiment_overview"]
        summary.action_items_count = len(extracted["tasks"])
    else:
        summary = Summary(
            meeting_id=meeting_id,
            executive_summary=extracted["summary"]["executive_summary"],
            key_points=extracted["summary"]["key_points"],
            topics=extracted["summary"]["topics"],
            sentiment_overview=extracted["summary"]["sentiment_overview"],
            action_items_count=len(extracted["tasks"])
        )
        db.add(summary)

    # 2. Save Decisions (Module 12)
    # Clear previous decisions if regenerating
    db.query(Decision).filter(Decision.meeting_id == meeting_id).delete()
    for d in extracted["decisions"]:
        dec_obj = Decision(
            meeting_id=meeting_id,
            decision_text=d["decision_text"],
            context=d.get("context"),
            responsible_person=d.get("responsible_person"),
            impact_level=d.get("impact_level", "medium"),
            status=d.get("status", "approved")
        )
        db.add(dec_obj)

    # 3. Save Tasks & ML Risk Scoring (Module 9 & 11)
    db.query(Task).filter(Task.meeting_id == meeting_id).delete()
    for t in extracted["tasks"]:
        task_obj = Task(
            meeting_id=meeting_id,
            title=t["title"],
            description=t.get("description"),
            assignee_name=t["assignee_name"],
            deadline=t.get("deadline"),
            priority=t.get("priority", "medium"),
            status="pending",
            complexity_score=t.get("complexity_score", 3),
            risk_level=t.get("risk_level", "low"),
            risk_score=t.get("risk_score", 0.15),
            risk_factors=t.get("risk_factors", []),
            ai_mitigation_tip=t.get("ai_mitigation_tip")
        )
        db.add(task_obj)

    db.commit()

    return {
        "success": True,
        "message": "AI Meeting Intelligence extracted and saved successfully",
        "summary": summary,
        "decisions_count": len(extracted["decisions"]),
        "tasks_count": len(extracted["tasks"])
    }

@router.get("/summary/{meeting_id}", response_model=SummaryResponse)
def get_meeting_summary(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found for this meeting")
    return summary

@router.get("/decisions/{meeting_id}", response_model=List[DecisionResponse])
def get_meeting_decisions(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    return decisions

@router.post("/decisions", response_model=DecisionResponse)
def create_decision(
    dec_in: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = Decision(
        meeting_id=dec_in.meeting_id,
        decision_text=dec_in.decision_text,
        context=dec_in.context,
        responsible_person=dec_in.responsible_person or current_user.name,
        impact_level=dec_in.impact_level or "medium",
        status=dec_in.status or "approved"
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision
