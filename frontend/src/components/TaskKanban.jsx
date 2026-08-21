import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Clock, CheckCircle2, AlertCircle, ArrowRight, User, X } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export const TaskKanban = ({ tasks = [], onTaskStatusChange, onTaskCreate }) => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newPriority, setNewPriority] = useState('high');
  const [newDays, setNewDays] = useState(3);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await api.users.listAll();
        setRegisteredUsers(users);
        if (users && users.length > 0 && !newAssignee) {
          setNewAssignee(users[0].name);
        }
      } catch (err) {
        console.error('Failed to load users for task assignment', err);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCreateModal]);

  const columns = [
    { id: 'pending', title: 'Pending Backlog', color: '#f59e0b', icon: Clock },
    { id: 'in_progress', title: 'In Progress', color: '#6366f1', icon: AlertCircle },
    { id: 'completed', title: 'Completed', color: '#10b981', icon: CheckCircle2 },
  ];

  const handleStatusMove = (taskId, newStatus) => {
    if (newStatus === 'completed') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
    if (onTaskStatusChange) {
      onTaskStatusChange(taskId, newStatus);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Number(newDays));

    if (onTaskCreate) {
      onTaskCreate({
        title: newTaskTitle,
        assignee_name: newAssignee,
        priority: newPriority,
        deadline: deadline.toISOString(),
        status: 'pending',
        complexity_score: 3
      });
    }
    setNewTaskTitle('');
    setShowCreateModal(false);
  };

  return (
    <div>
      {/* Top Bar with Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Interactive Task Workflow</h3>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Module 10: Kanban board with integrated Machine Learning Risk Predictions
          </span>
        </div>

        {user?.role === 'admin' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            <Plus size={16} />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* 3-Column Kanban Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const ColIcon = col.icon;
          const isCompletedCol = col.id === 'completed';

          return (
            <div
              key={col.id}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '520px',
                background: isCompletedCol ? 'rgba(16, 185, 129, 0.04)' : 'rgba(15, 23, 42, 0.65)',
                border: isCompletedCol ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-glass)'
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: `2px solid ${col.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ColIcon size={16} color={col.color} />
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    {col.title}
                  </h4>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: isCompletedCol ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: isCompletedCol ? '#34d399' : '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {colTasks.length === 0 ? (
                  <div style={{
                    padding: '36px 12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12.5px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    {isCompletedCol ? 'No tasks completed yet. Click "✓ Done" on any task to complete it.' : `No tasks in ${col.title}`}
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="glass-card"
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: isCompletedCol ? 'rgba(6, 78, 59, 0.25)' : 'rgba(30, 41, 59, 0.75)',
                        border: isCompletedCol ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        boxShadow: isCompletedCol ? '0 0 14px rgba(16, 185, 129, 0.1)' : 'none'
                      }}
                    >
                      {/* Completed Badge (if completed) */}
                      {isCompletedCol && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(16, 185, 129, 0.15)' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#34d399',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            <CheckCircle2 size={12} color="#34d399" />
                            Completed
                          </span>
                          {t.completed_at && (
                            <span style={{ fontSize: '10.5px', color: 'rgba(167, 243, 208, 0.7)' }}>
                              {new Date(t.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Title */}
                      <h5 style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: isCompletedCol ? '#e2e8f0' : '#ffffff',
                        margin: 0,
                        lineHeight: 1.4,
                        textDecoration: isCompletedCol ? 'line-through' : 'none',
                        opacity: isCompletedCol ? 0.9 : 1
                      }}>
                        {t.title}
                      </h5>

                      {/* Details & Assignee */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#818cf8" />
                          <span>{t.assignee_name}</span>
                        </div>
                        <span style={{
                          color: t.priority === 'urgent' || t.priority === 'high' ? '#f87171' : '#fbbf24',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {t.priority}
                        </span>
                      </div>

                      {/* Risk Badge & Deadline */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <RiskBadge
                          riskLevel={t.risk_level}
                          riskScore={t.risk_score}
                          riskFactors={t.risk_factors}
                          mitigationTip={t.ai_mitigation_tip}
                          compact={true}
                        />

                        {/* Status Move Buttons */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {col.id !== 'pending' && (
                            <button
                              onClick={() => handleStatusMove(t.id, 'pending')}
                              title="Move to Pending"
                              style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#cbd5e1', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              ← Backlog
                            </button>
                          )}
                          {col.id !== 'in_progress' && (
                            <button
                              onClick={() => handleStatusMove(t.id, 'in_progress')}
                              title="Move to In Progress"
                              style={{ background: 'rgba(99, 102, 241, 0.2)', border: 'none', color: '#818cf8', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              In Prog
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button
                              onClick={() => handleStatusMove(t.id, 'completed')}
                              title="Mark Completed"
                              style={{ background: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '10px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                            >
                              ✓ Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(3, 7, 18, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div className="glass-card" style={{ width: '500px', maxWidth: '100%', padding: '26px', background: '#0a0f1d', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>Create New Action Item</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement background STT queue"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Assignee
                  </label>
                  {registeredUsers.length > 0 ? (
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="form-select"
                    >
                      {registeredUsers.map(u => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.job_title || u.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="form-input"
                      placeholder="e.g. Alex (Engineering Lead)"
                    />
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Deadline (Days from now)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newDays}
                  onChange={(e) => setNewDays(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create & Run ML Risk Model
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
