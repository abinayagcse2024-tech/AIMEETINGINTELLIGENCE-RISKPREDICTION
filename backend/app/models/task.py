from sqlalchemy import Column, Integer, String, Text, Float, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=True) # Can be linked to meeting or standalone
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assignee_name = Column(String(255), nullable=False) # e.g. 'Marcus Vance'
    assignee_email = Column(String(255), nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    deadline = Column(DateTime, nullable=True)
    priority = Column(String(50), default="medium") # 'low', 'medium', 'high', 'urgent'
    status = Column(String(50), default="pending") # 'pending', 'in_progress', 'completed'
    complexity_score = Column(Integer, default=3) # 1 (trivial) to 5 (complex)
    
    # ML Risk Assessment Fields
    risk_level = Column(String(50), default="low") # 'low', 'medium', 'high'
    risk_score = Column(Float, default=0.15) # 0.00 to 1.00 probability of delay
    risk_factors = Column(JSON, default=list) # List of explanations: e.g. ["Deadline in < 3 days", "Assignee has 4 other pending tasks"]
    ai_mitigation_tip = Column(Text, nullable=True) # e.g. "Reassign sub-tasks or extend deadline by 2 days"
    
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    meeting = relationship("Meeting", back_populates="tasks")
    assignee = relationship("User")
