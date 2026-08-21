import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Play,
  Users
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.dashboard.getSummary();
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-body" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <Sparkles size={36} color="#6366f1" className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ color: '#ffffff' }}>Loading AI Meeting Intelligence Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="page-body animate-fade-in">
      {/* Top Welcome Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name?.split(' ')[0] || 'Team Lead'} 👋
          </h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Here is your live AI meeting intelligence summary, risk forecasts, and action items.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/live')} className="btn-secondary">
            <Play size={15} color="#ef4444" />
            <span>Join Live Room</span>
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/meetings?action=new')} className="btn-primary">
              <Plus size={16} />
              <span>Schedule Meeting</span>
            </button>
          )}
        </div>
      </div>

      {/* Missed Meetings Alert Banner */}
      {data?.missed_meetings > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={20} color="#f87171" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', color: '#fca5a5', fontWeight: 700 }}>
                ⚠️ {data.missed_meetings} Missed Meeting Session(s) Need Attention
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                One or more scheduled sessions passed without attendance. Request to schedule them again.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/meetings')}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 0 14px rgba(239, 68, 68, 0.4)',
              padding: '6px 14px',
              fontSize: '12px'
            }}
          >
            Review & Reschedule Missed Sessions
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        {/* Total Meetings */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Meetings</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={18} color="#818cf8" />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
            {data?.total_meetings || 0}
          </h2>
          <span style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 600 }}>
            {data?.upcoming_meetings || 0} upcoming {data?.missed_meetings > 0 && `• ${data?.missed_meetings} missed`}
          </span>
        </div>

        {/* Pending Tasks */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Action Items</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#fbbf24" />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
            {data?.pending_tasks || 0}
          </h2>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Across all project streams
          </span>
        </div>

        {/* High Risk Tasks (Module 11) */}
        <div className="glass-card" style={{ padding: '20px', border: data?.high_risk_tasks > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#f87171', fontWeight: 700 }}>ML High Risk Tasks</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#ef4444" />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444', margin: '0 0 4px 0' }}>
            {data?.high_risk_tasks || 0}
          </h2>
          <span style={{ fontSize: '11.5px', color: '#fca5a5', fontWeight: 600 }}>
            Delay probability &gt; 65%
          </span>
        </div>

        {/* Completion Rate */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Completion Velocity</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
            {data?.avg_task_completion_rate || 78.5}%
          </h2>
          <span style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 600 }}>
            {data?.completed_tasks || 0} tasks completed
          </span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Weekly Meeting Activity Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Meeting Frequency & Load</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Weekly session volume</span>
            </div>
            <span className="badge badge-purple">7-Day Trend</span>
          </div>

          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.meeting_frequency_chart || []}>
                <defs>
                  <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                  labelStyle={{ color: '#93c5fd', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="meetings" stroke="#6366f1" fillOpacity={1} fill="url(#colorMeetings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Risk Distribution Pie Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>ML Risk Breakdown</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Classifier predictions</span>
          </div>

          <div style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.risk_breakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data?.risk_breakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                  labelStyle={{ color: '#93c5fd', fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '11.5px' }}>
            <span style={{ color: '#34d399' }}>● Low</span>
            <span style={{ color: '#fbbf24' }}>● Medium</span>
            <span style={{ color: '#f87171' }}>● High</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Meetings & Urgent Action Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Recent Meetings */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Recent Meetings</h3>
            <button onClick={() => navigate('/meetings')} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11.5px' }}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data?.recent_meetings || []).map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(`/meetings/${m.id}`)}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h5 style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', margin: '0 0 4px 0' }}>
                    {m.title}
                  </h5>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {new Date(m.scheduled_start).toLocaleDateString()} • {m.participants_count} attendees
                  </span>
                </div>
                <span className={`badge ${m.status === 'completed' ? 'badge-low' : 'badge-info'}`} style={{ textTransform: 'uppercase' }}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk & Urgent Tasks (Module 11) */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Urgent & High Risk Tasks</h3>
            <button onClick={() => navigate('/tasks')} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11.5px' }}>
              Kanban
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data?.urgent_tasks || []).map((t) => (
              <div
                key={t.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h5 style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>
                    {t.title}
                  </h5>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Assignee: <strong style={{ color: '#e2e8f0' }}>{t.assignee}</strong> • Priority: <strong style={{ color: '#f87171' }}>{t.priority?.toUpperCase()}</strong>
                  </span>
                </div>
                <RiskBadge riskLevel={t.risk_level} riskScore={t.risk_score} compact={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
