import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Meeting Intelligence"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-token-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    
    # Database URL: Supports MySQL by default, with automatic SQLite fallback for zero-friction setup
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./meeting_intelligence.db"
    )
    
    # Upload folder for recordings and audio
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    
    # ML Models folder
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml")
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]
    
    # n8n Webhook default endpoint
    DEFAULT_N8N_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "https://primary-production-webhook.n8n.cloud/webhook/meeting-intelligence-action")

    # Email & SMTP Settings (Gmail, Outlook, SendGrid, etc.)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "notifications@meetingintel.ai")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "AI Meeting Intelligence")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)
