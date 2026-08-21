import React, { useState } from 'react';
import { Zap, Play, Send, CheckCircle2, RefreshCw, Server, AlertCircle, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';

export const AgenticAutomationPanel = ({ meetingId = 1, onExecutionComplete }) => {
  const [webhookUrl, setWebhookUrl] = useState('https://primary-production-webhook.n8n.cloud/webhook/meeting-intelligence-action');
  const [runningAgent, setRunningAgent] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleRunMeetingAutomations = async () => {
    setRunningAgent(true);
    setTestResult(null);
    try {
      const res = await api.agent.executeMeetingAutomations(meetingId, webhookUrl);
      setTestResult(res);
      if (onExecutionComplete) onExecutionComplete();
      fetchLogs();
    } catch (err) {
      console.error('Failed to run agent automations:', err);
      setTestResult({ success: false, message: err.message });
    } finally {
      setRunningAgent(false);
    }
  };

  const handleTestN8nTrigger = async () => {
    setRunningAgent(true);
    setTestResult(null);
    try {
      const res = await api.agent.testN8N({
        webhook_url: webhookUrl,
        event: 'manual_test_dispatch',
        payload: {
          meeting_id: meetingId,
          timestamp: new Date().toISOString(),
          test_message: 'Manual automation test from MeetIntel AI interface'
        }
      });
      setTestResult(res);
      fetchLogs();
    } catch (err) {
      console.error('Failed to dispatch test n8n webhook:', err);
      setTestResult({ success: false, message: err.message });
    } finally {
      setRunningAgent(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.agent.getLogs(meetingId);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch agent logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)'
          }}>
            <Zap size={18} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Agentic AI Meeting Automation & n8n</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Module 17: Autonomous Follow-ups, Email Digests & Webhook Workflows
            </span>
          </div>
        </div>

        <span className="badge badge-purple" style={{ fontSize: '11px' }}>
          n8n Integrated
        </span>
      </div>

      {/* Autonomous Capabilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '4px' }}>
            1. High-Risk Task Alerts
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            Detects tasks at risk of delay and dispatches immediate notifications.
          </span>
        </div>

        <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#a78bfa', display: 'block', marginBottom: '4px' }}>
            2. Follow-Up Email Digests
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            Formats and distributes executive meeting minutes to attendees.
          </span>
        </div>

        <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '4px' }}>
            3. n8n Automation Workflows
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            Sends live webhook payloads to n8n to sync Jira, Slack, or calendars.
          </span>
        </div>
      </div>

      {/* n8n Webhook Configuration */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          n8n Webhook Endpoint URL
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="form-input"
            style={{ fontSize: '13px' }}
          />
          <button onClick={handleTestN8nTrigger} disabled={runningAgent} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            <Server size={14} />
            <span>Ping n8n</span>
          </button>
        </div>
      </div>

      {/* Trigger Autonomous Agent Execution */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '20px' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 2px 0' }}>
            Trigger Autonomous Meeting Post-Processing
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Agent will analyze meeting outcomes, evaluate high-risk items, and execute follow-ups.
          </span>
        </div>

        <button
          onClick={handleRunMeetingAutomations}
          disabled={runningAgent}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}
        >
          {runningAgent ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Agent Executing...</span>
            </>
          ) : (
            <>
              <Play size={15} />
              <span>Execute Agent Workflow</span>
            </>
          )}
        </button>
      </div>

      {/* Result Card */}
      {testResult && (
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: testResult.success !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: testResult.success !== false ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {testResult.success !== false ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : (
              <AlertCircle size={16} color="#ef4444" />
            )}
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              {testResult.message || 'Workflow executed successfully!'}
            </span>
          </div>
          {testResult.actions && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {testResult.actions.map((act, i) => (
                <span key={i}>• <strong>{act.action}:</strong> {act.subject || act.suggested_date || 'Dispatched payload'}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
