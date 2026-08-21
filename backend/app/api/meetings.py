from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.recording import Recording
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.task import Task
from app.models.decision import Decision
from app.models.agent_log import AgentLog
from app.models.notification import Notification
from app.services.email_service import email_service
from app.schemas.meeting import (
    MeetingCreate, MeetingUpdate, MeetingResponse, ParticipantCreate, ParticipantResponse,
    MeetingRescheduleRequest, AttendeeRescheduleRequest, ParticipantAttendanceUpdate, SpeakerMappingUpdate
)
from app.schemas.pagination import PaginatedResponse, paginate

router = APIRouter(prefix="/meetings", tags=["Module 3 & 4: Meeting Scheduling & Participants"])

def _hydrate_meeting_response(m: Meeting, db: Session) -> dict:
    has_rec = db.query(Recording).filter(Recording.meeting_id == m.id).first() is not None
    has_tr = db.query(Transcript).filter(Transcript.meeting_id == m.id).first() is not None
    has_sm = db.query(Summary).filter(Summary.meeting_id == m.id).first() is not None
    t_cnt = db.query(Task).filter(Task.meeting_id == m.id).count()
    d_cnt = db.query(Decision).filter(Decision.meeting_id == m.id).count()

    now = datetime.now(timezone.utc)
    is_past_due = (m.scheduled_start.tzinfo is not None and m.scheduled_start < now) or (m.scheduled_start.replace(tzinfo=timezone.utc) < now)
    is_missed = m.status == "missed" or (m.status == "scheduled" and is_past_due)

    return {
        "id": m.id,
        "title": m.title,
        "description": m.description,
        "agenda": m.agenda,
        "scheduled_start": m.scheduled_start,
        "scheduled_end": m.scheduled_end,
        "status": m.status,
        "location": m.location,
        "meeting_url": m.meeting_url,
        "host_id": m.host_id,
        "created_at": m.created_at,
        "participants": m.participants,
        "speaker_mapping": m.speaker_mapping,
        "has_recording": has_rec,
        "has_transcript": has_tr,
        "has_summary": has_sm,
        "tasks_count": t_cnt,
        "decisions_count": d_cnt,
        "is_missed": is_missed
    }

@router.get("/", response_model=PaginatedResponse[MeetingResponse])
def get_meetings(
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    if status_filter == "missed":
        query = db.query(Meeting).filter(
            (Meeting.status == "missed") |
            ((Meeting.status == "scheduled") & (Meeting.scheduled_start < now))
        ).order_by(Meeting.scheduled_start.desc())
    elif status_filter == "scheduled":
        query = db.query(Meeting).filter(
            Meeting.status == "scheduled",
            Meeting.scheduled_start >= now
        ).order_by(Meeting.scheduled_start.asc())
    elif status_filter:
        query = db.query(Meeting).filter(Meeting.status == status_filter).order_by(Meeting.scheduled_start.desc())
    else:
        query = db.query(Meeting).order_by(Meeting.scheduled_start.desc())

    items, total, total_pages = paginate(query, page, page_size)
    hydrated_items = [_hydrate_meeting_response(m, db) for m in items]
    
    return {
        "data": hydrated_items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }

@router.post("/", response_model=MeetingResponse)
def create_meeting(
    meeting_in: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission Denied: Only workspace hosts or administrators can schedule new meetings."
        )

    new_meeting = Meeting(
        title=meeting_in.title,
        description=meeting_in.description,
        agenda=meeting_in.agenda,
        scheduled_start=meeting_in.scheduled_start,
        scheduled_end=meeting_in.scheduled_end,
        status=meeting_in.status or "scheduled",
        location=meeting_in.location or "Online (AI Workspace)",
        meeting_url=meeting_in.meeting_url,
        host_id=current_user.id
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    # Automatically add current user as Host participant
    host_participant = Participant(
        meeting_id=new_meeting.id,
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role="host",
        attended=True
    )
    db.add(host_participant)

    # Add other specified participants
    if meeting_in.participants:
        for p in meeting_in.participants:
            if p.email != current_user.email:
                part = Participant(
                    meeting_id=new_meeting.id,
                    name=p.name,
                    email=p.email,
                    role=p.role or "attendee",
                    attended=p.attended if p.attended is not None else True
                )
                db.add(part)

    db.commit()
    db.refresh(new_meeting)
    return _hydrate_meeting_response(new_meeting, db)

@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting_by_id(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return _hydrate_meeting_response(meeting, db)

@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: int,
    meeting_update: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting_update.title is not None:
        meeting.title = meeting_update.title
    if meeting_update.description is not None:
        meeting.description = meeting_update.description
    if meeting_update.agenda is not None:
        meeting.agenda = meeting_update.agenda
    if meeting_update.scheduled_start is not None:
        meeting.scheduled_start = meeting_update.scheduled_start
    if meeting_update.scheduled_end is not None:
        meeting.scheduled_end = meeting_update.scheduled_end
    if meeting_update.status is not None:
        meeting.status = meeting_update.status
    if meeting_update.location is not None:
        meeting.location = meeting_update.location
    if meeting_update.meeting_url is not None:
        meeting.meeting_url = meeting_update.meeting_url

    db.commit()
    db.refresh(meeting)
    return _hydrate_meeting_response(meeting, db)

@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return {"success": True, "message": f"Meeting {meeting_id} cancelled and deleted"}

@router.put("/{meeting_id}/speaker-mapping")
def update_speaker_mapping(
    meeting_id: int,
    mapping_in: SpeakerMappingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.speaker_mapping = mapping_in.speaker_mapping
    db.commit()
    db.refresh(meeting)
    return {"success": True, "message": "Speaker mapping updated", "speaker_mapping": meeting.speaker_mapping}

# --- Module 4: Participant Endpoints ---
@router.post("/{meeting_id}/participants", response_model=ParticipantResponse)
def add_participant(
    meeting_id: int,
    part_in: ParticipantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    part = Participant(
        meeting_id=meeting_id,
        user_id=part_in.user_id,
        name=part_in.name,
        email=part_in.email,
        role=part_in.role or "attendee",
        attended=part_in.attended if part_in.attended is not None else True
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return part

@router.delete("/{meeting_id}/participants/{participant_id}")
def remove_participant(
    meeting_id: int,
    participant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    part = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_id == meeting_id
    ).first()
    if not part:
        raise HTTPException(status_code=404, detail="Participant not found")

    db.delete(part)
    db.commit()
    return {"success": True, "message": "Participant removed"}

# --- Module 17: Email Follow-Up Digest & High-Risk Alerts Dispatch ---
@router.post("/{meeting_id}/send-email-digest")
def send_meeting_email_digest(
    meeting_id: int,
    payload: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Rule 1: Only Admin can send emails
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only administrators (Admin role) have permission to dispatch meeting intelligence emails."
        )

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # 1. Determine recipients
    custom_recipients = payload.get("recipients", []) if payload else []
    if custom_recipients:
        recipients = custom_recipients
    else:
        recipients = [p.email for p in meeting.participants if p.email]
        if current_user.email and current_user.email not in recipients:
            recipients.append(current_user.email)

    if not recipients:
        recipients = [current_user.email]

    # 2. Gather meeting data
    summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    tasks = db.query(Task).filter(Task.meeting_id == meeting_id).all()

    summary_text = summary.executive_summary if summary else "Discussion and milestones aligned."
    host_name = current_user.name

    # 3. Generate HTML & Plain text email
    email_data = email_service.generate_meeting_followup_email(
        meeting_title=meeting.title,
        host_name=host_name,
        summary_text=summary_text,
        decisions=[{"decision_text": d.decision_text, "responsible_person": d.responsible_person} for d in decisions],
        tasks=[{"title": t.title, "assignee_name": t.assignee_name, "priority": t.priority, "risk_level": t.risk_level} for t in tasks]
    )

    # 4. Dispatch email
    dispatch_res = email_service.send_email(
        recipient_emails=recipients,
        subject=email_data["subject"],
        html_content=email_data["html"],
        text_content=email_data["text"]
    )

    # 5. Record in Agent Logs
    agent_log = AgentLog(
        meeting_id=meeting.id,
        action_type="email_followup",
        description=f"Admin {current_user.name} sent meeting follow-up email digest to {len(recipients)} attendee(s)",
        payload={"recipients": recipients, "subject": email_data["subject"]},
        status="success",
        result_summary=dispatch_res.get("message")
    )
    db.add(agent_log)
    db.commit()

    return {
        "success": True,
        "message": dispatch_res.get("message"),
        "recipients": recipients,
        "subject": email_data["subject"],
        "email_preview": email_data["text"]
    }

@router.post("/{meeting_id}/send-high-risk-alerts")
def send_meeting_high_risk_alerts(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module 17: Admin sends targeted High-Risk Mitigation Alerts directly to the specific assigned persons.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only administrators have permission to dispatch high-risk alert emails."
        )

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    tasks = db.query(Task).filter(Task.meeting_id == meeting_id).all()
    high_risk_tasks = [t for t in tasks if t.risk_level == "high" or (t.risk_score or 0) >= 0.60]

    if not high_risk_tasks:
        return {
            "success": True,
            "message": "No high-risk tasks detected for this meeting. All tasks are currently on track.",
            "dispatched_count": 0,
            "alerts": []
        }

    dispatched = []
    for t in high_risk_tasks:
        # Determine assignee email
        assignee_email = t.assignee_email
        if not assignee_email:
            for p in meeting.participants:
                if p.name and t.assignee_name and (p.name.lower() in t.assignee_name.lower() or t.assignee_name.lower() in p.name.lower()):
                    assignee_email = p.email
                    break
        if not assignee_email:
            assignee_email = current_user.email

        risk_pct = int((t.risk_score or 0.85) * 100)
        deadline_str = t.deadline.strftime("%A, %B %d, %Y") if t.deadline else "Within 48 hours"

        email_data = email_service.generate_high_risk_alert_email(
            meeting_title=meeting.title,
            host_name=current_user.name,
            task_title=t.title,
            assignee_name=t.assignee_name or "Assignee",
            deadline_str=deadline_str,
            risk_score_pct=risk_pct,
            risk_factors=t.risk_factors or ["Tight delivery timeline", "High technical complexity"],
            mitigation_tip=t.ai_mitigation_tip or "Reassign sub-tasks and hold a 15-minute unblocker sync."
        )

        dispatch_res = email_service.send_email(
            recipient_emails=[assignee_email],
            subject=email_data["subject"],
            html_content=email_data["html"],
            text_content=email_data["text"]
        )

        # Target User In-App Notification
        target_user = db.query(User).filter(User.email == assignee_email).first()
        if target_user:
            notif = Notification(
                user_id=target_user.id,
                title="⚠️ High-Risk Task Assigned to You",
                message=f"Admin {current_user.name} sent you a High Risk Alert for '{t.title[:50]}'. Please review mitigations.",
                type="high_risk_alert",
                link_url=f"/meetings/{meeting.id}"
            )
            db.add(notif)

        # Agent Audit Log
        agent_log = AgentLog(
            meeting_id=meeting.id,
            action_type="high_risk_email_alert",
            description=f"Admin {current_user.name} dispatched High Risk Alert email to {t.assignee_name} ({assignee_email}) for task #{t.id}",
            payload={"task_id": t.id, "assignee_email": assignee_email, "risk_score": risk_pct},
            status="success",
            result_summary=f"High risk alert delivered to {assignee_email}"
        )
        db.add(agent_log)

        dispatched.append({
            "task_id": t.id,
            "task_title": t.title,
            "assignee_name": t.assignee_name,
            "assignee_email": assignee_email,
            "risk_score": f"{risk_pct}% HIGH",
            "message": dispatch_res.get("message")
        })

    db.commit()

    return {
        "success": True,
        "message": f"Successfully dispatched {len(dispatched)} high-risk alert email(s) directly to the assigned person(s).",
        "dispatched_count": len(dispatched),
        "alerts": dispatched
    }

# --- Module 3 & 4: Meeting Rescheduling & Missed Meeting Request ---
@router.post("/{meeting_id}/reschedule")
def reschedule_meeting(
    meeting_id: int,
    payload: MeetingRescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reschedule a missed or previous meeting session with new start time, video link, attendee invites,
    and automatic in-app notification + email dispatch.
    """
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    new_start = payload.new_scheduled_start
    new_end = payload.new_scheduled_end
    reason = payload.reason or "Missed previous scheduled meeting session"
    meeting_url = payload.meeting_url if payload.meeting_url is not None else meeting.meeting_url
    location = payload.location if payload.location is not None else meeting.location
    notes = payload.additional_notes

    # Mode 1: Clone as a new linked follow-up session
    if payload.create_as_new_meeting:
        target_meeting = Meeting(
            title=f"{meeting.title} (Rescheduled)",
            description=meeting.description,
            agenda=meeting.agenda,
            scheduled_start=new_start,
            scheduled_end=new_end,
            status="scheduled",
            location=location,
            meeting_url=meeting_url,
            host_id=meeting.host_id
        )
        db.add(target_meeting)
        db.commit()
        db.refresh(target_meeting)

        # Clone participants
        for p in meeting.participants:
            new_p = Participant(
                meeting_id=target_meeting.id,
                user_id=p.user_id,
                name=p.name,
                email=p.email,
                role=p.role,
                attended=True
            )
            db.add(new_p)
        db.commit()
        db.refresh(target_meeting)
    else:
        # Mode 2: Update existing meeting and reset status to scheduled
        target_meeting = meeting
        target_meeting.scheduled_start = new_start
        target_meeting.scheduled_end = new_end
        target_meeting.status = "scheduled"
        if payload.meeting_url:
            target_meeting.meeting_url = payload.meeting_url
        if payload.location:
            target_meeting.location = payload.location
        db.commit()
        db.refresh(target_meeting)

    formatted_time = new_start.strftime("%A, %B %d, %Y at %I:%M %p")

    # Determine recipient emails
    if payload.participant_emails and len(payload.participant_emails) > 0:
        recipient_emails = [e.strip() for e in payload.participant_emails if e.strip()]
    else:
        recipient_emails = [p.email for p in target_meeting.participants if p.email]
        host_user = db.query(User).filter(User.id == target_meeting.host_id).first()
        if host_user and host_user.email and host_user.email not in recipient_emails:
            recipient_emails.append(host_user.email)

    # 1. In-App Notifications
    if payload.send_notifications:
        for email in recipient_emails:
            user_match = db.query(User).filter(User.email == email).first()
            if user_match:
                notif = Notification(
                    user_id=user_match.id,
                    title=f"🔄 Meeting Rescheduled: {target_meeting.title}",
                    message=f"{current_user.name} rescheduled the missed session to {formatted_time}. Reason: {reason}",
                    type="meeting_rescheduled",
                    link_url=f"/meetings/{target_meeting.id}"
                )
                db.add(notif)

    # 2. Email Notifications
    email_dispatch_res = None
    if payload.send_emails and recipient_emails:
        host_user = db.query(User).filter(User.id == target_meeting.host_id).first()
        host_name = host_user.name if host_user else current_user.name

        email_data = email_service.generate_rescheduled_meeting_email(
            meeting_title=target_meeting.title,
            host_name=host_name,
            rescheduled_by_name=current_user.name,
            new_start_time_str=formatted_time,
            reason=reason,
            meeting_url=target_meeting.meeting_url,
            location=target_meeting.location,
            notes=notes
        )

        email_dispatch_res = email_service.send_email(
            recipient_emails=recipient_emails,
            subject=email_data["subject"],
            html_content=email_data["html"],
            text_content=email_data["text"]
        )

    # 3. Agent Audit Trail
    agent_log = AgentLog(
        meeting_id=target_meeting.id,
        action_type="meeting_rescheduled",
        description=f"{current_user.name} rescheduled meeting '{target_meeting.title}' to {formatted_time}. Reason: {reason}",
        payload={
            "original_meeting_id": meeting.id,
            "target_meeting_id": target_meeting.id,
            "new_start": new_start.isoformat(),
            "reason": reason,
            "recipients": recipient_emails,
            "mode": "new_session" if payload.create_as_new_meeting else "updated_existing"
        },
        status="success",
        result_summary=f"Meeting successfully rescheduled to {formatted_time}. Dispatched invites to {len(recipient_emails)} attendee(s)."
    )
    db.add(agent_log)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully rescheduled meeting to {formatted_time}",
        "meeting": _hydrate_meeting_response(target_meeting, db),
        "recipient_count": len(recipient_emails),
        "email_status": email_dispatch_res.get("message") if email_dispatch_res else "In-app notifications sent"
    }

@router.post("/{meeting_id}/request-reschedule")
def request_reschedule_meeting(
    meeting_id: int,
    payload: AttendeeRescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows an attendee who missed the meeting to request the Host to reschedule a new session.
    """
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    proposed_time_str = payload.proposed_start.strftime("%A, %B %d, %Y at %I:%M %p") if payload.proposed_start else "Flexible / Next Available Slot"
    reason = payload.reason or "Missed previous scheduled meeting session"

    # Send Notification to Meeting Host
    host_user = db.query(User).filter(User.id == meeting.host_id).first()
    if host_user:
        notif = Notification(
            user_id=host_user.id,
            title=f"📩 Reschedule Request: {meeting.title}",
            message=f"{current_user.name} missed '{meeting.title}' and requested to reschedule for {proposed_time_str}. Reason: {reason}",
            type="reschedule_request",
            link_url=f"/meetings/{meeting.id}"
        )
        db.add(notif)

    # Send Email to Host
    if host_user and host_user.email:
        email_data = email_service.generate_missed_meeting_request_email(
            meeting_title=meeting.title,
            host_name=host_user.name,
            requester_name=current_user.name,
            proposed_time_str=proposed_time_str,
            reason=reason,
            notes=payload.notes
        )
        email_service.send_email(
            recipient_emails=[host_user.email],
            subject=email_data["subject"],
            html_content=email_data["html"],
            text_content=email_data["text"]
        )

    # Agent Log
    agent_log = AgentLog(
        meeting_id=meeting.id,
        action_type="meeting_reschedule_requested",
        description=f"{current_user.name} submitted a reschedule request to Host {host_user.name if host_user else 'Host'} for '{meeting.title}'",
        payload={
            "requester": current_user.name,
            "requester_email": current_user.email,
            "proposed_time": proposed_time_str,
            "reason": reason
        },
        status="success",
        result_summary=f"Reschedule request delivered to host {host_user.email if host_user else ''}"
    )
    db.add(agent_log)
    db.commit()

    return {
        "success": True,
        "message": f"Reschedule request successfully sent to meeting host ({host_user.name if host_user else 'Host'})."
    }

@router.put("/{meeting_id}/participants/{participant_id}/attendance")
def update_participant_attendance(
    meeting_id: int,
    participant_id: int,
    attendance_in: ParticipantAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle or update attendance for a participant (Attended / Missed).
    """
    part = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_id == meeting_id
    ).first()
    if not part:
        raise HTTPException(status_code=404, detail="Participant not found")

    part.attended = attendance_in.attended
    db.commit()
    db.refresh(part)
    return {
        "success": True,
        "participant_id": part.id,
        "name": part.name,
        "attended": part.attended,
        "message": f"Updated attendance for {part.name} to {'Attended' if part.attended else 'Missed'}"
    }



@router.get('/{meeting_id}/participants', response_model=PaginatedResponse[ParticipantResponse])
def get_meeting_participants(meeting_id: int, page: int = 1, page_size: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Participant).filter(Participant.meeting_id == meeting_id)
    items, total, total_pages = paginate(query, page, page_size)
    return {'data': items, 'page': page, 'page_size': page_size, 'total': total, 'total_pages': total_pages}

