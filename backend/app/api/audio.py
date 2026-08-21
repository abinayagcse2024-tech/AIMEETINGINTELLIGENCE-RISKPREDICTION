import os
import shutil
import mimetypes
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.recording import Recording
from app.models.transcript import Transcript, TranscriptSegment
from app.models.summary import Summary
from app.models.decision import Decision
from app.models.task import Task
from app.services.stt_service import stt_service
from app.services.nlp_service import nlp_service

router = APIRouter(prefix="/audio", tags=["Module 5: Video & Audio Recording / Upload"])

@router.post("/upload/{meeting_id}")
async def upload_meeting_media(
    meeting_id: int,
    file: UploadFile = File(...),
    duration: float = Form(0.0),
    media_type: str = Form("auto"), # 'video', 'audio', or 'auto'
    raw_transcript: str = Form(None), # Live speech-to-text text captured from microphone
    auto_process: bool = Form(True), # Automatically transcribe and summarize
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts video (.mp4, .webm, .mov, .mkv) and audio (.mp3, .wav, .m4a, .ogg) uploads or recordings.
    Automatically executes Speech-to-Text Diarization, Executive Summary, Decision extraction & Task Risk scoring.
    """
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Safe filename
    timestamp = int(datetime.now(timezone.utc).timestamp())
    safe_name = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
    filename = f"meeting_{meeting_id}_{timestamp}_{safe_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    
    # Guess mime type
    detected_mime, _ = mimetypes.guess_type(filename)
    content_type = file.content_type or detected_mime or "video/mp4"

    recording = Recording(
        meeting_id=meeting_id,
        file_name=filename,
        file_path=file_path,
        file_size_bytes=file_size,
        duration_seconds=duration or 60.0,
        file_format=content_type
    )
    db.add(recording)
    
    # Update meeting status to completed
    if meeting.status == "scheduled":
        meeting.status = "completed"

    db.commit()
    db.refresh(recording)

    is_video = "video" in content_type.lower() or filename.endswith((".mp4", ".webm", ".mov", ".mkv", ".avi"))

    # -------------------------------------------------------------
    # AUTOMATIC SPEECH-TO-TEXT & AI INTELLIGENCE PIPELINE
    # -------------------------------------------------------------
    if auto_process:
        try:
            # 1. Run STT & Speaker Diarization
            participants = [p.name for p in meeting.participants]
            stt_res = stt_service.transcribe_audio(
                file_path=file_path,
                meeting_title=meeting.title,
                participant_names=participants,
                raw_text=raw_transcript
            )

            # Save / update transcript
            transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
            if transcript:
                db.query(TranscriptSegment).filter(TranscriptSegment.transcript_id == transcript.id).delete()
                transcript.full_text = stt_res["full_text"]
                transcript.word_count = stt_res["word_count"]
                transcript.confidence_score = stt_res["confidence_score"]
            else:
                transcript = Transcript(
                    meeting_id=meeting_id,
                    full_text=stt_res["full_text"],
                    language=stt_res["language"],
                    word_count=stt_res["word_count"],
                    confidence_score=stt_res["confidence_score"]
                )
                db.add(transcript)
                db.commit()
                db.refresh(transcript)

            for seg in stt_res["segments"]:
                db.add(TranscriptSegment(
                    transcript_id=transcript.id,
                    speaker_label=seg["speaker_label"],
                    start_time=seg["start_time"],
                    end_time=seg["end_time"],
                    text=seg["text"],
                    sentiment=seg.get("sentiment", "neutral")
                ))
            db.commit()

            # 2. Run NLP Intelligence (Summary, Decisions, Tasks & ML Risk Prediction)
            extracted = nlp_service.extract_all(meeting.title, transcript.full_text, participants)

            # Save Summary
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

            # Save Decisions
            db.query(Decision).filter(Decision.meeting_id == meeting_id).delete()
            for d in extracted["decisions"]:
                db.add(Decision(
                    meeting_id=meeting_id,
                    decision_text=d["decision_text"],
                    context=d.get("context"),
                    responsible_person=d.get("responsible_person"),
                    impact_level=d.get("impact_level", "medium"),
                    status=d.get("status", "approved")
                ))

            # Save Tasks & ML Risk Scores
            db.query(Task).filter(Task.meeting_id == meeting_id).delete()
            for t in extracted["tasks"]:
                db.add(Task(
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
                ))

            db.commit()
        except Exception as e:
            print(f"[ERROR] Auto pipeline error: {e}")
            db.rollback()

    return {
        "success": True,
        "message": f"{'Video' if is_video else 'Audio'} uploaded, transcribed and summarized successfully",
        "recording_id": recording.id,
        "file_name": recording.file_name,
        "file_size": file_size,
        "file_format": recording.file_format,
        "is_video": is_video,
        "duration_seconds": recording.duration_seconds
    }

@router.get("/stream/{recording_id}")
def stream_media(
    recording_id: int,
    db: Session = Depends(get_db)
):
    rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not rec or not os.path.exists(rec.file_path):
        raise HTTPException(status_code=404, detail="Media file not found")

    detected_mime, _ = mimetypes.guess_type(rec.file_path)
    media_type = rec.file_format or detected_mime or "video/mp4"

    return FileResponse(
        rec.file_path,
        media_type=media_type,
        filename=rec.file_name
    )

@router.get("/meeting/{meeting_id}")
def get_meeting_recordings(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recordings = db.query(Recording).filter(Recording.meeting_id == meeting_id).order_by(Recording.id.desc()).all()
    res = []
    for r in recordings:
        is_video = "video" in (r.file_format or "").lower() or r.file_name.endswith((".mp4", ".webm", ".mov", ".mkv", ".avi"))
        res.append({
            "id": r.id,
            "meeting_id": r.meeting_id,
            "file_name": r.file_name,
            "file_size_bytes": r.file_size_bytes,
            "duration_seconds": r.duration_seconds,
            "file_format": r.file_format,
            "is_video": is_video,
            "uploaded_at": r.uploaded_at
        })
    return res
