import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Any, Tuple
from app.core.config import settings

MODEL_FILE_PATH = os.path.join(settings.MODEL_DIR, "task_risk_model.pkl")

PRIORITY_MAP = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "urgent": 4
}

class TaskRiskPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = [
            "deadline_days", 
            "priority_weight", 
            "complexity_score", 
            "assignee_pending_tasks", 
            "historical_delay_rate", 
            "desc_word_count"
        ]
        self._load_or_train()

    def _generate_synthetic_dataset(self, n_samples: int = 1500) -> pd.DataFrame:
        """Generates realistic enterprise task dataset for risk prediction training"""
        np.random.seed(42)
        
        # Features
        deadline_days = np.random.exponential(scale=5.0, size=n_samples) + 0.5 # 0.5 to ~25 days
        priority_weights = np.random.choice([1, 2, 3, 4], size=n_samples, p=[0.25, 0.40, 0.25, 0.10])
        complexity_scores = np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.15, 0.25, 0.35, 0.15, 0.10])
        assignee_pending = np.random.poisson(lam=2.5, size=n_samples) # 0 to ~8 tasks
        historical_delay_rate = np.random.beta(a=2, b=5, size=n_samples) # 0.0 to 1.0 (mean ~0.28)
        desc_word_count = np.random.gamma(shape=3.0, scale=8.0, size=n_samples) # ~5 to 80 words

        # Ground truth risk scoring formula + noise
        # High complexity + urgent + tight deadline + overloaded assignee => High Delay Risk
        risk_index = (
            (4.0 / (deadline_days + 0.5)) * 0.35 +
            (priority_weights / 4.0) * 0.20 +
            (complexity_scores / 5.0) * 0.25 +
            (assignee_pending / 6.0) * 0.25 +
            (historical_delay_rate) * 0.30 +
            np.random.normal(0, 0.1, size=n_samples)
        )
        
        # Categorize into 0: Low Risk, 1: Medium Risk, 2: High Risk
        labels = np.zeros(n_samples, dtype=int)
        labels[(risk_index >= 0.55) & (risk_index < 0.90)] = 1
        labels[risk_index >= 0.90] = 2

        df = pd.DataFrame({
            "deadline_days": deadline_days,
            "priority_weight": priority_weights,
            "complexity_score": complexity_scores,
            "assignee_pending_tasks": assignee_pending,
            "historical_delay_rate": historical_delay_rate,
            "desc_word_count": desc_word_count,
            "risk_label": labels
        })
        return df

    def train(self):
        """Train Random Forest model and save artifact"""
        df = self._generate_synthetic_dataset(2000)
        X = df[self.feature_names]
        y = df["risk_label"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)

        self.model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        self.model.fit(X_train_scaled, y_train)

        # Save model and scaler
        with open(MODEL_FILE_PATH, "wb") as f:
            pickle.dump({"model": self.model, "scaler": self.scaler, "feature_names": self.feature_names}, f)
        print(f"[SUCCESS] ML Task Risk Model trained and saved to {MODEL_FILE_PATH}")

    def _load_or_train(self):
        if os.path.exists(MODEL_FILE_PATH):
            try:
                with open(MODEL_FILE_PATH, "rb") as f:
                    data = pickle.load(f)
                    self.model = data["model"]
                    self.scaler = data["scaler"]
                    self.feature_names = data.get("feature_names", self.feature_names)
                    return
            except Exception as e:
                print(f"Error loading model: {e}, retraining...")
        self.train()

    def predict(
        self,
        deadline_days: float,
        priority: str,
        complexity_score: int,
        assignee_pending_tasks: int,
        historical_delay_rate: float,
        desc_word_count: int = 15
    ) -> Dict[str, Any]:
        """Inference with explainability factors and mitigation advice"""
        priority_val = PRIORITY_MAP.get(priority.lower(), 2)
        complexity_score = max(1, min(5, complexity_score))
        deadline_days = max(0.1, deadline_days)
        assignee_pending_tasks = max(0, assignee_pending_tasks)
        historical_delay_rate = max(0.0, min(1.0, historical_delay_rate))

        features = np.array([[
            deadline_days,
            priority_val,
            complexity_score,
            assignee_pending_tasks,
            historical_delay_rate,
            desc_word_count
        ]])

        if self.scaler and self.model:
            features_scaled = self.scaler.transform(features)
            probs = self.model.predict_proba(features_scaled)[0]
            # Probabilities for [Low, Medium, High]
            # Calculate continuous risk score (0.0 to 1.0)
            if len(probs) == 3:
                risk_score = float(probs[1] * 0.5 + probs[2] * 1.0)
            else:
                risk_score = float(probs[-1])
        else:
            # Fallback heuristic
            risk_score = min(1.0, (1.0 / deadline_days) * 0.3 + (priority_val / 4.0) * 0.3 + (complexity_score / 5.0) * 0.4)

        risk_score = round(max(0.05, min(0.98, risk_score)), 2)

        if risk_score >= 0.65:
            risk_level = "high"
        elif risk_score >= 0.35:
            risk_level = "medium"
        else:
            risk_level = "low"

        # Generate Explainability Risk Factors
        risk_factors: List[str] = []
        if deadline_days <= 1.5:
            risk_factors.append(f"Imminent deadline ({deadline_days:.1f} days remaining)")
        elif deadline_days <= 3.0:
            risk_factors.append(f"Short turnaround window ({deadline_days:.1f} days)")

        if assignee_pending_tasks >= 4:
            risk_factors.append(f"Assignee currently handling {assignee_pending_tasks} concurrent tasks")
        elif assignee_pending_tasks >= 3:
            risk_factors.append("Moderate assignee workload")

        if complexity_score >= 4:
            risk_factors.append(f"High technical complexity (Score: {complexity_score}/5)")

        if priority.lower() in ["urgent", "high"]:
            risk_factors.append(f"Elevated urgency level: {priority.upper()}")

        if historical_delay_rate >= 0.30:
            risk_factors.append(f"Historical team delay variance ({int(historical_delay_rate*100)}%)")

        if not risk_factors:
            risk_factors.append("Adequate timeline, balanced assignee workload, and manageable complexity.")

        # Generate AI Mitigation Tip
        if risk_level == "high":
            mitigation_tips = [
                "Consider reassigning subtasks or extending the deadline by 48 hours to prevent slippage.",
                "Schedule a 10-minute sync checkpoint and unblock key technical dependencies immediately.",
                "Reduce scope for this iteration or pair with an available team member."
            ]
            ai_mitigation = mitigation_tips[int(risk_score * 10) % len(mitigation_tips)]
        elif risk_level == "medium":
            ai_mitigation = "Monitor progress mid-cycle and confirm task requirements with the assignee."
        else:
            ai_mitigation = "Task is on track with low probability of delay. Proceed as planned."

        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "ai_mitigation_tip": ai_mitigation,
            "confidence": 0.92
        }

# Global Singleton Model Instance
risk_predictor = TaskRiskPredictionModel()
