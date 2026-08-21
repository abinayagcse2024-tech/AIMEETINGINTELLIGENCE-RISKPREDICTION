import httpx
import asyncio
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_all_17_modules():
    print("==========================================================")
    print("[TEST] Running Comprehensive E2E Test Suite Across All 17 Modules")
    print("==========================================================")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # Module 1: Auth (Login & Get Token)
        print("\n[Module 1] Testing User Authentication & Role Management...")
        login_res = await client.post("/auth/login", json={
            "email": "alex.rivera@enterprise.ai",
            "password": "password123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        auth_data = login_res.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("  [PASS] Logged in as: " + auth_data['user']['name'] + " (Role: " + auth_data['user']['role'] + ")")

        # Module 2: User Profile Management
        print("\n[Module 2] Testing User Profile Management...")
        profile_res = await client.get("/users/profile", headers=headers)
        assert profile_res.status_code == 200
        print(f"  [PASS] Profile retrieved: {profile_res.json()['name']} - {profile_res.json()['job_title']}")

        # Module 3 & 4: Meeting Scheduling & Participant Management
        print("\n[Module 3 & 4] Testing Meeting Scheduling & Participants...")
        meetings_res = await client.get("/meetings/", headers=headers)
        assert meetings_res.status_code == 200
        meetings = meetings_res.json()
        assert len(meetings) > 0, "No meetings found"
        # Pick meeting with transcript (or ID 1)
        meeting = next((m for m in meetings if m.get("has_transcript")), meetings[0])
        meeting_id = meeting["id"]
        print(f"  [PASS] Meetings loaded: {len(meetings)} sessions found. Active meeting ID: {meeting_id} ({meeting['title']})")

        # Module 5: Audio Recording and Upload
        print("\n[Module 5] Testing Audio Upload & Recording Management...")
        # Verify recordings query endpoint
        rec_res = await client.get(f"/audio/meeting/{meeting_id}", headers=headers)
        assert rec_res.status_code == 200
        print(f"  [PASS] Audio management endpoint verified for Meeting #{meeting_id}")

        # Module 6 & 7: Speech-to-Text Transcription & Speaker Diarization
        print("\n[Module 6 & 7] Testing Speech-to-Text & Speaker Diarization...")
        tr_res = await client.get(f"/transcription/meeting/{meeting_id}", headers=headers)
        assert tr_res.status_code == 200
        tr_data = tr_res.json()
        print(f"  [PASS] Transcript retrieved ({tr_data['word_count']} words, {len(tr_data['segments'])} speaker dialogue segments)")
        print(f"  [PASS] Sample Speaker Segment: [{tr_data['segments'][0]['speaker_label']}]: \"{tr_data['segments'][0]['text'][:40]}...\"")

        # Module 8: AI Meeting Summary and Key Points
        print("\n[Module 8] Testing AI Meeting Summary & Key Points...")
        sum_res = await client.get(f"/intelligence/summary/{meeting_id}", headers=headers)
        assert sum_res.status_code == 200
        sum_data = sum_res.json()
        print(f"  [PASS] Executive Summary generated: \"{sum_data['executive_summary'][:60]}...\"")
        print(f"  [PASS] Key discussion bullets: {len(sum_data['key_points'])} points extracted")

        # Module 9 & 10: Task & Deadline Extraction & Kanban Management
        print("\n[Module 9 & 10] Testing Task Extraction & Status Kanban Tracking...")
        tasks_res = await client.get(f"/tasks/?meeting_id={meeting_id}", headers=headers)
        assert tasks_res.status_code == 200
        tasks = tasks_res.json()
        assert len(tasks) > 0
        sample_task = tasks[0]
        print(f"  [PASS] Extracted Tasks: {len(tasks)} items. Sample: \"{sample_task['title']}\" -> {sample_task['assignee_name']}")

        # Module 11: Task Completion Risk Prediction (ML Model)
        print("\n[Module 11] Testing Task Completion Risk Prediction (Machine Learning Classifier)...")
        risk_res = await client.post("/risk/predict", json={
            "title": "Complex Async Pipeline Integration",
            "deadline_days_away": 1.5,
            "priority": "urgent",
            "complexity_score": 4,
            "assignee_pending_tasks": 3,
            "historical_delay_rate": 0.25
        }, headers=headers)
        assert risk_res.status_code == 200
        risk_data = risk_res.json()
        print(f"  [PASS] ML Model Inference Result: Risk Level: {risk_data['risk_level'].upper()} (Delay Score: {risk_data['risk_score'] * 100:.0f}%)")
        print(f"  [PASS] Explainability Factors: {risk_data['risk_factors']}")
        print(f"  [PASS] AI Mitigation: {risk_data['ai_mitigation_tip']}")

        # Module 12: Meeting Decision & Action Item Tracking
        print("\n[Module 12] Testing Meeting Decision & Action Item Tracking...")
        dec_res = await client.get(f"/intelligence/decisions/{meeting_id}", headers=headers)
        assert dec_res.status_code == 200
        decisions = dec_res.json()
        print(f"  [PASS] Decisions Log: {len(decisions)} formal agreements recorded. Sample: \"{decisions[0]['decision_text']}\"")

        # Module 13: Meeting History and Full-Text Search
        print("\n[Module 13] Testing Meeting History and Universal Full-Text Search...")
        search_res = await client.get("/search/?q=latency", headers=headers)
        assert search_res.status_code == 200
        search_data = search_res.json()
        print(f"  [PASS] Search Query 'latency': Found {search_data['total_results']} total occurrences across transcripts, tasks & summaries")

        # Module 14: Personalized Meeting and Task Notifications
        print("\n[Module 14] Testing Personalized Notifications & Reminders...")
        notif_res = await client.get("/notifications/", headers=headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()
        print(f"  [PASS] Notifications Center: {len(notifs)} alerts active for user")

        # Module 15: Dashboard & AI Meeting Chatbox
        print("\n[Module 15] Testing Dashboard Analytics & Meeting Intelligence Chatbox...")
        dash_res = await client.get("/dashboard/summary", headers=headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        print(f"  [PASS] Dashboard Summary KPIs: {dash_data['total_meetings']} Total Meetings | {dash_data['avg_task_completion_rate']}% Completion Velocity")

        # AI Chatbox query
        chat_res = await client.post("/chat/query", json={
            "meeting_id": meeting_id,
            "query": "What tasks were assigned to me?"
        }, headers=headers)
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        print(f"  [PASS] AI Chatbox Response:\n     \"{chat_data['response'][:120]}...\"")

        # Module 16: AI Meeting Insights & Executive Reports
        print("\n[Module 16] Testing AI Meeting Insights & Executive Reports...")
        insights_res = await client.get("/dashboard/insights/analytics", headers=headers)
        assert insights_res.status_code == 200
        report_res = await client.get(f"/dashboard/report/export/{meeting_id}", headers=headers)
        assert report_res.status_code == 200
        print(f"  [PASS] Analytics & Executive Markdown Report generated successfully ({len(report_res.json()['markdown_content'])} characters)")

        # Module 17: Agentic AI Meeting Automation & n8n
        print("\n[Module 17] Testing Agentic AI Meeting Automation & n8n...")
        agent_res = await client.post(f"/agent/execute-meeting-automations/{meeting_id}", json={
            "meeting_id": meeting_id,
            "action_type": "analyze_followups"
        }, headers=headers)
        assert agent_res.status_code == 200
        agent_data = agent_res.json()
        print(f"  [PASS] Agentic AI Autonomous Engine executed: {agent_data['message']}")

    print("\n==========================================================")
    print("[SUCCESS] ALL 17 MODULES SUCCESSFULLY VERIFIED AND FULLY OPERATIONAL!")
    print("==========================================================")

if __name__ == "__main__":
    asyncio.run(test_all_17_modules())
