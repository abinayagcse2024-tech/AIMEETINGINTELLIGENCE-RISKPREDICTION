from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user") # 'admin' or 'user'
    avatar_url = Column(String(500), nullable=True)
    job_title = Column(String(150), nullable=True)
    department = Column(String(150), nullable=True)
    preferences = Column(JSON, default=dict) # e.g. {"theme": "dark", "email_notifications": True, "task_reminders": True}
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    hosted_meetings = relationship("Meeting", back_populates="host", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
