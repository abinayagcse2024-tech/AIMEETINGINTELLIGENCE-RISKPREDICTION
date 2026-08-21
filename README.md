# 🚀 AI Meeting Intelligence — Enterprise Full-Stack Platform

An advanced, production-grade **AI Meeting Intelligence** application designed with **React.js**, **FastAPI**, **MySQL / SQLAlchemy**, **Speech-to-Text & Diarization**, **Machine Learning Task Risk Prediction**, and **Agentic AI Automation (n8n Webhooks)**.

---

## 🌟 17 Modules Breakdown

1. **User Authentication & Role Management**: Secure JWT authentication, password hashing (`bcrypt`), and RBAC (`admin`, `user`).
2. **User Profile Management**: Profile customization, job title, department, avatar, and notification settings.
3. **Meeting Scheduling & Management**: Full CRUD meeting management, agenda builder, calendar/list view, status management (`scheduled`, `in_progress`, `completed`, `cancelled`).
4. **Meeting Participant Management**: Add/remove attendees, assign participant roles (Host, Speaker, Attendee), and attendance tracking.
5. **Meeting Recording & Audio Upload**: Browser live microphone recorder with real-time HTML5 Canvas waveform visualizer, MP3/WAV file uploads, and persistent audio storage.
6. **Speech-to-Text Transcription**: Audio-to-text transcription engine with timestamping and 1-click `.TXT` / `.VTT` export.
7. **Speaker Identification & Diarization**: Multi-speaker separation, sentiment analysis tags, and speaker-to-participant mapping.
8. **AI Meeting Summary & Key Points**: Executive summaries, bulleted discussion notes, and topic relevance heatmaps.
9. **Task & Deadline Extraction**: Automated extraction of action items, assignees, deadlines, and priorities from dialogues.
10. **Task Management & Status Tracking**: Interactive Kanban Board (Pending, In Progress, Completed) with drag-and-drop / click-to-move workflow.
11. **Task Completion Risk Prediction (ML)**: Scikit-Learn Random Forest model scoring delay risk (`Low`, `Medium`, `High`), probability gauges, and explainable risk factor attributions.
12. **Meeting Decision & Action Item Tracking**: Formal decision registry with owners, impact levels, and review statuses.
13. **Meeting History & Search**: Instant full-text search across transcripts, meetings, decisions, and tasks with search-term highlighting.
14. **Personalized Notifications**: Real-time in-app notification center bell with unread badges and proactive delay alerts.
15. **Dashboard, Analytics & Meeting Intelligence Chatbox**: Executive KPI metrics, 7-day volume trends, and conversational AI Chatbox with preset query chips and tool actions.
16. **AI Meeting Insights & Reports**: Productivity analytics, speaker talk-time distribution, and 1-click PDF / Markdown report export.
17. **🤖 Agentic AI Meeting Automation**: Autonomous decision analyzer, follow-up scheduler, email digest generator, and n8n webhook dispatcher.

---

## 🛠️ Quick Start Guide

### 1. Backend (FastAPI + Python)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

### 3. One-Click Launch (Windows)
Double-click `run_app.bat` to launch both servers simultaneously!

---

## ⚡ Default Administrator Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | System Admin | `admin@meetintel.ai` | `password123` |

> *Tip: You can also register new user accounts directly through the registration screen.*
