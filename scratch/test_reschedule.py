import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, r"c:\Users\abina\OneDrive\Desktop\MINI PROJECT\backend")

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.core.security import create_access_token

client = TestClient(app)

def run_tests():
    db = SessionLocal()
    try:
        # Get admin user
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            admin = db.query(User).first()
        assert admin is not None, "No user found in database!"

        token = create_access_token(subject=admin.id, role=admin.role)
        headers = {"Authorization": f"Bearer {token}"}

        print(f"[TEST] Authenticated as {admin.name} ({admin.email})")

        # 1. Test GET /meetings/?status_filter=missed
        res = client.get("/api/v1/meetings/?status_filter=missed", headers=headers)
        assert res.status_code == 200, f"Failed GET /meetings/?status_filter=missed: {res.text}"
        missed_meetings = res.json()
        print(f"[PASS] GET /meetings/?status_filter=missed returned {len(missed_meetings)} meeting(s)")

        # Find or create a test meeting
        test_meeting = db.query(Meeting).first()
        assert test_meeting is not None, "No meetings found in database!"
        meeting_id = test_meeting.id

        # 2. Test PUT attendance
        part = db.query(Participant).filter(Participant.meeting_id == meeting_id).first()
        if part:
            res_att = client.put(
                f"/api/v1/meetings/{meeting_id}/participants/{part.id}/attendance",
                headers=headers,
                json={"attended": False}
            )
            assert res_att.status_code == 200, f"Attendance update failed: {res_att.text}"
            print(f"[PASS] PUT attendance updated participant {part.name} to attended=False: {res_att.json()}")

        # 3. Test POST /meetings/{id}/request-reschedule (Attendee request to host)
        res_req = client.post(
            f"/api/v1/meetings/{meeting_id}/request-reschedule",
            headers=headers,
            json={
                "proposed_start": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
                "reason": "Attendee was absent due to urgent client incident",
                "notes": "Please schedule for Thursday afternoon if possible"
            }
        )
        assert res_req.status_code == 200, f"Request reschedule failed: {res_req.text}"
        print(f"[PASS] POST /meetings/{meeting_id}/request-reschedule: {res_req.json()}")

        # 4. Test POST /meetings/{id}/reschedule (Direct Reschedule)
        new_start = datetime.now(timezone.utc) + timedelta(days=1, hours=2)
        res_resched = client.post(
            f"/api/v1/meetings/{meeting_id}/reschedule",
            headers=headers,
            json={
                "new_scheduled_start": new_start.isoformat(),
                "reason": "Missed previous session - Team sync rebooted",
                "meeting_url": "https://meet.google.com/rescheduled-test-link",
                "additional_notes": "All attendees please review updated project roadmap prior to sync",
                "send_notifications": True,
                "send_emails": True,
                "create_as_new_meeting": False
            }
        )
        assert res_resched.status_code == 200, f"Reschedule failed: {res_resched.text}"
        resched_data = res_resched.json()
        print(f"[PASS] POST /meetings/{meeting_id}/reschedule: {resched_data['message']}")
        assert resched_data["meeting"]["status"] == "scheduled"

        # 5. Test Dashboard summary includes missed_meetings
        res_dash = client.get("/api/v1/dashboard/summary", headers=headers)
        assert res_dash.status_code == 200, f"Dashboard summary failed: {res_dash.text}"
        dash_data = res_dash.json()
        assert "missed_meetings" in dash_data, "missed_meetings key missing from dashboard summary!"
        print(f"[PASS] GET /dashboard/summary contains missed_meetings: {dash_data['missed_meetings']}")

        print("\n🎉 ALL RESCHEDULE & MISSED MEETING ENDPOINT TESTS PASSED SUCCESSFULLY!")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
