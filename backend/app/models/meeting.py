from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    agenda = Column(Text, nullable=True)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=True)
    status = Column(String(50), default="scheduled") # 'scheduled', 'in_progress', 'completed', 'cancelled'
    location = Column(String(255), default="Online (AI Workspace)")
    meeting_url = Column(String(500), nullable=True) # e.g. https://meet.google.com/xyz-abcd-efg or Zoom link
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    speaker_mapping = Column(JSON, nullable=True) # E.g., {"Speaker 1": "Abinaya"}
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    host = relationship("User", back_populates="hosted_meetings")
    participants = relationship("Participant", back_populates="meeting", cascade="all, delete-orphan")
    recordings = relationship("Recording", back_populates="meeting", cascade="all, delete-orphan")
    transcript = relationship("Transcript", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    summary = relationship("Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="meeting", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="meeting", cascade="all, delete-orphan")
    agent_logs = relationship("AgentLog", back_populates="meeting", cascade="all, delete-orphan")
