from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.recording import Recording
from app.models.transcript import Transcript, TranscriptSegment
from app.schemas.intelligence import TranscriptResponse, TranscriptSegmentSchema
from app.schemas.pagination import PaginatedResponse, paginate
from app.services.stt_service import stt_service

router = APIRouter(prefix="/transcription", tags=["Module 6 & 7: STT & Speaker Identification"])

@router.post("/process/{meeting_id}", response_model=TranscriptResponse)
def process_speech_to_text(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes Speech-to-Text conversion and Speaker Diarization on the meeting's recording.
    """
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    recording = db.query(Recording).filter(Recording.meeting_id == meeting_id).order_by(Recording.id.desc()).first()
    file_path = recording.file_path if recording else "virtual_meeting_audio.wav"

    # Participant names for speaker mapping
    participants = [p.name for p in meeting.participants]
    
    # Run STT & Diarization engine
    stt_res = stt_service.transcribe_audio(
        file_path=file_path,
        meeting_title=meeting.title,
        participant_names=participants
    )

    # Check if transcript already exists, update or create
    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
    if transcript:
        # Clear existing segments
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

    # Insert Diarized Speaker Segments
    for seg in stt_res["segments"]:
        segment_obj = TranscriptSegment(
            transcript_id=transcript.id,
            speaker_label=seg["speaker_label"],
            start_time=seg["start_time"],
            end_time=seg["end_time"],
            text=seg["text"],
            sentiment=seg.get("sentiment", "neutral")
        )
        db.add(segment_obj)

    db.commit()
    db.refresh(transcript)
    return transcript

@router.get("/meeting/{meeting_id}")
def get_meeting_transcript(
    meeting_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found for this meeting")
        
    query = db.query(TranscriptSegment).filter(TranscriptSegment.transcript_id == transcript.id).order_by(TranscriptSegment.start_time.asc())
    items, total, total_pages = paginate(query, page, page_size)
    
    return {
        "id": transcript.id,
        "meeting_id": transcript.meeting_id,
        "full_text": transcript.full_text,
        "language": transcript.language,
        "word_count": transcript.word_count,
        "confidence_score": transcript.confidence_score,
        "created_at": transcript.created_at,
        "segments": {
            "data": items,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages
        }
    }

@router.get("/download/{meeting_id}")
def download_transcript(
    meeting_id: int,
    format: str = Query("txt", enum=["txt", "vtt"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    transcript_data = {
        "full_text": transcript.full_text,
        "segments": [
            {
                "speaker_label": s.speaker_label,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "text": s.text
            } for s in transcript.segments
        ]
    }

    content = stt_service.export_transcript(transcript_data, format_type=format)
    media_type = "text/vtt" if format == "vtt" else "text/plain"
    filename = f"transcript_meeting_{meeting_id}.{format}"

    return PlainTextResponse(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
