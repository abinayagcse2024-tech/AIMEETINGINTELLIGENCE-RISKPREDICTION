import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "meeting_intelligence.db")

def view_stored_data():
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] Database file not found at: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("=" * 65)
    print("       AI MEETING INTELLIGENCE - STORED DATABASE VIEWER        ")
    print("=" * 65)

    # 1. USERS
    print("\n[TABLE: users]")
    cursor.execute("SELECT id, name, email, role, job_title FROM users")
    users = cursor.fetchall()
    for u in users:
        print(f"  ID #{u[0]} | {u[1]} ({u[2]}) | Role: {u[3]} | Title: {u[4]}")

    # 2. MEETINGS
    print("\n[TABLE: meetings]")
    cursor.execute("SELECT id, title, status, scheduled_start, location, meeting_url FROM meetings")
    meetings = cursor.fetchall()
    for m in meetings:
        print(f"  Meeting #{m[0]}: \"{m[1]}\"")
        print(f"    Status: {m[2]} | Start: {m[3]} | Room: {m[4]}")
        if m[5]:
            print(f"    Video URL: {m[5]}")

    # 3. TRANSCRIPTS & DIARIZATION
    print("\n[TABLE: transcripts & transcript_segments]")
    cursor.execute("SELECT id, meeting_id, word_count, confidence_score FROM transcripts")
    transcripts = cursor.fetchall()
    for t in transcripts:
        print(f"  Transcript #{t[0]} for Meeting #{t[1]}: {t[2]} words (Confidence: {int((t[3] or 0.96)*100)}%)")
        cursor.execute("SELECT speaker_label, start_time, end_time, text, sentiment FROM transcript_segments WHERE transcript_id = ? LIMIT 3", (t[0],))
        segs = cursor.fetchall()
        for s in segs:
            print(f"    [{s[1]}s - {s[2]}s] {s[0]}: \"{s[3][:50]}...\" (Sentiment: {s[4]})")

    # 4. SUMMARIES & DECISIONS
    print("\n[TABLE: summaries & decisions]")
    cursor.execute("SELECT id, meeting_id, executive_summary FROM summaries")
    summaries = cursor.fetchall()
    for sm in summaries:
        print(f"  Summary for Meeting #{sm[1]}: \"{sm[2][:80]}...\"")

    cursor.execute("SELECT id, meeting_id, decision_text, responsible_person, impact_level FROM decisions LIMIT 4")
    decisions = cursor.fetchall()
    for d in decisions:
        print(f"  Decision #{d[0]} (Meeting #{d[1]}): \"{d[2][:60]}\" -> Owner: {d[3]} [{d[4].upper()}]")

    # 5. TASKS & ML RISK SCORES
    print("\n[TABLE: tasks (With Scikit-Learn ML Risk Predictions)]")
    cursor.execute("SELECT id, meeting_id, title, assignee_name, priority, status, risk_level, risk_score FROM tasks")
    tasks = cursor.fetchall()
    for tk in tasks:
        score_pct = int((tk[7] or 0.15) * 100)
        print(f"  Task #{tk[0]} (Meeting #{tk[1]}): \"{tk[2][:45]}\" | {tk[3]} | Priority: {tk[4].upper()} | Status: {tk[5]} | ML Risk: {tk[6].upper()} ({score_pct}%)")

    # 6. AUDIO & VIDEO FILES
    print("\n[STORAGE: Uploaded Audio & Video Media Files]")
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    if os.path.exists(upload_dir):
        files = os.listdir(upload_dir)
        for f in files:
            f_size_kb = os.path.getsize(os.path.join(upload_dir, f)) / 1024.0
            print(f"  - {f} ({f_size_kb:.1f} KB)")
    else:
        print("  No upload directory yet.")

    print("\n" + "=" * 65)
    conn.close()

if __name__ == "__main__":
    view_stored_data()
