import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Award, Download, FileText, Sparkles } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { ExportReportModal } from '../components/ExportReportModal';

export const AnalyticsPage = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.dashboard.getInsights();
        setInsights(data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">AI Meeting Insights & Executive Reports</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Module 16: Deep productivity analysis, speaker talk-time balance, efficiency indices, and automated meeting minutes export.
          </p>
        </div>

        <button onClick={() => setShowExportModal(true)} className="btn-primary">
          <FileText size={16} />
          <span>Export Executive Digest</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Hours Saved by AI Automation</span>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', margin: '6px 0 2px 0' }}>
            {insights?.time_saved_by_ai_hours || 14.5} hrs
          </h2>
          <span style={{ fontSize: '11px', color: '#34d399' }}>+2.4 hrs vs last month</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Meeting Effectiveness Score</span>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', margin: '6px 0 2px 0' }}>
            {insights?.meeting_effectiveness_score || 94.2}%
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top tier operational efficiency</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Speaker Talk-Time Balance</span>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#a78bfa', margin: '6px 0 2px 0' }}>
            Optimal (4 Speakers)
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High participation equity</span>
        </div>
      </div>

      {/* Chart Rows */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Productivity Trends Over Time */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            Action Item Velocity & Decision Throughput
          </h3>

          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insights?.productivity_trends || []}>
                <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                  labelStyle={{ color: '#93c5fd', fontWeight: 700 }}
                />
                <Line type="monotone" dataKey="action_items" stroke="#6366f1" strokeWidth={3} name="Tasks Created" />
                <Line type="monotone" dataKey="decisions" stroke="#10b981" strokeWidth={2} name="Decisions Logged" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speaker Talk Time Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            Speaker Talk-Time & Sentiment
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(insights?.speaker_distribution || []).map((spk, i) => (
              <div key={i} style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{spk.speaker}</span>
                  <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>{spk.talk_time_mins} mins ({spk.percentage}%)</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                  <div style={{ width: `${spk.percentage * 2.5}%`, height: '100%', background: 'var(--accent-gradient)' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#34d399' }}>{spk.sentiment}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Report Modal */}
      <ExportReportModal
        meetingId={1}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};
