from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str
    job_title: Optional[str] = "Team Member"
    department: Optional[str] = "General"
    avatar_url: Optional[str] = None
    role: Optional[str] = "user"
    preferences: Optional[Dict[str, Any]] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class GoogleAuthRequest(BaseModel):
    credential: str
