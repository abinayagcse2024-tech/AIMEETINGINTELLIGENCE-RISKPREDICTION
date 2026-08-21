from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.meetings import router as meetings_router
from app.api.audio import router as audio_router
from app.api.transcription import router as transcription_router
from app.api.intelligence import router as intelligence_router
from app.api.tasks import router as tasks_router
from app.api.risk import router as risk_router
from app.api.search import router as search_router
from app.api.notifications import router as notifications_router
from app.api.dashboard import router as dashboard_router
from app.api.chat import router as chat_router
from app.api.agent import router as agent_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(meetings_router)
api_router.include_router(audio_router)
api_router.include_router(transcription_router)
api_router.include_router(intelligence_router)
api_router.include_router(tasks_router)
api_router.include_router(risk_router)
api_router.include_router(search_router)
api_router.include_router(notifications_router)
api_router.include_router(dashboard_router)
api_router.include_router(chat_router)
api_router.include_router(agent_router)
