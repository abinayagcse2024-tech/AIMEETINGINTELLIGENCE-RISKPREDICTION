from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    decision_text = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    responsible_person = Column(String(255), nullable=True) # e.g. 'Engineering Team' or 'Sarah Chen'
    impact_level = Column(String(50), default="medium") # 'low', 'medium', 'high', 'critical'
    status = Column(String(50), default="approved") # 'approved', 'under_review', 'superseded'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    meeting = relationship("Meeting", back_populates="decisions")
