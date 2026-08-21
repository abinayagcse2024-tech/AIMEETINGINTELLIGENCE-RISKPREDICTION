import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.recording import Recording
from app.models.transcript import Transcript, TranscriptSegment
from app.models.summary import Summary
from app.models.decision import Decision
from app.models.task import Task
from app.models.notification import Notification
from app.models.agent_log import AgentLog

def reset_to_clean_state():
    print("[INFO] Re-creating all database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create a single clean administrator user
        admin = User(
            name="System Admin",
            email="admin@meetintel.ai",
            hashed_password=get_password_hash("password123"),
            role="user",
            job_title="Lead Administrator",
            department="Operations",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            preferences={"theme": "dark", "email_notifications": True, "task_reminders": True}
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"[SUCCESS] Database initialized cleanly! Admin created: {admin.email} (Password: password123)")
        print("[INFO] 0 dummy meetings, 0 dummy transcripts, 0 dummy tasks present. Ready for real-time data.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize clean database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_to_clean_state()
