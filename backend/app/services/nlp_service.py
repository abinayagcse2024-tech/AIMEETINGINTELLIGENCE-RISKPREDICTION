import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any
from collections import Counter
from app.ml.risk_model import risk_predictor

class NLPMeetingIntelligenceService:
    def __init__(self):
        pass

    def extract_all(self, meeting_title: str, transcript_text: str, participants: List[str] = None) -> Dict[str, Any]:
        """
        Processes transcript to extract:
        1. Executive Summary & Structured Notes (Module 8)
        2. Key Discussion Points & Topics (Module 8)
        3. Action Items & Tasks with Deadlines & Assignees (Module 9)
        4. Decisions Log (Module 12)
        5. ML Risk Assessment for each extracted task (Module 11)
        """
        summary_data = self.generate_summary(meeting_title, transcript_text)
        decisions_data = self.extract_decisions(transcript_text, participants)
        tasks_data = self.extract_tasks(transcript_text, participants)

        return {
            "summary": summary_data,
            "decisions": decisions_data,
            "tasks": tasks_data
        }

    def generate_summary(self, meeting_title: str, transcript_text: str) -> Dict[str, Any]:
        """Generates dynamic executive summary, key points, and topics directly from the real transcript text."""
        if not transcript_text or not transcript_text.strip():
            return {
                "executive_summary": f"Meeting '{meeting_title}' completed. No transcript content recorded.",
                "key_points": [],
                "topics": [],
                "sentiment_overview": "neutral",
                "action_items_count": 0
            }

        lines = [l.strip() for l in transcript_text.split("\n") if l.strip()]
        spoken_sentences = []
        for l in lines:
            if "]:" in l:
                spoken_sentences.append(l.split("]:", 1)[1].strip())
            elif ":" in l and len(l.split(":", 1)[0].split()) <= 4:
                spoken_sentences.append(l.split(":", 1)[1].strip())
            else:
                spoken_sentences.append(l)

        # 1. Dynamic Key Points from actual spoken sentences
        key_points = []
        for s in spoken_sentences:
            cleaned = s.strip().strip('"').strip("'")
            if len(cleaned) > 10 and not cleaned.lower().startswith(("welcome", "good morning", "thanks", "hello", "hi ")):
                key_points.append(cleaned)
            if len(key_points) >= 6:
                break

        # 2. Dynamic Executive Summary
        if len(spoken_sentences) >= 2:
            main_focus = " ".join(key_points[:3]) if key_points else " ".join(spoken_sentences[:2])
            executive_summary = (
                f"The meeting addressed '{meeting_title}'. Discussion highlights: {main_focus}"
            )
        elif spoken_sentences:
            executive_summary = f"Session '{meeting_title}': {spoken_sentences[0]}"
        else:
            executive_summary = f"Session '{meeting_title}' recorded with live intelligence."

        # 3. Dynamic Topic Extraction based on real keyword frequencies in transcript
        stopwords = {
            "the", "and", "a", "to", "of", "in", "for", "is", "on", "that", "this", "with",
            "i", "we", "you", "it", "our", "are", "be", "as", "at", "by", "from", "let's", "all",
            "have", "has", "had", "will", "would", "can", "could", "should", "not", "so", "but",
            "my", "your", "its", "their", "meeting", "session", "talk", "says", "said"
        }
        words = [w.lower() for w in re.findall(r'\b[A-Za-z]{4,}\b', transcript_text) if w.lower() not in stopwords]
        word_counts = Counter(words).most_common(4)

        topics = []
        for i, (word, count) in enumerate(word_counts):
            topics.append({
                "name": word.capitalize() + " Discussion",
                "relevance": round(max(0.70, min(0.98, count / max(1, len(word_counts) * 2))), 2),
                "discussion_time_mins": round(count * 1.5 + (i * 1.0), 1)
            })

        return {
            "executive_summary": executive_summary,
            "key_points": key_points,
            "topics": topics,
            "sentiment_overview": "positive" if "great" in transcript_text.lower() or "good" in transcript_text.lower() else "constructive",
            "action_items_count": len(key_points)
        }

    def extract_decisions(self, transcript_text: str, participants: List[str] = None) -> List[Dict[str, Any]]:
        """Extracts agreed decisions dynamically from real meeting dialogue."""
        if not transcript_text:
            return []

        lines = [l.strip() for l in transcript_text.split("\n") if l.strip()]
        decisions = []
        decision_keywords = ["decision", "agreed", "agree", "confirmed", "approved", "freeze", "proceed", "decided", "finalize", "settled", "resolved"]

        default_speaker = participants[0] if participants and len(participants) > 0 else "Host"

        for l in lines:
            lower = l.lower()
            if any(k in lower for k in decision_keywords):
                speaker = default_speaker
                text = l
                if "]:" in l:
                    parts = l.split("]:", 1)
                    speaker = parts[0].replace("[", "").strip()
                    text = parts[1].strip()
                elif ":" in l and len(l.split(":", 1)[0].split()) <= 4:
                    parts = l.split(":", 1)
                    speaker = parts[0].strip()
                    text = parts[1].strip()

                decisions.append({
                    "decision_text": text,
                    "context": f"Logged by {speaker} during discussion.",
                    "responsible_person": speaker,
                    "impact_level": "high" if any(w in lower for w in ["critical", "urgent", "freeze", "final", "release"]) else "medium",
                    "status": "approved"
                })

            if len(decisions) >= 5:
                break

        return decisions

    def extract_tasks(self, transcript_text: str, participants: List[str] = None) -> List[Dict[str, Any]]:
        """Extracts actionable tasks from dialogue, assigns deadlines, and scores risk dynamically using ML."""
        if not transcript_text:
            return []

        default_assignee = participants[0] if participants and len(participants) > 0 else "Team Member"
        now = datetime.now(timezone.utc)

        lines = [l.strip() for l in transcript_text.split("\n") if l.strip()]
        action_keywords = ["will", "need to", "must", "should", "prepare", "deploy", "implement", "fix", "test", "build", "review", "optimize", "send", "create"]

        raw_tasks = []
        for i, l in enumerate(lines):
            lower = l.lower()
            if any(k in lower for k in action_keywords):
                speaker = default_assignee
                text = l
                if "]:" in l:
                    parts = l.split("]:", 1)
                    speaker = parts[0].replace("[", "").strip()
                    text = parts[1].strip()
                elif ":" in l and len(l.split(":", 1)[0].split()) <= 4:
                    parts = l.split(":", 1)
                    speaker = parts[0].strip()
                    text = parts[1].strip()

                # Determine the true assignee: if the speaker mentions a participant's name, assign it to that participant
                assignee = speaker
                if participants:
                    for p in participants:
                        if p.lower() != speaker.lower():
                            first_name = p.split()[0].lower()
                            if re.search(rf'\b{re.escape(first_name)}\b', text.lower()):
                                assignee = p
                                break

                priority = "urgent" if any(w in lower for w in ["urgent", "immediately", "asap", "tonight", "critical"]) else "high" if "will" in lower or "must" in lower else "medium"
                days_ahead = 1 if priority == "urgent" else 2 if priority == "high" else 4

                raw_tasks.append({
                    "title": text[:120],
                    "description": f"Extracted action item for {assignee}: \"{text}\"",
                    "assignee_name": assignee,
                    "priority": priority,
                    "deadline": now + timedelta(days=days_ahead),
                    "complexity_score": 4 if priority in ["urgent", "high"] else 2,
                    "assignee_pending": 1
                })

            if len(raw_tasks) >= 6:
                break

        scored_tasks = []
        for t in raw_tasks:
            days_away = (t["deadline"] - now).total_seconds() / 86400.0
            
            # Predict Risk using ML Model (Module 11)
            risk_res = risk_predictor.predict(
                deadline_days=days_away,
                priority=t["priority"],
                complexity_score=t["complexity_score"],
                assignee_pending_tasks=t["assignee_pending"],
                historical_delay_rate=0.20
            )

            scored_tasks.append({
                "title": t["title"],
                "description": t["description"],
                "assignee_name": t["assignee_name"],
                "deadline": t["deadline"],
                "priority": t["priority"],
                "status": "pending",
                "complexity_score": t["complexity_score"],
                "risk_level": risk_res["risk_level"],
                "risk_score": risk_res["risk_score"],
                "risk_factors": risk_res["risk_factors"],
                "ai_mitigation_tip": risk_res["ai_mitigation_tip"]
            })

        return scored_tasks

nlp_service = NLPMeetingIntelligenceService()
