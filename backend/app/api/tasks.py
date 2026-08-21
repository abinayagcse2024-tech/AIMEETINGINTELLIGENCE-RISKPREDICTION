from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task
from app.schemas.intelligence import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.pagination import PaginatedResponse, paginate
from app.ml.risk_model import risk_predictor

router = APIRouter(prefix="/tasks", tags=["Module 10: Task Management & Status Tracking"])

@router.get("/", response_model=PaginatedResponse[TaskResponse])
def get_tasks(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    risk_filter: Optional[str] = None,
    assignee_filter: Optional[str] = None,
    meeting_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    if risk_filter:
        query = query.filter(Task.risk_level == risk_filter)
    if assignee_filter:
        query = query.filter(Task.assignee_name.ilike(f"%{assignee_filter}%"))
    if meeting_id:
        query = query.filter(Task.meeting_id == meeting_id)

    query = query.order_by(Task.deadline.asc().nulls_last(), Task.created_at.desc())
    items, total, total_pages = paginate(query, page, page_size)
    return {"data": items, "page": page, "page_size": page_size, "total": total, "total_pages": total_pages}

@router.post("/", response_model=TaskResponse)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Calculate initial ML risk score
    now = datetime.now(timezone.utc)
    deadline_days = 3.0
    if task_in.deadline:
        deadline_days = max(0.1, (task_in.deadline.replace(tzinfo=timezone.utc) - now).total_seconds() / 86400.0)

    # Count pending tasks for this assignee
    pending_cnt = db.query(Task).filter(
        Task.assignee_name == task_in.assignee_name,
        Task.status != "completed"
    ).count()

    risk_res = risk_predictor.predict(
        deadline_days=deadline_days,
        priority=task_in.priority or "medium",
        complexity_score=task_in.complexity_score or 3,
        assignee_pending_tasks=pending_cnt,
        historical_delay_rate=0.25
    )

    task = Task(
        meeting_id=task_in.meeting_id,
        assignee_id=task_in.assignee_id,
        title=task_in.title,
        description=task_in.description,
        assignee_name=task_in.assignee_name,
        assignee_email=task_in.assignee_email,
        deadline=task_in.deadline,
        priority=task_in.priority or "medium",
        status=task_in.status or "pending",
        complexity_score=task_in.complexity_score or 3,
        risk_level=risk_res["risk_level"],
        risk_score=risk_res["risk_score"],
        risk_factors=risk_res["risk_factors"],
        ai_mitigation_tip=risk_res["ai_mitigation_tip"]
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.assignee_name is not None:
        task.assignee_name = task_update.assignee_name
    if task_update.deadline is not None:
        task.deadline = task_update.deadline
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.complexity_score is not None:
        task.complexity_score = task_update.complexity_score
    if task_update.status is not None:
        task.status = task_update.status
        if task_update.status == "completed":
            task.completed_at = datetime.now(timezone.utc)
        else:
            task.completed_at = None

    # Re-evaluate ML risk if active and not completed
    if task.status != "completed":
        now = datetime.now(timezone.utc)
        deadline_days = 3.0
        if task.deadline:
            d_time = task.deadline if task.deadline.tzinfo is not None else task.deadline.replace(tzinfo=timezone.utc)
            deadline_days = max(0.1, (d_time - now).total_seconds() / 86400.0)

        pending_cnt = db.query(Task).filter(
            Task.assignee_name == task.assignee_name,
            Task.status != "completed",
            Task.id != task.id
        ).count()

        risk_res = risk_predictor.predict(
            deadline_days=deadline_days,
            priority=task.priority,
            complexity_score=task.complexity_score,
            assignee_pending_tasks=pending_cnt,
            historical_delay_rate=0.25
        )
        task.risk_level = risk_res["risk_level"]
        task.risk_score = risk_res["risk_score"]
        task.risk_factors = risk_res["risk_factors"]
        task.ai_mitigation_tip = risk_res["ai_mitigation_tip"]

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"success": True, "message": f"Task {task_id} deleted"}
