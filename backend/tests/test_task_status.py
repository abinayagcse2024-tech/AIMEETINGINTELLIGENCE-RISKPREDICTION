import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

def test_task():
    client = TestClient(app)
    login_res = client.post("/api/v1/auth/login", json={
        "email": "alex.rivera@enterprise.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    tasks = client.get("/api/v1/tasks/", headers=headers).json()
    print("Initial total tasks:", len(tasks))
    for t in tasks:
        print(f"Task #{t['id']}: '{t['title'][:30]}' -> status: {t['status']}")
    
    t0 = tasks[0]
    print(f"\nUpdating Task #{t0['id']} to 'completed'...")
    upd_res = client.put(f"/api/v1/tasks/{t0['id']}", json={"status": "completed"}, headers=headers)
    print("Update status code:", upd_res.status_code)
    print("Updated data status:", upd_res.json().get("status"))
    
    # Fetch again
    tasks_after = client.get("/api/v1/tasks/", headers=headers).json()
    completed = [t for t in tasks_after if t["status"] == "completed"]
    print("Completed tasks count in DB:", len(completed))

if __name__ == "__main__":
    test_task()
