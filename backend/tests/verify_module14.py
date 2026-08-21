import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

def test_module_14():
    client = TestClient(app)
    
    # 1. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "alex.rivera@enterprise.ai",
        "password": "password123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 14.0 Authentication successful")

    # 2. Get Notifications
    res = client.get("/api/v1/notifications/", headers=headers)
    assert res.status_code == 200
    notifs = res.json()
    print(f"[PASS] 14.1 GET /notifications/ -> {res.status_code} ({len(notifs)} notifications)")

    # 3. Trigger Demo Alerts
    trigger_res = client.post("/api/v1/notifications/trigger-demo-alerts", headers=headers)
    assert trigger_res.status_code == 200
    count = trigger_res.json().get("count", 0)
    print(f"[PASS] 14.2 POST /notifications/trigger-demo-alerts -> {trigger_res.status_code} (Generated {count} alerts)")

    # 4. Mark Single as Read
    res2 = client.get("/api/v1/notifications/", headers=headers)
    first_id = res2.json()[0]["id"]
    read_res = client.put(f"/api/v1/notifications/{first_id}/read", headers=headers)
    assert read_res.status_code == 200
    assert read_res.json()["read"] is True
    print(f"[PASS] 14.3 PUT /notifications/{first_id}/read -> {read_res.status_code} (read=True)")

    # 5. Mark All Read
    read_all_res = client.put("/api/v1/notifications/read-all", headers=headers)
    assert read_all_res.status_code == 200
    print(f"[PASS] 14.4 PUT /notifications/read-all -> {read_all_res.status_code}")

    # 6. Verify unread query filter
    unread_res = client.get("/api/v1/notifications/?unread_only=true", headers=headers)
    assert unread_res.status_code == 200
    assert len(unread_res.json()) == 0
    print(f"[PASS] 14.5 GET /notifications/?unread_only=true -> {unread_res.status_code} (unread count = 0)")

    print("\n[SUCCESS] Module 14 is 100% OPERATIONAL and ALL TESTS PASSED!")

if __name__ == "__main__":
    test_module_14()
