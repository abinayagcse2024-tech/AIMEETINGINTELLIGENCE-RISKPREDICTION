from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional link to registered user
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(String(50), default="attendee") # 'host', 'speaker', 'attendee', 'note_taker'
    attended = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User")
