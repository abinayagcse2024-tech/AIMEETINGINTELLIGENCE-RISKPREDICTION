from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=True)
    action_type = Column(String(100), nullable=False) # 'n8n_webhook_trigger', 'email_followup', 'task_creation', 'schedule_followup', 'chatbox_execution'
    description = Column(Text, nullable=False)
    payload = Column(JSON, default=dict)
    status = Column(String(50), default="success") # 'success', 'pending', 'failed', 'simulated'
    n8n_webhook_url = Column(String(500), nullable=True)
    result_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    meeting = relationship("Meeting", back_populates="agent_logs")
