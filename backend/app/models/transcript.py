from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), unique=True, nullable=False)
    full_text = Column(Text, nullable=False)
    language = Column(String(50), default="en")
    word_count = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.95)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    meeting = relationship("Meeting", back_populates="transcript")
    segments = relationship("TranscriptSegment", back_populates="transcript", cascade="all, delete-orphan")

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"), nullable=False)
    speaker_label = Column(String(100), default="Speaker 1") # e.g. 'Alex Rivera (Host)', 'Sarah Chen'
    speaker_id = Column(Integer, nullable=True) # ID of user or participant if identified
    start_time = Column(Float, nullable=False) # in seconds (e.g. 12.5)
    end_time = Column(Float, nullable=False) # in seconds (e.g. 18.2)
    text = Column(Text, nullable=False)
    sentiment = Column(String(50), default="neutral") # 'positive', 'neutral', 'negative', 'constructive'

    # Relationships
    transcript = relationship("Transcript", back_populates="segments")
