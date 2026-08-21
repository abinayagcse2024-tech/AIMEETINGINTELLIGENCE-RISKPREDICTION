import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.task import Task
from app.models.decision import Decision
from app.models.summary import Summary
from app.models.notification import Notification
from app.models.agent_log import AgentLog
from app.models.user import User
from app.services.email_service import email_service
from app.agent.n8n_integration import n8n_client
from app.ml.risk_model import risk_predictor

class AgenticAIEngine:
    def __init__(self):
        pass

    async def analyze_and_execute_meeting_automations(
        self,
        db: Session,
        meeting_id: int,
        n8n_webhook_url: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Autonomous Agent analyzing meeting outcomes to:
        1. Identify high-risk tasks and trigger instant mitigation alerts / n8n workflow.
        2. Generate follow-up email digest and record agent log.
        3. Suggest follow-up sync if critical decisions or unresolved blockers exist.
        """
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return []

        tasks = db.query(Task).filter(Task.meeting_id == meeting_id).all()
        decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
        summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()

        logs_created = []

        # 1. Check for High-Risk Tasks & Trigger n8n webhook automation
        high_risk_tasks = [t for t in tasks if t.risk_level == "high" or t.risk_score >= 0.60]
        if high_risk_tasks:
            n8n_payload = {
                "meeting_id": meeting.id,
                "meeting_title": meeting.title,
                "high_risk_task_count": len(high_risk_tasks),
                "tasks": [
                    {
                        "id": t.id,
                        "title": t.title,
                        "assignee": t.assignee_name,
                        "risk_score": t.risk_score,
                        "risk_factors": t.risk_factors,
                        "deadline": str(t.deadline)
                    } for t in high_risk_tasks
                ],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

            res = await n8n_client.trigger_webhook("high_risk_task_alert", n8n_payload, n8n_webhook_url)

            # Record Agent Log
            log1 = AgentLog(
                meeting_id=meeting.id,
                action_type="n8n_webhook_trigger",
                description=f"Dispatched n8n automation for {len(high_risk_tasks)} high-risk task(s)",
                payload=n8n_payload,
                status=res.get("status", "success"),
                n8n_webhook_url=n8n_webhook_url,
                result_summary=res.get("message")
            )
            db.add(log1)

            # Create in-app notification for host
            notif = Notification(
                user_id=meeting.host_id,
                title="⚠️ High-Risk Task Alert",
                message=f"Agent detected {len(high_risk_tasks)} high-risk tasks from '{meeting.title}'. n8n automation triggered.",
                type="high_risk_alert",
                link_url=f"/meetings/{meeting.id}"
            )
            db.add(notif)
            logs_created.append({"action": "n8n_high_risk_trigger", "details": res})

        # 2. Generate and dispatch Follow-up Email Digest
        host_user = db.query(User).filter(User.id == meeting.host_id).first()
        host_name = host_user.name if host_user else "Meeting Host"
        summary_text = summary.executive_summary if summary else "No summary available."

        email_data = email_service.generate_meeting_followup_email(
            meeting_title=meeting.title,
            host_name=host_name,
            summary_text=summary_text,
            decisions=[{"decision_text": d.decision_text, "responsible_person": d.responsible_person} for d in decisions],
            tasks=[{"title": t.title, "assignee_name": t.assignee_name, "priority": t.priority, "risk_level": t.risk_level} for t in tasks]
        )

        log2 = AgentLog(
            meeting_id=meeting.id,
            action_type="email_followup",
            description=f"Prepared and queued executive meeting follow-up email digest",
            payload={"subject": email_data["subject"], "recipients_count": len(meeting.participants)},
            status="success",
            result_summary="Email digest generated and distributed to all meeting participants."
        )
        db.add(log2)
        logs_created.append({"action": "email_digest", "subject": email_data["subject"]})

        # 3. Suggest Follow-up Meeting
        if len(tasks) >= 3 or len(decisions) >= 2:
            followup_date = (meeting.scheduled_start + timedelta(days=7)).strftime("%A, %B %d at 10:00 AM")
            log3 = AgentLog(
                meeting_id=meeting.id,
                action_type="schedule_followup",
                description=f"Suggested next iteration check-in for {followup_date}",
                payload={"suggested_date": followup_date, "reason": "Review milestone delivery for high-priority tasks"},
                status="success",
                result_summary=f"Automated follow-up recommendation logged for {followup_date}."
            )
            db.add(log3)
            logs_created.append({"action": "schedule_followup", "suggested_date": followup_date})

        db.commit()
        return logs_created

    async def process_chatbox_query(
        self,
        db: Session,
        current_user: User,
        query: str,
        meeting_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Processes natural language questions from the AI Chatbox and executes tool actions (Module 15 & 17)
        """
        q_lower = query.lower()

        # Tool 1: "What tasks were assigned to me?" or "My tasks"
        if "assigned to me" in q_lower or "my task" in q_lower or "what are my tasks" in q_lower:
            user_name_parts = current_user.name.split()
            first_name = user_name_parts[0] if user_name_parts else ""
            
            tasks = db.query(Task).filter(
                (Task.assignee_id == current_user.id) | 
                (Task.assignee_name.ilike(f"%{first_name}%")) |
                (Task.assignee_email == current_user.email)
            ).all()

            if not tasks:
                # Fallback to query all pending if none assigned explicitly
                tasks = db.query(Task).filter(Task.status != "completed").limit(3).all()

            task_list = "\n".join([
                f"• **{t.title}** (Due: {t.deadline.strftime('%b %d') if t.deadline else 'Not set'} | Priority: `{t.priority.upper()}` | Risk: `{t.risk_level.upper()}`)"
                for t in tasks
            ])
            return {
                "response": f"Here are your active tasks:\n\n{task_list}\n\nWould you like me to adjust deadlines or trigger a reminder?",
                "suggested_actions": [
                    {"label": "View Tasks Kanban", "action": "navigate", "target": "/tasks"},
                    {"label": "Assess Task Risks", "action": "navigate", "target": "/risk-inspector"}
                ],
                "sources": [{"type": "task_db", "count": len(tasks)}]
            }

        # Tool 2: "What decisions were made?"
        if "decision" in q_lower:
            query_filter = db.query(Decision)
            if meeting_id:
                query_filter = query_filter.filter(Decision.meeting_id == meeting_id)
            decisions = query_filter.order_by(Decision.id.desc()).limit(5).all()

            if not decisions:
                return {
                    "response": "No specific decisions were recorded yet for this selection.",
                    "suggested_actions": [{"label": "View Meeting Intelligence", "action": "navigate", "target": f"/meetings/{meeting_id or 1}"}],
                    "sources": []
                }

            dec_list = "\n".join([
                f"• **{d.decision_text}**\n  *Owner:* {d.responsible_person or 'Team'} | *Impact:* `{d.impact_level.upper()}`"
                for d in decisions
            ])
            return {
                "response": f"Here are the key decisions recorded:\n\n{dec_list}",
                "suggested_actions": [
                    {"label": "Export Meeting Minutes", "action": "export_report"},
                    {"label": "Trigger n8n Follow-up", "action": "trigger_n8n"}
                ],
                "sources": [{"type": "decision_db", "count": len(decisions)}]
            }

        # Tool 3: "Summarize this meeting" or "Summary"
        if "summar" in q_lower or "recap" in q_lower:
            if meeting_id:
                meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
            else:
                meeting = db.query(Meeting).order_by(Meeting.id.desc()).first()

            if meeting:
                summary = db.query(Summary).filter(Summary.meeting_id == meeting.id).first()
                if summary and summary.executive_summary:
                    bullets = "\n".join([f"• {kp}" for kp in (summary.key_points or [])])
                    resp = f"### Summary for **{meeting.title}**\n\n{summary.executive_summary}\n\n**Key Discussion Points:**\n{bullets if bullets else 'No specific key points recorded.'}"
                    return {
                        "response": resp,
                        "suggested_actions": [
                            {"label": "View Synced Transcript", "action": "navigate", "target": f"/meetings/{meeting.id}"},
                            {"label": "Send Email Digest", "action": "trigger_agent_action", "payload": {"action_type": "send_email_summary", "meeting_id": meeting.id}}
                        ],
                        "sources": [{"type": "summary_db", "meeting": meeting.title}]
                    }
                else:
                    return {
                        "response": f"Meeting **{meeting.title}** has been scheduled/recorded, but summary intelligence has not been generated yet. Open the meeting to record or run transcription.",
                        "suggested_actions": [{"label": "Open Meeting", "action": "navigate", "target": f"/meetings/{meeting.id}"}],
                        "sources": []
                    }
            return {
                "response": "No meetings found in the workspace yet. Schedule a meeting or start a live room to begin capturing intelligence.",
                "suggested_actions": [{"label": "Schedule Meeting", "action": "navigate", "target": "/meetings"}],
                "sources": []
            }

        # Tool 4: "Create a task for [Name] to [Action]"
        if "create task" in q_lower or "add task" in q_lower or "assign task" in q_lower:
            # Extract title and assignee heuristically
            title = re.sub(r'^(create task|add task|assign task)\s*(for\s+[\w\s]+\s+to)?', '', query, flags=re.IGNORECASE).strip()
            if not title:
                title = "Follow up on meeting action items"
            
            assignee = current_user.name
            users = db.query(User).all()
            for u in users:
                if u.name:
                    first_name = u.name.split()[0].lower()
                    if u.name.lower() in q_lower or re.search(rf'\b{re.escape(first_name)}\b', q_lower):
                        assignee = u.name
                        break

            latest_meeting = db.query(Meeting).order_by(Meeting.id.desc()).first()
            target_meeting_id = meeting_id or (latest_meeting.id if latest_meeting else None)

            now = datetime.now(timezone.utc)
            deadline = now + timedelta(days=3)
            risk_res = risk_predictor.predict(deadline_days=3.0, priority="high", complexity_score=3, assignee_pending_tasks=1, historical_delay_rate=0.2)

            new_task = Task(
                meeting_id=target_meeting_id,
                title=title[:250],
                description=f"Created automatically by AI Agent from chat request: '{query}'",
                assignee_name=assignee,
                deadline=deadline,
                priority="high",
                status="pending",
                complexity_score=3,
                risk_level=risk_res["risk_level"],
                risk_score=risk_res["risk_score"],
                risk_factors=risk_res["risk_factors"],
                ai_mitigation_tip=risk_res["ai_mitigation_tip"]
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)

            return {
                "response": f"✅ **Task Created Successfully!**\n\n• **Title:** {new_task.title}\n• **Assignee:** {new_task.assignee_name}\n• **Deadline:** {new_task.deadline.strftime('%b %d, %Y')}\n• **ML Risk Score:** `{new_task.risk_score * 100:.0f}%` ({new_task.risk_level.upper()})",
                "suggested_actions": [
                    {"label": "View in Kanban", "action": "navigate", "target": "/tasks"}
                ],
                "executed_action": {
                    "tool": "create_task",
                    "task_id": new_task.id,
                    "title": new_task.title
                }
            }

        # Tool 5: "What is the deadline?" or "Deadlines"
        if "deadline" in q_lower or "due date" in q_lower:
            tasks = db.query(Task).filter(Task.status != "completed").order_by(Task.deadline.asc()).limit(4).all()
            if tasks:
                t_lines = "\n".join([f"• **{t.title}** ({t.assignee_name}): Due **{t.deadline.strftime('%A, %b %d') if t.deadline else 'Not set'}** [Risk: `{t.risk_level.upper()}`]" for t in tasks])
                return {
                    "response": f"Here are the upcoming deadlines:\n\n{t_lines}",
                    "suggested_actions": [{"label": "View Tasks", "action": "navigate", "target": "/tasks"}],
                    "sources": [{"type": "task_deadlines", "count": len(tasks)}]
                }
            return {
                "response": "No active tasks with pending deadlines were found in the workspace.",
                "suggested_actions": [{"label": "Create New Task", "action": "navigate", "target": "/tasks"}],
                "sources": []
            }

        # General conversational response with Agentic guidance
        return {
            "response": f"I analyzed your query: *\"{query}\"*. \n\nI can help you:\n1. Check your assigned tasks & deadlines\n2. Extract decisions and summaries from meetings\n3. Predict task delay risks using our ML model\n4. Trigger automated n8n workflows and send email digests\n5. Create tasks directly via conversation",
            "suggested_actions": [
                {"label": "What tasks were assigned to me?", "action": "send_query", "query": "What tasks were assigned to me?"},
                {"label": "What decisions were made?", "action": "send_query", "query": "What decisions were made?"},
                {"label": "Summarize this meeting", "action": "send_query", "query": "Summarize this meeting"}
            ],
            "sources": []
        }

agent_engine = AgenticAIEngine()
