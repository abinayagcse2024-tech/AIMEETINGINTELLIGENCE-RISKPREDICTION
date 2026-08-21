import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Award, ListFilter, ShieldAlert, FileText, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { Pagination } from './Pagination';

export const MeetingIntelligenceHub = ({ summary, decisions = [], tasks = [], onRefresh, meetingId, taskPage, setTaskPage, taskTotalPages, taskTotalItems }) => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'decisions', 'tasks', 'topics'
  const [generating, setGenerating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const handleToggleTaskStatus = async (task) => {
    if (!task.id) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setUpdatingTaskId(task.id);
    if (newStatus === 'completed') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
    try {
      await api.tasks.update(task.id, { status: newStatus });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error updating task status: ${err.message}`);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleManualGenerate = async () => {
    setGenerating(true);
    try {
      await api.transcription.processSTT(meetingId);
      await api.intelligence.generateAll(meetingId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (!summary && decisions.length === 0 && tasks.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
        <Sparkles size={36} color="#6366f1" style={{ margin: '0 auto 14px' }} />
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          AI Meeting Intelligence Standby
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
          Upload or record video/audio, or click below to immediately generate speech transcripts, executive summaries, decision registries, and action items.
        </p>
        <button
          onClick={handleManualGenerate}
          disabled={generating}
          className="btn-primary"
          style={{ margin: '0 auto', display: 'inline-flex', padding: '10px 20px', fontSize: '13.5px' }}
        >
          <Sparkles size={16} className={generating ? 'animate-spin' : ''} />
          <span>{generating ? 'Transcribing & Summarizing...' : '✨ Generate AI Transcript & Summary Now'}</span>
        </button>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Module Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>AI Meeting Intelligence Hub</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Modules 8, 9, 11 & 12: NLP Summaries, Decision Logs & Risk Scored Tasks
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <span className="badge badge-purple" style={{ fontSize: '11px' }}>
            {decisions.length} Decisions
          </span>
          <span className="badge badge-info" style={{ fontSize: '11px' }}>
            {tasks.length} Action Items {completedCount > 0 && `(${completedCount} done)`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <FileText size={15} />
          <span>Executive Summary & Notes</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'decisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          <Award size={15} />
          <span>Decisions Log ({decisions.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckCircle2 size={15} />
          <span>Extracted Tasks ({tasks.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'topics' ? 'active' : ''}`}
          onClick={() => setActiveTab('topics')}
        >
          <ListFilter size={15} />
          <span>Topic Heatmap</span>
        </button>
      </div>

      {/* Tab 1: Executive Summary & Key Points (Module 8) */}
      {activeTab === 'summary' && summary && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            borderLeft: '4px solid #6366f1',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Executive Summary
            </h4>
            <p style={{ fontSize: '14px', color: '#f1f5f9', lineHeight: 1.6, margin: 0 }}>
              {summary.executive_summary}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Key Discussion Points:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {summary.key_points && summary.key_points.map((point, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', marginTop: '7px', flexShrink: 0 }} />
                  <span style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.45 }}>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Decisions Log (Module 12) */}
      {activeTab === 'decisions' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {decisions.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No formal decisions logged for this meeting yet.
            </p>
          ) : (
            decisions.map((d, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    <Award size={16} color="#10b981" />
                  </div>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: '0 0 4px 0' }}>
                      {d.decision_text}
                    </h5>
                    {d.context && (
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                        {d.context}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <span>Owner: <strong style={{ color: '#e2e8f0' }}>{d.responsible_person || 'Team'}</strong></span>
                      <span>•</span>
                      <span>Impact: <strong style={{ color: d.impact_level === 'critical' || d.impact_level === 'high' ? '#f87171' : '#38bdf8' }}>{d.impact_level?.toUpperCase()}</strong></span>
                    </div>
                  </div>
                </div>

                <span className="badge badge-low" style={{ textTransform: 'uppercase' }}>
                  {d.status || 'Approved'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Extracted Tasks & ML Risk (Module 9 & 11) */}
      {activeTab === 'tasks' && (
        <React.Fragment>
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No action items extracted for this meeting.
            </p>
          ) : (
            tasks.map((task, i) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task.id || i}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                    border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      disabled={updatingTaskId === task.id}
                      title={isCompleted ? "Click to Reopen" : "Click to Mark Completed"}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isCompleted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                        border: isCompleted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        flexShrink: 0,
                        cursor: 'pointer',
                        color: isCompleted ? '#34d399' : '#818cf8',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isCompleted ? <Check size={16} color="#34d399" /> : <CheckCircle2 size={16} color="#818cf8" />}
                    </button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h5 style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: isCompleted ? '#94a3b8' : '#f8fafc',
                          margin: 0,
                          textDecoration: isCompleted ? 'line-through' : 'none'
                        }}>
                          {task.title}
                        </h5>
                        {isCompleted && (
                          <span className="badge badge-low" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            ✓ COMPLETED
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                          {task.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>Assignee: <strong style={{ color: '#f1f5f9' }}>{task.assignee_name}</strong></span>
                        <span>•</span>
                        <span>Priority: <strong style={{ color: task.priority === 'urgent' || task.priority === 'high' ? '#f87171' : '#fbbf24' }}>{task.priority?.toUpperCase()}</strong></span>
                        <span>•</span>
                        <span>Due: <strong style={{ color: '#38bdf8' }}>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'TBD'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* ML Risk Score Badge (Module 11) */}
                    <RiskBadge
                      riskLevel={task.risk_level}
                      riskScore={task.risk_score}
                      riskFactors={task.risk_factors}
                      mitigationTip={task.ai_mitigation_tip}
                    />

                    {/* Quick Done / Reopen Button */}
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      disabled={updatingTaskId === task.id}
                      className={isCompleted ? "btn-secondary" : "btn-primary"}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        background: isCompleted ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.25)',
                        border: isCompleted ? '1px solid var(--border-glass)' : '1px solid rgba(16, 185, 129, 0.4)',
                        color: isCompleted ? '#cbd5e1' : '#34d399'
                      }}
                    >
                      {isCompleted ? 'Reopen' : '✓ Done'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {taskTotalItems > 0 && setTaskPage && (
          <Pagination
            currentPage={taskPage}
            totalPages={taskTotalPages}
            totalItems={taskTotalItems}
            pageSize={20}
            onPageChange={setTaskPage}
          />
        )}
      </React.Fragment>
      )}

      {/* Tab 4: Topic Heatmap */}
      {activeTab === 'topics' && summary && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {summary.topics && summary.topics.map((t, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>{t.name}</span>
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>{Math.round(t.relevance * 100)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${t.relevance * 100}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Discussion Time: ~{t.discussion_time_mins || 8} mins
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
