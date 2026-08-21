import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.ml.risk_model import risk_predictor
from app.core.security import get_password_hash
from app.core.database import SessionLocal
from app.api import api_router
from app.models.user import User

# Create database tables
Base.metadata.create_all(bind=engine)

# Dynamically alter table to add speaker_mappings column if not exists
try:
    with engine.begin() as conn:
        # Check dialect to execute correct raw SQL
        if engine.name == "sqlite":
            conn.execute("ALTER TABLE transcripts ADD COLUMN speaker_mappings JSON;")
        else:
            conn.execute("ALTER TABLE transcripts ADD COLUMN speaker_mappings JSON NULL;")
        print("[INFO] Added speaker_mappings column to transcripts table.")
except Exception as e:
    # Column already exists or other database-specific reason, safe to ignore
    pass

# Ensure initial default admin account exists
try:
    _db = SessionLocal()
    if _db.query(User).count() == 0:
        _admin = User(
            name="System Admin",
            email="admin@meetintel.ai",
            hashed_password=get_password_hash("password123"),
            role="user",
            job_title="Lead Administrator",
            department="Operations",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            preferences={"theme": "dark", "email_notifications": True, "task_reminders": True}
        )
        _db.add(_admin)
        _db.commit()
        print("[INFO] Created initial Admin: admin@meetintel.ai / password123")
    _db.close()
except Exception as e:
    print(f"Warning checking admin user: {e}")

# Pre-train / load ML model
try:
    risk_predictor._load_or_train()
except Exception as e:
    print(f"Warning initializing ML model: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-Stack AI Meeting Intelligence Platform with 17 Modules (Speech-to-Text, NLP, ML Risk Prediction, Agentic Automation, n8n)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Explicit origins required for credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All 17 Module API Routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount uploads directory for audio recordings
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "modules_count": 17,
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Meeting Intelligence Core"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
