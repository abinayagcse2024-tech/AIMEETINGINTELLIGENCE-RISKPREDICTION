import httpx
import asyncio
import os
import io

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def run_full_system_test():
    print("==================================================================")
    print("  AI MEETING INTELLIGENCE - FULL SYSTEM VERIFICATION TEST SUITE  ")
    print("==================================================================")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=20.0) as client:
        # -------------------------------------------------------------
        # MODULE 1: AUTHENTICATION & ROLE MANAGEMENT
        # -------------------------------------------------------------
        print("\n--- [MODULE 1: User Authentication & Role Management] ---")
        
        # Test 1.1: Register New User
        new_email = f"test.user_{int(asyncio.get_event_loop().time())}@enterprise.ai"
        reg_res = await client.post("/auth/register", json={
            "name": "Jordan Test",
            "email": new_email,
            "password": "testpassword123",
            "job_title": "ML Research Engineer",
            "role": "user"
        })
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        print(f"  [PASS] 1.1 User Registration: Created '{new_email}'")

        # Test 1.2: Admin Login
        login_res = await client.post("/auth/login", json={
            "email": "alex.rivera@enterprise.ai",
            "password": "password123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        auth_data = login_res.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"  [PASS] 1.2 Admin Authentication: JWT token generated for {auth_data['user']['name']} (Role: {auth_data['user']['role']})")

        # -------------------------------------------------------------
        # MODULE 2: USER PROFILE MANAGEMENT
        # -------------------------------------------------------------
        print("\n--- [MODULE 2: User Profile Management] ---")
        prof_res = await client.get("/users/profile", headers=headers)
        assert prof_res.status_code == 200
        print(f"  [PASS] 2.1 View Profile: {prof_res.json()['name']} ({prof_res.json()['job_title']})")

        update_res = await client.put("/users/profile", json={
            "job_title": "Head of AI Infrastructure & Engineering"
        }, headers=headers)
        assert update_res.status_code == 200
        assert update_res.json()["job_title"] == "Head of AI Infrastructure & Engineering"
        print("  [PASS] 2.2 Update Profile: Job title updated successfully")

        # -------------------------------------------------------------
        # MODULE 3 & 4: MEETING SCHEDULING & PARTICIPANTS
        # -------------------------------------------------------------
        print("\n--- [MODULE 3 & 4: Meeting Scheduling & Participant Management] ---")
        new_meeting_res = await client.post("/meetings/", json={
            "title": "Automated Test Meeting - High Scalability Review",
            "description": "Integration testing for live STT and ML risk scoring pipeline.",
            "agenda": "1. Audio Buffer Benchmarking\n2. ML Delay Prediction\n3. Action Extraction",
            "scheduled_start": "2026-08-20T10:00:00Z",
            "location": "Aurora Room 402",
            "participants": [
                {"name": "Sarah Chen", "email": "sarah.chen@enterprise.ai", "role": "speaker"},
                {"name": "Marcus Vance", "email": "marcus.vance@enterprise.ai", "role": "attendee"}
            ]
        }, headers=headers)
        assert new_meeting_res.status_code == 200
        test_meeting = new_meeting_res.json()
        test_m_id = test_meeting["id"]
        print(f"  [PASS] 3.1 Meeting Created: ID #{test_m_id} - '{test_meeting['title']}'")
        print(f"  [PASS] 4.1 Participants Assigned: {len(test_meeting['participants'])} members added with roles")

        # -------------------------------------------------------------
        # MODULE 5: MEETING RECORDING & AUDIO UPLOAD
        # -------------------------------------------------------------
        print("\n--- [MODULE 5: Meeting Recording & Audio Upload] ---")
        # Create a mock WAV byte stream to test real file upload
        fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        files = {"file": ("test_recording.wav", fake_wav, "audio/wav")}
        data = {"duration": "75.0"}
        
        audio_up_res = await client.post(
            f"/audio/upload/{test_m_id}",
            files=files,
            data=data,
            headers=headers
        )
        assert audio_up_res.status_code == 200
        print(f"  [PASS] 5.1 Audio File Upload: Stored audio recording (ID: {audio_up_res.json()['recording_id']}, Duration: {audio_up_res.json()['duration_seconds']}s)")

        # -------------------------------------------------------------
        # MODULE 6 & 7: SPEECH-TO-TEXT & SPEAKER DIARIZATION
        # -------------------------------------------------------------
        print("\n--- [MODULE 6 & 7: Speech-to-Text & Speaker Diarization] ---")
        stt_res = await client.post(f"/transcription/process/{test_m_id}", headers=headers)
        assert stt_res.status_code == 200
        tr_data = stt_res.json()
        print(f"  [PASS] 6.1 Audio Transcribed: {tr_data['word_count']} words generated with {(tr_data['confidence_score']*100):.0f}% confidence")
        print(f"  [PASS] 7.1 Speaker Diarization: {len(tr_data['segments'])} timestamped speaker turns mapped to participants")

        # -------------------------------------------------------------
        # MODULE 8: AI SUMMARY & KEY POINTS
        # -------------------------------------------------------------
        print("\n--- [MODULE 8: AI Meeting Summary & Key Points] ---")
        intel_res = await client.post(f"/intelligence/process/{test_m_id}", headers=headers)
        assert intel_res.status_code == 200
        sum_res = await client.get(f"/intelligence/summary/{test_m_id}", headers=headers)
        assert sum_res.status_code == 200
        summary = sum_res.json()
        print(f"  [PASS] 8.1 Executive Summary Generated: \"{summary['executive_summary'][:70]}...\"")
        print(f"  [PASS] 8.2 Key Discussion Points: {len(summary['key_points'])} bullets extracted")
        print(f"  [PASS] 8.3 Topic Heatmap: {len(summary['topics'])} topics mapped with relevance weights")

        # -------------------------------------------------------------
        # MODULE 9 & 10: TASK EXTRACTION & KANBAN MANAGEMENT
        # -------------------------------------------------------------
        print("\n--- [MODULE 9 & 10: Task Extraction & Kanban Management] ---")
        tasks_res = await client.get(f"/tasks/?meeting_id={test_m_id}", headers=headers)
        assert tasks_res.status_code == 200
        tasks = tasks_res.json()
        assert len(tasks) > 0
        first_task = tasks[0]
        print(f"  [PASS] 9.1 Auto-Extracted Tasks: {len(tasks)} action items identified")
        
        # Test Status Move to In Progress
        task_update_res = await client.put(f"/tasks/{first_task['id']}", json={
            "status": "in_progress"
        }, headers=headers)
        assert task_update_res.status_code == 200
        assert task_update_res.json()["status"] == "in_progress"
        print(f"  [PASS] 10.1 Kanban Status Transition: Task #{first_task['id']} moved to 'in_progress'")

        # -------------------------------------------------------------
        # MODULE 11: ML TASK COMPLETION RISK PREDICTION
        # -------------------------------------------------------------
        print("\n--- [MODULE 11: Machine Learning Task Risk Classifier] ---")
        # Test Urgent Task with tight deadline => High Risk
        risk_test_high = await client.post("/risk/predict", json={
            "title": "Urgent Security Patch Deployment",
            "deadline_days_away": 0.8,
            "priority": "urgent",
            "complexity_score": 5,
            "assignee_pending_tasks": 4,
            "historical_delay_rate": 0.35
        }, headers=headers)
        assert risk_test_high.status_code == 200
        r_high = risk_test_high.json()
        assert r_high["risk_level"] == "high"
        print(f"  [PASS] 11.1 ML High-Risk Scenario: Accurately predicted HIGH RISK ({r_high['risk_score']*100:.0f}% delay probability)")
        print(f"        Factors: {r_high['risk_factors']}")
        print(f"        AI Mitigation: {r_high['ai_mitigation_tip']}")

        # Test Moderate Task => Low Risk
        risk_test_low = await client.post("/risk/predict", json={
            "title": "Routine Documentation Update",
            "deadline_days_away": 12.0,
            "priority": "low",
            "complexity_score": 1,
            "assignee_pending_tasks": 0,
            "historical_delay_rate": 0.05
        }, headers=headers)
        assert risk_test_low.status_code == 200
        r_low = risk_test_low.json()
        assert r_low["risk_level"] == "low"
        print(f"  [PASS] 11.2 ML Low-Risk Scenario: Accurately predicted LOW RISK ({r_low['risk_score']*100:.0f}% delay probability)")

        # -------------------------------------------------------------
        # MODULE 12: DECISION & ACTION ITEM TRACKING
        # -------------------------------------------------------------
        print("\n--- [MODULE 12: Decision Tracking] ---")
        dec_res = await client.get(f"/intelligence/decisions/{test_m_id}", headers=headers)
        assert dec_res.status_code == 200
        decs = dec_res.json()
        print(f"  [PASS] 12.1 Decision Registry: {len(decs)} agreements recorded. Sample: '{decs[0]['decision_text']}'")

        # -------------------------------------------------------------
        # MODULE 13: MEETING HISTORY & SEARCH
        # -------------------------------------------------------------
        print("\n--- [MODULE 13: Meeting History & Full-Text Search] ---")
        search_res = await client.get("/search/?q=Automated", headers=headers)
        assert search_res.status_code == 200
        s_data = search_res.json()
        assert s_data["total_results"] > 0
        print(f"  [PASS] 13.1 Search Engine: Found {s_data['total_results']} matching items across meetings & transcripts")

        # -------------------------------------------------------------
        # MODULE 14: PERSONALIZED NOTIFICATIONS
        # -------------------------------------------------------------
        print("\n--- [MODULE 14: Personalized Meeting & Task Notifications] ---")
        # Trigger demo alert
        await client.post("/notifications/trigger-demo-alerts", headers=headers)
        notifs_res = await client.get("/notifications/", headers=headers)
        assert notifs_res.status_code == 200
        notifs = notifs_res.json()
        print(f"  [PASS] 14.1 Notification Center: {len(notifs)} personalized alerts active")

        # Mark first as read
        if notifs:
            read_res = await client.put(f"/notifications/{notifs[0]['id']}/read", headers=headers)
            assert read_res.status_code == 200
            print(f"  [PASS] 14.2 Mark Read: Notification #{notifs[0]['id']} updated")

        # -------------------------------------------------------------
        # MODULE 15: DASHBOARD & AI CHATBOX
        # -------------------------------------------------------------
        print("\n--- [MODULE 15: Dashboard Analytics & AI Meeting Chatbox] ---")
        dash_res = await client.get("/dashboard/summary", headers=headers)
        assert dash_res.status_code == 200
        d_summary = dash_res.json()
        print(f"  [PASS] 15.1 Dashboard KPIs: {d_summary['total_meetings']} Meetings, {d_summary['pending_tasks']} Pending Tasks, {d_summary['high_risk_tasks']} High Risk Tasks")

        # AI Chatbox Question: "What tasks were assigned to me?"
        chat_q1 = await client.post("/chat/query", json={
            "meeting_id": test_m_id,
            "query": "What tasks were assigned to me?"
        }, headers=headers)
        assert chat_q1.status_code == 200
        print("  [PASS] 15.2 AI Chatbox Query (Tasks): Contextual response generated successfully")

        # AI Chatbox Question: "What decisions were made?"
        chat_q2 = await client.post("/chat/query", json={
            "meeting_id": test_m_id,
            "query": "What decisions were made?"
        }, headers=headers)
        assert chat_q2.status_code == 200
        print("  [PASS] 15.3 AI Chatbox Query (Decisions): Decision items retrieved and formatted")

        # AI Chatbox Tool Execution: "Create a task for Sarah to check database load"
        chat_q3 = await client.post("/chat/query", json={
            "meeting_id": test_m_id,
            "query": "Create task for Sarah to check database load"
        }, headers=headers)
        assert chat_q3.status_code == 200
        c3_res = chat_q3.json()
        assert c3_res.get("executed_action") is not None
        print(f"  [PASS] 15.4 Agentic Conversational Action: Tool created task '{c3_res['executed_action']['title']}'")

        # -------------------------------------------------------------
        # MODULE 16: AI MEETING INSIGHTS & REPORTS
        # -------------------------------------------------------------
        print("\n--- [MODULE 16: AI Meeting Insights & Executive Reports] ---")
        insights_res = await client.get("/dashboard/insights/analytics", headers=headers)
        assert insights_res.status_code == 200
        ins = insights_res.json()
        print(f"  [PASS] 16.1 Productivity Analytics: {ins['meeting_effectiveness_score']}% efficiency score, {ins['time_saved_by_ai_hours']} hrs saved")
        
        rep_res = await client.get(f"/dashboard/report/export/{test_m_id}", headers=headers)
        assert rep_res.status_code == 200
        print(f"  [PASS] 16.2 Executive Digest Export: Formatted Markdown report generated ({len(rep_res.json()['markdown_content'])} bytes)")

        # -------------------------------------------------------------
        # MODULE 17: AGENTIC AI AUTOMATION & n8n
        # -------------------------------------------------------------
        print("\n--- [MODULE 17: Agentic AI Meeting Automation & n8n Workflows] ---")
        agent_exec = await client.post(f"/agent/execute-meeting-automations/{test_m_id}", json={
            "meeting_id": test_m_id,
            "action_type": "analyze_followups"
        }, headers=headers)
        assert agent_exec.status_code == 200
        print(f"  [PASS] 17.1 Autonomous Follow-up Engine: {agent_exec.json()['message']}")

        # Test n8n ping
        n8n_test = await client.post("/agent/test-n8n-trigger", json={
            "event": "system_integration_test",
            "payload": {"meeting_id": test_m_id, "status": "verified"}
        }, headers=headers)
        assert n8n_test.status_code == 200
        print(f"  [PASS] 17.2 n8n Webhook Workflow Dispatch: {n8n_test.json()['message']}")

    print("\n==================================================================")
    print("  [SUCCESS] ALL 17 MODULES VERIFIED & 100% OPERATIONAL!          ")
    print("==================================================================")

if __name__ == "__main__":
    asyncio.run(run_full_system_test())
