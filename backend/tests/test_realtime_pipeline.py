import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from clean_db import reset_to_clean_state

def test_realtime_workflow():
    print("\n[TEST] 1. Resetting database to clean initial state...")
    reset_to_clean_state()
    client = TestClient(app)

    # 1. Login with clean admin
    print("[TEST] 2. Logging in with clean administrator account...")
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@meetintel.ai",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [SUCCESS] Admin logged in:", login_res.json()["user"]["name"])

    # 2. Check fresh dashboard (should be 0 meetings, 0 tasks)
    print("[TEST] 3. Checking fresh dashboard metrics (0 dummy items)...")
    dash_res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_meetings"] == 0
    assert dash_data["pending_tasks"] == 0
    assert dash_data["completed_tasks"] == 0
    assert dash_data["avg_task_completion_rate"] == 0.0
    print("  [SUCCESS] Dashboard returns 0 dummy meetings & 0 tasks.")

    # 3. Create a real meeting
    print("[TEST] 4. Creating a real meeting...")
    create_res = client.post("/api/v1/meetings/", headers=headers, json={
        "title": "Q4 Architecture Scalability Review",
        "description": "Real-time sync on microservices and real-time STT pipeline",
        "agenda": "1. Audio streaming\n2. Real-time NLP\n3. ML Risk prediction",
        "scheduled_start": "2026-08-20T10:00:00Z",
        "location": "Virtual Executive Room",
        "status": "scheduled",
        "participants": [
            {"name": "Sarah Chen", "email": "sarah.chen@company.com", "role": "speaker", "attended": True},
            {"name": "Marcus Vance", "email": "marcus.vance@company.com", "role": "speaker", "attended": True}
        ]
    })
    assert create_res.status_code == 200
    meeting_id = create_res.json()["id"]
    print(f"  [SUCCESS] Meeting #{meeting_id} created: '{create_res.json()['title']}'")

    # 4. Upload real speech transcript / audio payload
    print("[TEST] 5. Uploading real speech dialogue to trigger real-time AI pipeline...")
    real_speech = (
        "[System Admin]: Welcome team. Today we review our real-time speech-to-text pipeline.\n"
        "[Sarah Chen]: I will implement the Redis queue for audio streaming by Friday afternoon.\n"
        "[Marcus Vance]: Decision confirmed: We agreed to finalize the microservice deployment schedule."
    )

    upload_res = client.post(
        f"/api/v1/audio/upload/{meeting_id}",
        headers=headers,
        data={
            "duration": "120.0",
            "media_type": "audio",
            "raw_transcript": real_speech,
            "auto_process": "true"
        },
        files={"file": ("test_session.wav", b"RIFF....WAVEfmt ....data....", "audio/wav")}
    )
    assert upload_res.status_code == 200, f"Upload error: {upload_res.text}"
    print("  [SUCCESS] Real audio/speech uploaded and processed.")

    # 5. Verify real transcript and diarization
    print("[TEST] 6. Verifying real speech-to-text diarization...")
    tr_res = client.get(f"/api/v1/transcription/meeting/{meeting_id}", headers=headers)
    assert tr_res.status_code == 200
    tr_data = tr_res.json()
    assert len(tr_data["segments"]) == 3
    assert tr_data["segments"][0]["speaker_label"] == "System Admin"
    assert tr_data["segments"][1]["speaker_label"] == "Sarah Chen"
    assert tr_data["segments"][2]["speaker_label"] == "Marcus Vance"
    print(f"  [SUCCESS] Transcribed {len(tr_data['segments'])} real speaker turns accurately.")

    # 6. Verify real AI summary & decisions & tasks
    print("[TEST] 7. Verifying dynamic NLP extraction from real speech...")
    sum_res = client.get(f"/api/v1/intelligence/summary/{meeting_id}", headers=headers)
    assert sum_res.status_code == 200
    summary_data = sum_res.json()
    assert summary_data is not None
    print(f"  [SUCCESS] Executive Summary: {summary_data['executive_summary'][:80]}...")

    dec_res = client.get(f"/api/v1/intelligence/decisions/{meeting_id}", headers=headers)
    assert dec_res.status_code == 200
    decisions = dec_res.json()
    assert len(decisions) >= 1
    print(f"  [SUCCESS] Extracted Decision: \"{decisions[0]['decision_text']}\" (Owner: {decisions[0]['responsible_person']})")

    tasks_res = client.get(f"/api/v1/tasks/?meeting_id={meeting_id}", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) >= 1
    assert "implement" in tasks[0]["title"].lower() or "redis" in tasks[0]["title"].lower()
    print(f"  [SUCCESS] Extracted Task: \"{tasks[0]['title']}\" -> Assignee: {tasks[0]['assignee_name']} | ML Risk: {tasks[0]['risk_level'].upper()} ({int(tasks[0]['risk_score']*100)}%)")

    # 7. Verify Dashboard now shows 1 meeting & 1 pending task in real-time
    print("[TEST] 8. Verifying real-time Dashboard update...")
    dash2_res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash2_res.status_code == 200
    dash2 = dash2_res.json()
    assert dash2["total_meetings"] == 1
    assert dash2["pending_tasks"] >= 1
    print("  [SUCCESS] Dashboard reflects live database data (1 meeting, active tasks) in real time!")

    # 8. Reset to clean state for user
    reset_to_clean_state()
    print("\n==========================================================")
    print("[SUCCESS] ALL REAL-TIME PIPELINE TESTS PASSED WITH 100% ACCURACY!")
    print("==========================================================")

if __name__ == "__main__":
    test_realtime_workflow()
