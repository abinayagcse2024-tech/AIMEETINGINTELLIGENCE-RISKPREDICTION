import React, { useState, useEffect } from 'react';
import { Zap, Server, Play, Clock, CheckCircle2, AlertCircle, RefreshCw, Send, CalendarDays } from 'lucide-react';
import { api } from '../services/api';
import { AgenticAutomationPanel } from '../components/AgenticAutomationPanel';

export const AutomationPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.agent.getLogs(selectedMeetingId || undefined);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load agent logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const data = await api.meetings.getAll();
        setMeetings(data);
        if (data && data.length > 0) {
          setSelectedMeetingId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load meetings for automation', err);
      }
    };
    loadMeetings();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedMeetingId]);

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Agentic AI & n8n Automation Workflows</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Module 17: Autonomous decision execution, webhook triggers, follow-up scheduling, and external service synchronization.
          </p>
        </div>

        {meetings.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Meeting:</span>
            <select
              value={selectedMeetingId || ''}
              onChange={(e) => setSelectedMeetingId(Number(e.target.value))}
              className="form-select"
              style={{ minWidth: '220px' }}
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.id} - {m.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Agent Runner */}
      <div style={{ marginBottom: '28px' }}>
        {selectedMeetingId ? (
          <AgenticAutomationPanel meetingId={selectedMeetingId} onExecutionComplete={fetchLogs} />
        ) : (
          <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CalendarDays size={36} color="#6366f1" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
            <h3 style={{ color: '#ffffff', margin: '0 0 6px 0' }}>No Meetings Recorded Yet</h3>
            <p style={{ margin: 0, fontSize: '13.5px', maxWidth: '440px', marginInline: 'auto' }}>
              Schedule a meeting or start a live room to capture real-time transcripts, summaries, and trigger autonomous n8n workflows.
            </p>
          </div>
        )}
      </div>

      {/* Execution Logs Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Autonomous Agent Execution Audit Trail</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live log of automated actions and webhooks</span>
          </div>

          <button onClick={fetchLogs} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Logs</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '12px 0' }}>
            No agent automation logs recorded yet. Run a workflow above to generate audit entries.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Action Type</th>
                  <th style={{ padding: '10px 14px' }}>Description</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px' }}>Result / Payload</th>
                  <th style={{ padding: '10px 14px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                        {log.action_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 500 }}>
                      {log.description}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge badge-low" style={{ textTransform: 'uppercase' }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.result_summary || JSON.stringify(log.payload)}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
