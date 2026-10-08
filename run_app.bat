@echo off
cd /d "%~dp0"
echo ===================================================
echo   AI Meeting Intelligence Full-Stack Platform
echo ===================================================
echo Starting FastAPI Backend ^& React Frontend...

if exist ".venv\Scripts\python.exe" (
    start "MeetIntel Backend (FastAPI)" cmd /k "cd backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
) else (
    start "MeetIntel Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
)

timeout /t 2 /nobreak >nul
start "MeetIntel Frontend (Vite React)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Applications Launching:
echo   Backend API:   http://127.0.0.1:8000
echo   API Docs:      http://127.0.0.1:8000/docs
echo   Frontend Web:  http://localhost:5173
echo ===================================================

