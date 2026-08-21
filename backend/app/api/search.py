from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.transcript import Transcript, TranscriptSegment
from app.models.summary import Summary
from app.models.decision import Decision
from app.models.task import Task

router = APIRouter(prefix="/search", tags=["Module 13: Meeting History & Search"])

@router.get("/")
def search_meeting_intelligence(
    q: str = Query(..., min_length=1, description="Search query string"),
    meeting_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Full-text search across:
    1. Meetings (Title, Agenda, Description)
    2. Transcripts & Diarized Speaker dialogue segments
    3. Summaries & Key points
    4. Decisions
    5. Tasks
    """
    search_term = f"%{q}%"

    # 1. Search Meetings
    meeting_query = db.query(Meeting).filter(
        (Meeting.title.ilike(search_term)) |
        (Meeting.agenda.ilike(search_term)) |
        (Meeting.description.ilike(search_term))
    )
    if meeting_id:
        meeting_query = meeting_query.filter(Meeting.id == meeting_id)
    meeting_total = meeting_query.count()
    meetings = meeting_query.offset((page - 1) * page_size).limit(page_size).all()

    # 2. Search Transcript Segments
    seg_query = db.query(TranscriptSegment).join(Transcript).filter(
        TranscriptSegment.text.ilike(search_term)
    )
    if meeting_id:
        seg_query = seg_query.filter(Transcript.meeting_id == meeting_id)
    transcript_total = seg_query.count()
    transcript_matches = seg_query.offset((page - 1) * page_size).limit(page_size).all()

    # 3. Search Decisions
    dec_query = db.query(Decision).filter(
        (Decision.decision_text.ilike(search_term)) |
        (Decision.context.ilike(search_term))
    )
    if meeting_id:
        dec_query = dec_query.filter(Decision.meeting_id == meeting_id)
    dec_total = dec_query.count()
    decisions = dec_query.offset((page - 1) * page_size).limit(page_size).all()

    # 4. Search Tasks
    task_query = db.query(Task).filter(
        (Task.title.ilike(search_term)) |
        (Task.description.ilike(search_term)) |
        (Task.assignee_name.ilike(search_term))
    )
    if meeting_id:
        task_query = task_query.filter(Task.meeting_id == meeting_id)
    task_total = task_query.count()
    tasks = task_query.offset((page - 1) * page_size).limit(page_size).all()

    # 5. Search Summaries
    sum_query = db.query(Summary).filter(
        Summary.executive_summary.ilike(search_term)
    )
    if meeting_id:
        sum_query = sum_query.filter(Summary.meeting_id == meeting_id)
    sum_total = sum_query.count()
    summaries = sum_query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "query": q,
        "page": page,
        "page_size": page_size,
        "total_results": meeting_total + transcript_total + dec_total + task_total + sum_total,
        "results": {
            "meetings": [
                {"id": m.id, "title": m.title, "scheduled_start": m.scheduled_start, "status": m.status}
                for m in meetings
            ],
            "transcript_segments": [
                {
                    "segment_id": s.id,
                    "speaker": s.speaker_label,
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "text": s.text,
                    "transcript_id": s.transcript_id
                } for s in transcript_matches
            ],
            "decisions": [
                {"id": d.id, "meeting_id": d.meeting_id, "decision": d.decision_text, "person": d.responsible_person}
                for d in decisions
            ],
            "tasks": [
                {"id": t.id, "meeting_id": t.meeting_id, "title": t.title, "assignee": t.assignee_name, "priority": t.priority, "risk_level": t.risk_level}
                for t in tasks
            ],
            "summaries": [
                {"id": sm.id, "meeting_id": sm.meeting_id, "summary_snippet": sm.executive_summary[:200] + "..."}
                for sm in summaries
            ]
        }
    }
