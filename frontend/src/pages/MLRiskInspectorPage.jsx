import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Cpu, Sparkles, Sliders, CheckCircle2, TrendingDown } from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

export const MLRiskInspectorPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive Simulator Form
  const [simDays, setSimDays] = useState(1.5);
  const [simPriority, setSimPriority] = useState('high');
  const [simComplexity, setSimComplexity] = useState(4);
  const [simPendingTasks, setSimPendingTasks] = useState(3);
  const [simDelayRate, setSimDelayRate] = useState(0.3);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.risk.getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load risk metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await api.risk.predict({
        title: "Simulated Custom Action Item",
        deadline_days_away: Number(simDays),
        priority: simPriority,
        complexity_score: Number(simComplexity),
        assignee_pending_tasks: Number(simPendingTasks),
        historical_delay_rate: Number(simDelayRate)
      });
      setSimResult(res);
    } catch (err) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">ML Task Completion Risk Inspector</h1>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Module 11: Machine Learning Classifier predicting probability of schedule delay with explainable factor attributions.
        </p>
      </div>

      {/* Model Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Cpu size={18} color="#818cf8" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Model Architecture</span>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
            Random Forest Ensemble
          </h3>
          <span style={{ fontSize: '12px', color: '#34d399' }}>100 Estimators • Max Depth 8</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="#06b6d4" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Cross-Validation Accuracy</span>
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#06b6d4', margin: '0 0 4px 0' }}>
            93.8%
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trained on 2,000 enterprise task profiles</span>
        </div>

        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldAlert size={18} color="#ef4444" />
            <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 600 }}>High Risk Active Tasks</span>
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', margin: '0 0 4px 0' }}>
            {metrics?.high_risk_count || 0}
          </h3>
          <span style={{ fontSize: '12px', color: '#f87171' }}>Autonomous mitigation active</span>
        </div>
      </div>

      {/* 2-Column Grid: Feature Weight Importance & Interactive Risk Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Feature Importance Table */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sliders size={18} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>ML Feature Importance & Attribution</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(metrics?.feature_weights || []).map((fw, idx) => (
              <div key={idx} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{fw.feature}</span>
                  <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 700 }}>{Math.round(fw.weight * 100)}% Weight</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${fw.weight * 100}%`, height: '100%', background: 'var(--accent-gradient)' }} />
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{fw.impact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive ML Risk Simulator */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Live Task Risk Simulator</h3>
          </div>

          <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Days to Deadline:</span>
                <strong style={{ color: '#ffffff' }}>{simDays} days</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="14"
                step="0.5"
                value={simDays}
                onChange={(e) => setSimDays(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Priority</label>
                <select value={simPriority} onChange={(e) => setSimPriority(e.target.value)} className="form-select" style={{ fontSize: '12px' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Complexity (1-5)</label>
                <select value={simComplexity} onChange={(e) => setSimComplexity(e.target.value)} className="form-select" style={{ fontSize: '12px' }}>
                  <option value="1">1 (Trivial)</option>
                  <option value="2">2 (Easy)</option>
                  <option value="3">3 (Moderate)</option>
                  <option value="4">4 (Complex)</option>
                  <option value="5">5 (Critical)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assignee Workload</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={simPendingTasks}
                  onChange={(e) => setSimPendingTasks(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Team Past Delay Rate</label>
                <input
                  type="number"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={simDelayRate}
                  onChange={(e) => setSimDelayRate(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>

            <button type="submit" disabled={simulating} className="btn-primary" style={{ marginTop: '8px' }}>
              <Cpu size={15} />
              <span>Run Model Inference</span>
            </button>
          </form>

          {/* Simulation Output */}
          {simResult && (
            <div style={{ marginTop: '18px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Predicted Delay Risk:</span>
                <RiskBadge riskLevel={simResult.risk_level} riskScore={simResult.risk_score} />
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                {simResult.risk_factors.map((f, i) => (
                  <span key={i}>• {f}</span>
                ))}
              </div>
              <p style={{ fontSize: '11.5px', color: '#a5b4fc', margin: 0 }}>
                💡 <strong>Mitigation:</strong> {simResult.ai_mitigation_tip}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
