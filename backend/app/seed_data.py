from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
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
from app.ml.risk_model import risk_predictor

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if database is already seeded
    if db.query(User).count() > 0:
        print("[INFO] Database already contains data. Skipping initial seeding.")
        db.close()
        return

    print("[INFO] Seeding realistic enterprise data for AI Meeting Intelligence...")

    # 1. Create Users (Module 1 & 2)
    users_data = [
        {
            "name": "Alex Rivera",
            "email": "alex.rivera@enterprise.ai",
            "password": "password123",
            "role": "admin",
            "job_title": "Head of Engineering",
            "department": "Engineering Leadership",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        },
        {
            "name": "Sarah Chen",
            "email": "sarah.chen@enterprise.ai",
            "password": "password123",
            "role": "user",
            "job_title": "Staff Backend Architect",
            "department": "Core Infrastructure",
            "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
        },
        {
            "name": "Marcus Vance",
            "email": "marcus.vance@enterprise.ai",
            "password": "password123",
            "role": "user",
            "job_title": "Principal Product Manager",
            "department": "Product Intelligence",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        },
        {
            "name": "Elena Rostova",
            "email": "elena.rostova@enterprise.ai",
            "password": "password123",
            "role": "user",
            "job_title": "QA Automation Lead",
            "department": "Quality Engineering",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        },
        {
            "name": "David Kim",
            "email": "david.kim@enterprise.ai",
            "password": "password123",
            "role": "user",
            "job_title": "DevOps & Cloud Engineer",
            "department": "Site Reliability",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
        }
    ]

    created_users = []
    for u in users_data:
        user_obj = User(
            name=u["name"],
            email=u["email"],
            hashed_password=get_password_hash(u["password"]),
            role=u["role"],
            job_title=u["job_title"],
            department=u["department"],
            avatar_url=u["avatar_url"],
            preferences={"theme": "dark", "email_notifications": True, "task_reminders": True}
        )
        db.add(user_obj)
        created_users.append(user_obj)

    db.commit()
    for u in created_users:
        db.refresh(u)

    admin_user = created_users[0]
    sarah = created_users[1]
    marcus = created_users[2]
    elena = created_users[3]

    now = datetime.now(timezone.utc)

    # 2. Create Meetings (Module 3 & 4)
    # Meeting 1: Completed with full AI intelligence
    m1 = Meeting(
        title="Q3 AI Infrastructure & Speech Scalability Sync",
        description="Reviewing high-throughput STT pipeline, MySQL cluster migration, and n8n webhook latency.",
        agenda="1. Database Migration Review\n2. Real-time Audio Streaming Latency\n3. ML Task Risk Prediction Benchmarks\n4. Agentic Workflow Rollout",
        scheduled_start=now - timedelta(days=1, hours=3),
        scheduled_end=now - timedelta(days=1, hours=2),
        status="completed",
        location="Meeting Room Aurora / Online",
        host_id=admin_user.id
    )
    db.add(m1)

    # Meeting 2: Upcoming
    m2 = Meeting(
        title="Enterprise Client Security Audit & Agent Integration",
        description="Discussion on SOC2 compliance, encrypted transcript storage, and agentic permission guardrails.",
        agenda="1. Access Token Lifecycle\n2. Audio Encryption at Rest\n3. Diarization Privacy Constraints",
        scheduled_start=now + timedelta(days=1, hours=4),
        scheduled_end=now + timedelta(days=1, hours=5),
        status="scheduled",
        location="Executive Boardroom B",
        host_id=admin_user.id
    )
    db.add(m2)

    # Meeting 3: Completed
    m3 = Meeting(
        title="Product Roadmap & User Retention Analysis",
        description="Deep dive on Q4 feature prioritization, Kanban board interactions, and exportable AI reports.",
        agenda="1. Feature Adoption KPIs\n2. User Feedback on Summarizer\n3. Action Item Completion Velocity",
        scheduled_start=now - timedelta(days=3),
        scheduled_end=now - timedelta(days=3, hours=-1),
        status="completed",
        location="Virtual Workspace",
        host_id=marcus.id
    )
    db.add(m3)

    # Meeting 4: Missed Session (Past-due scheduled meeting with unattended participants)
    m4 = Meeting(
        title="Sprint 42 Architecture Deep Dive & Sprint Retro",
        description="Comprehensive retrospective on backend microservices, audio pipeline bottlenecks, and task risk modeling.",
        agenda="1. Review missed audio streaming benchmarks\n2. Reallocate high-risk sprint backlog items\n3. Set new target milestone schedule",
        scheduled_start=now - timedelta(days=2, hours=4),
        scheduled_end=now - timedelta(days=2, hours=3),
        status="missed",
        location="Online (Google Meet)",
        meeting_url="https://meet.google.com/xyz-arch-sync",
        host_id=sarah.id
    )
    db.add(m4)

    db.commit()
    db.refresh(m1)
    db.refresh(m2)
    db.refresh(m3)
    db.refresh(m4)

    # Participants for M1
    for u, role in zip(created_users, ["host", "speaker", "speaker", "speaker", "attendee"]):
        p = Participant(
            meeting_id=m1.id,
            user_id=u.id,
            name=u.name,
            email=u.email,
            role=role,
            attended=True
        )
        db.add(p)

    # Participants for M2
    for u in created_users[:3]:
        p = Participant(
            meeting_id=m2.id,
            user_id=u.id,
            name=u.name,
            email=u.email,
            role="attendee",
            attended=True
        )
        db.add(p)

    # Participants for M4 (Missed meeting)
    for u, att in zip(created_users, [False, True, False, False]):
        p = Participant(
            meeting_id=m4.id,
            user_id=u.id,
            name=u.name,
            email=u.email,
            role="host" if u.id == sarah.id else "attendee",
            attended=att
        )
        db.add(p)

    db.commit()

    # 3. Transcripts & Diarized Segments for M1 (Module 6 & 7)
    transcript_segments_data = [
        {"speaker": "Alex Rivera (Host)", "start": 0.0, "end": 8.5, "text": "Good morning team. Today's priority is finalizing our speech-to-text pipeline and stress-testing the ML task delay predictor.", "sentiment": "positive"},
        {"speaker": "Sarah Chen (Tech Lead)", "start": 9.2, "end": 22.0, "text": "On infrastructure, the MySQL connection pooling is active with sub-millisecond query latency. However, audio buffer chunking needs async streaming to stay under 150ms.", "sentiment": "constructive"},
        {"speaker": "Marcus Vance (Product)", "start": 23.0, "end": 35.5, "text": "From product feedback, customers love the 1-click summary generation and risk badges on the Kanban board. We need to ensure high-risk tasks alert assignees immediately.", "sentiment": "positive"},
        {"speaker": "Sarah Chen (Tech Lead)", "start": 36.2, "end": 49.0, "text": "I can implement the background worker queue with Redis / Python async workers by Thursday afternoon.", "sentiment": "constructive"},
        {"speaker": "Elena Rostova (QA Lead)", "start": 50.0, "end": 62.5, "text": "I will execute the regression suite on n8n webhook web dispatches and simulate 500 concurrent meeting triggers.", "sentiment": "positive"},
        {"speaker": "Alex Rivera (Host)", "start": 63.5, "end": 74.0, "text": "Decision confirmed: We are officially freezing feature additions tonight and focusing strictly on reliability and AI agent automation.", "sentiment": "positive"}
    ]

    full_tr_text = "\n".join([f"[{s['speaker']}]: {s['text']}" for s in transcript_segments_data])
    tr1 = Transcript(
        meeting_id=m1.id,
        full_text=full_tr_text,
        language="en",
        word_count=len(full_tr_text.split()),
        confidence_score=0.97
    )
    db.add(tr1)
    db.commit()
    db.refresh(tr1)

    for s in transcript_segments_data:
        seg = TranscriptSegment(
            transcript_id=tr1.id,
            speaker_label=s["speaker"],
            start_time=s["start"],
            end_time=s["end"],
            text=s["text"],
            sentiment=s["sentiment"]
        )
        db.add(seg)

    # 4. Summary & Topics (Module 8)
    sum1 = Summary(
        meeting_id=m1.id,
        executive_summary="The team aligned on core architectural milestones for the AI Meeting Intelligence platform. The MySQL database integration is verified, speech-to-text chunking will be migrated to asynchronous background workers to ensure low latency, and a strict feature freeze was enacted to prioritize reliability and automated test coverage.",
        key_points=[
            "Completed database migration to MySQL with optimized indexing for audio transcripts.",
            "Prioritized async worker queues for STT audio processing to maintain latency < 150ms.",
            "Enacted formal feature freeze to focus on security audits, performance, and n8n webhook automation.",
            "Assigned automated test suite validation to QA Lead Elena Rostova."
        ],
        topics=[
            {"name": "Speech-to-Text Latency", "relevance": 0.96, "discussion_time_mins": 14.5},
            {"name": "Database Architecture", "relevance": 0.89, "discussion_time_mins": 10.0},
            {"name": "Agentic Automation & n8n", "relevance": 0.84, "discussion_time_mins": 8.5},
            {"name": "QA & Test Coverage", "relevance": 0.78, "discussion_time_mins": 6.0}
        ],
        sentiment_overview="constructive",
        action_items_count=3
    )
    db.add(sum1)

    # 5. Decisions (Module 12)
    d1 = Decision(
        meeting_id=m1.id,
        decision_text="Enact immediate feature freeze for Q3 release cycle",
        context="Ensures focus on system reliability, end-to-end automation, and zero-defect deployment.",
        responsible_person="Alex Rivera",
        impact_level="high",
        status="approved"
    )
    d2 = Decision(
        meeting_id=m1.id,
        decision_text="Implement asynchronous worker queue for high-throughput speech transcription",
        context="Eliminates HTTP timeout risks during simultaneous multi-hour recording uploads.",
        responsible_person="Sarah Chen",
        impact_level="critical",
        status="approved"
    )
    db.add(d1)
    db.add(d2)

    # 6. Tasks & ML Risk Prediction (Module 9, 10, 11)
    t1_risk = risk_predictor.predict(deadline_days=1.8, priority="urgent", complexity_score=4, assignee_pending_tasks=4, historical_delay_rate=0.3)
    t1 = Task(
        meeting_id=m1.id,
        assignee_id=sarah.id,
        title="Implement async worker queue for STT streaming",
        description="Migrate audio processing pipeline to background worker tasks with progress callbacks.",
        assignee_name=sarah.name,
        assignee_email=sarah.email,
        deadline=now + timedelta(days=2),
        priority="urgent",
        status="in_progress",
        complexity_score=4,
        risk_level=t1_risk["risk_level"],
        risk_score=t1_risk["risk_score"],
        risk_factors=t1_risk["risk_factors"],
        ai_mitigation_tip=t1_risk["ai_mitigation_tip"]
    )

    t2_risk = risk_predictor.predict(deadline_days=4.5, priority="medium", complexity_score=3, assignee_pending_tasks=1, historical_delay_rate=0.15)
    t2 = Task(
        meeting_id=m1.id,
        assignee_id=elena.id,
        title="Execute automated E2E tests for n8n webhooks",
        description="Validate payload delivery, retry queues, and notification dispatch reliability.",
        assignee_name=elena.name,
        assignee_email=elena.email,
        deadline=now + timedelta(days=5),
        priority="medium",
        status="pending",
        complexity_score=3,
        risk_level=t2_risk["risk_level"],
        risk_score=t2_risk["risk_score"],
        risk_factors=t2_risk["risk_factors"],
        ai_mitigation_tip=t2_risk["ai_mitigation_tip"]
    )

    t3_risk = risk_predictor.predict(deadline_days=1.0, priority="high", complexity_score=2, assignee_pending_tasks=3, historical_delay_rate=0.2)
    t3 = Task(
        meeting_id=m1.id,
        assignee_id=marcus.id,
        title="Finalize Executive Meeting Intelligence Deck & Analytics",
        description="Prepare executive summary slides highlighting time saved, accuracy metrics, and agentic triggers.",
        assignee_name=marcus.name,
        assignee_email=marcus.email,
        deadline=now + timedelta(days=1),
        priority="high",
        status="pending",
        complexity_score=2,
        risk_level=t3_risk["risk_level"],
        risk_score=t3_risk["risk_score"],
        risk_factors=t3_risk["risk_factors"],
        ai_mitigation_tip=t3_risk["ai_mitigation_tip"]
    )

    t4 = Task(
        meeting_id=m1.id,
        assignee_id=admin_user.id,
        title="Configure MySQL Connection Pool & Schema Indexes",
        description="Established persistent database pool and index definitions for search optimization.",
        assignee_name=admin_user.name,
        assignee_email=admin_user.email,
        deadline=now - timedelta(hours=6),
        priority="high",
        status="completed",
        complexity_score=3,
        risk_level="low",
        risk_score=0.0,
        risk_factors=["Completed ahead of schedule."],
        ai_mitigation_tip="No action required.",
        completed_at=now - timedelta(hours=2)
    )

    db.add(t1)
    db.add(t2)
    db.add(t3)
    db.add(t4)

    # 7. Agent Logs (Module 17)
    log1 = AgentLog(
        meeting_id=m1.id,
        action_type="n8n_webhook_trigger",
        description="Autonomous Agent triggered n8n workflow for high-risk task 'Implement async worker queue'",
        payload={"task_id": 1, "assignee": "Sarah Chen", "risk_score": t1_risk["risk_score"], "event": "high_risk_task_alert"},
        status="success",
        n8n_webhook_url="https://primary-production-webhook.n8n.cloud/webhook/meeting-intelligence-action",
        result_summary="Workflow triggered: Slack alert sent to #engineering-leads and Jira risk flag set."
    )
    log2 = AgentLog(
        meeting_id=m1.id,
        action_type="email_followup",
        description="Executive meeting summary and action item digest distributed to 5 attendees",
        payload={"subject": "📋 Meeting Summary & Action Items: Q3 AI Infrastructure & Speech Scalability Sync"},
        status="success",
        result_summary="Email digest successfully delivered to all registered participants."
    )
    db.add(log1)
    db.add(log2)

    # 8. Notifications (Module 14)
    notif1 = Notification(
        user_id=admin_user.id,
        title="⚠️ High-Risk Task Detected",
        message="ML Model flagged 'Implement async worker queue' with high delay risk (Tight turnaround + complex architecture).",
        type="high_risk_alert",
        link_url="/tasks",
        read=False
    )
    notif2 = Notification(
        user_id=admin_user.id,
        title="📅 Upcoming Meeting Reminder",
        message="Enterprise Client Security Audit starts tomorrow at 2:00 PM.",
        type="meeting_reminder",
        link_url=f"/meetings/{m2.id}",
        read=False
    )
    notif3 = Notification(
        user_id=admin_user.id,
        title="🤖 Agentic Follow-up Executed",
        message="Summary email digest and n8n webhook automation ran for Q3 AI Infrastructure Sync.",
        type="follow_up",
        link_url="/automation",
        read=True
    )
    notif4 = Notification(
        user_id=admin_user.id,
        title="⚠️ Missed Meeting Alert: Retro Session",
        message="You missed 'Sprint 42 Architecture Deep Dive & Sprint Retro'. Click here to request to schedule it again.",
        type="meeting_rescheduled",
        link_url=f"/meetings/{m4.id}",
        read=False
    )
    db.add(notif1)
    db.add(notif2)
    db.add(notif3)
    db.add(notif4)

    db.commit()
    db.close()
    print("[SUCCESS] Realistic enterprise seed data created successfully!")

if __name__ == "__main__":
    seed_database()
