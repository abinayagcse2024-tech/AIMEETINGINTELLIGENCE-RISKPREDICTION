from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.agent import NotificationResponse
from app.schemas.pagination import PaginatedResponse, paginate

router = APIRouter(prefix="/notifications", tags=["Module 14: Personalized Notifications"])

@router.get("/", response_model=PaginatedResponse[NotificationResponse])
def get_user_notifications(
    unread_only: bool = False,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.read == False)
    
    query = query.order_by(Notification.created_at.desc())
    items, total, total_pages = paginate(query, page, page_size)
    return {"data": items, "page": page, "page_size": page_size, "total": total, "total_pages": total_pages}

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"success": True, "message": "All notifications marked as read"}

@router.post("/trigger-demo-alerts")
def trigger_demo_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers demo reminders for upcoming meetings, overdue tasks, and high-risk alerts"""
    demo_notifs = [
        Notification(
            user_id=current_user.id,
            title="📅 Upcoming Meeting in 15 mins",
            message="AI Infrastructure & Architecture Sync starts at 2:00 PM.",
            type="meeting_reminder",
            link_url="/meetings/1"
        ),
        Notification(
            user_id=current_user.id,
            title="⚠️ Task Due Tomorrow",
            message="'Prepare executive demonstration slide deck' is due in 24 hours.",
            type="task_deadline",
            link_url="/tasks"
        ),
        Notification(
            user_id=current_user.id,
            title="🤖 Agentic Follow-up Recommendation",
            message="Agent generated follow-up email digest and identified 2 high-priority actions.",
            type="follow_up",
            link_url="/automation"
        )
    ]
    for n in demo_notifs:
        db.add(n)
    db.commit()
    return {"success": True, "count": len(demo_notifs)}
