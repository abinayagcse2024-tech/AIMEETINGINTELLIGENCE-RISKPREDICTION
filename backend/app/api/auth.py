from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, GoogleAuthRequest
from app.schemas.common import Token
import random
from datetime import datetime, timedelta, timezone
from google.oauth2 import id_token
from google.auth.transport import requests
from app.core.config import settings
import secrets
import string
# In-memory store for reset tokens: {email: {"token": token, "expires": datetime}}
reset_tokens = {}


router = APIRouter(prefix="/auth", tags=["Module 1: Authentication & Role Management"])

@router.post("/register", response_model=Token)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
    
    # Auto-assign admin role for first user or designated admin emails
    role = user_in.role or "user"
    if db.query(User).count() == 0:
        role = "admin"

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=role,
        job_title=user_in.job_title or "Team Member",
        department=user_in.department or "Engineering",
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.name}",
        preferences={"theme": "dark", "email_notifications": True, "task_reminders": True}
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=new_user.id, role=new_user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "avatar_url": new_user.avatar_url,
            "job_title": new_user.job_title,
            "department": new_user.department
        }
    }

@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
            "job_title": user.job_title,
            "department": user.department
        }
    }

import httpx

@router.post("/google", response_model=Token)
def google_login(auth_req: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        email = None
        name = "Google User"
        avatar_url = ""

        # Check if it's an ID token (JWT has 3 parts) or an access token
        if auth_req.credential.count('.') == 2:
            # Verify the ID token with Google
            idinfo = id_token.verify_oauth2_token(
                auth_req.credential, requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            email = idinfo.get("email")
            name = idinfo.get("name", "Google User")
            avatar_url = idinfo.get("picture", "")
        else:
            # Treat as access_token and fetch user profile
            resp = httpx.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {auth_req.credential}"})
            if resp.status_code != 200:
                raise ValueError(f"Invalid Google access token: {resp.text}")
            
            user_info = resp.json()
            email = user_info.get("email")
            name = user_info.get("name", "Google User")
            avatar_url = user_info.get("picture", "")
            
        if not email:
            raise HTTPException(status_code=400, detail="Google token does not contain an email")
            
        user = db.query(User).filter(User.email == email).first()
        
        # If user doesn't exist, create them
        if not user:
            # Generate a random strong password since they use Google
            alphabet = string.ascii_letters + string.digits + string.punctuation
            random_password = ''.join(secrets.choice(alphabet) for i in range(20))
            
            role = "user"
            if db.query(User).count() == 0:
                role = "admin"
                
            user = User(
                name=name,
                email=email,
                hashed_password=get_password_hash(random_password),
                role=role,
                job_title="Team Member",
                department="Engineering",
                avatar_url=avatar_url,
                preferences={"theme": "dark", "email_notifications": True, "task_reminders": True}
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        token = create_access_token(subject=user.id, role=user.role)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "avatar_url": user.avatar_url,
                "job_title": user.job_title,
                "department": user.department
            }
        }
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout_user():
    return {"success": True, "message": "Successfully logged out"}


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address"
        )
    
    # Generate 6-digit verification code
    token = "".join(random.choices("0123456789", k=6))
    
    # Save token in-memory with a 15-minute expiration
    reset_tokens[request.email] = {
        "token": token,
        "expires": datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    
    # In development/local env, print to terminal and also return it in the response for convenience
    print(f"\n===================================================\n[PASSWORD RESET] Code for {request.email}: {token}\n===================================================\n")
    
    return {
        "success": True, 
        "message": "Password reset code sent. Please check your email (or see console/response in demo mode).",
        "dev_token": token
    }


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # Verify token exists and is valid
    stored_info = reset_tokens.get(request.email)
    if not stored_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No reset code requested or code has expired"
        )
    
    # Check expiration
    if datetime.now(timezone.utc) > stored_info["expires"]:
        reset_tokens.pop(request.email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one."
        )
    
    # Check token match
    if stored_info["token"] != request.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset code"
        )
    
    # Update user's password
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    # Clean up the used token
    reset_tokens.pop(request.email, None)
    
    return {
        "success": True,
        "message": "Password has been reset successfully. You can now log in with your new password."
    }

