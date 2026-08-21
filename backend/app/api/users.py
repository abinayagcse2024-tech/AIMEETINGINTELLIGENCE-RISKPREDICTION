from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Module 2: User Profile Management"])

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.job_title is not None:
        current_user.job_title = user_update.job_title
    if user_update.department is not None:
        current_user.department = user_update.department
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.preferences is not None:
        current_user.preferences = user_update.preferences
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/", response_model=List[UserResponse])
def list_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List team members for assignment and participant selection"""
    users = db.query(User).all()
    return users
