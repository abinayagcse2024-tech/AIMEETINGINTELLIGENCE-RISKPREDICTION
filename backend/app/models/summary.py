from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), unique=True, nullable=False)
    executive_summary = Column(Text, nullable=False)
    key_points = Column(JSON, default=list) # List of strings: key bullet discussion points
    topics = Column(JSON, default=list) # List of objects: [{"name": "Budget", "relevance": 0.9, "discussion_time_mins": 8}]
    sentiment_overview = Column(String(50), default="constructive")
    action_items_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    meeting = relationship("Meeting", back_populates="summary")
