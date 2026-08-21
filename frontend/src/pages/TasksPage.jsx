import React, { useState, useEffect } from 'react';
import { CheckSquare, ListFilter, AlertTriangle, ShieldAlert, Sparkles, Search } from 'lucide-react';
import { api } from '../services/api';
import { TaskKanban } from '../components/TaskKanban';
import { RiskBadge } from '../components/RiskBadge';
import { Pagination } from '../components/Pagination';

export const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.tasks.getAll({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        risk: riskFilter || undefined
      }, page, 100);
      if (res.data) {
        setTasks(res.data);
        setTotalPages(res.total_pages);
        setTotalItems(res.total);
      } else {
        setTasks(res);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, riskFilter, page]);

  const handleStatusChange = async (taskId, newStatus) => {
    // Instant optimistic update for silky smooth responsiveness
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    } : t));

    try {
      await api.tasks.update(taskId, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(`Error updating task status: ${err.message}`);
      fetchTasks();
    }
  };

  const handleCreateTask = async (taskPayload) => {
    try {
      await api.tasks.create(taskPayload);
      fetchTasks();
    } catch (err) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  const filteredTasks = tasks.filter(t => 
    !searchQuery || 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'date_asc') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
    if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
    if (sortBy === 'priority') {
      const p = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (p[b.priority] || 0) - (p[a.priority] || 0);
    }
    return 0;
  });

  const completedCount = filteredTasks.filter(t => t.status === 'completed').length;
  const pendingCount = filteredTasks.filter(t => t.status === 'pending').length;
  const inProgressCount = filteredTasks.filter(t => t.status === 'in_progress').length;
  const highRiskCount = filteredTasks.filter(t => t.risk_level === 'high' && t.status !== 'completed').length;

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Action Items & Task Intelligence</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Modules 9, 10 & 11: Manage tasks with automated Scikit-Learn risk predictions and delay probability scoring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('kanban')}
            className={`btn-secondary ${viewMode === 'kanban' ? 'active' : ''}`}
            style={{ background: viewMode === 'kanban' ? 'rgba(99, 102, 241, 0.2)' : 'transparent' }}
          >
            Kanban View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn-secondary ${viewMode === 'list' ? 'active' : ''}`}
            style={{ background: viewMode === 'list' ? 'rgba(99, 102, 241, 0.2)' : 'transparent' }}
          >
            Table View
          </button>
        </div>
      </div>


      {/* Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ width: '150px', padding: '6px 10px', fontSize: '12px' }}
            >
              <option value="date_desc">Date (Newest)</option>
              <option value="date_asc">Date (Oldest)</option>
              <option value="priority">Priority (Highest)</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {viewMode === 'list' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="form-select"
                  style={{ width: '130px', padding: '6px 10px', fontSize: '12px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="form-select"
                style={{ width: '130px', padding: '6px 10px', fontSize: '12px' }}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>ML Risk Level:</span>
              <select
                value={riskFilter}
                onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
                className="form-select"
                style={{ width: '130px', padding: '6px 10px', fontSize: '12px' }}
              >
                <option value="">All Risks</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span className="badge badge-purple">{tasks.length} Total Tasks</span>
            <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              ✓ {completedCount} Completed
            </span>
            {highRiskCount > 0 && (
              <span className="badge badge-high">
                {highRiskCount} High Risk
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View Switcher */}
      {viewMode === 'kanban' ? (
        <TaskKanban
          tasks={filteredTasks}
          onTaskStatusChange={handleStatusChange}
          onTaskCreate={handleCreateTask}
        />
      ) : (
        /* Table View */
        <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Task Description</th>
                <th style={{ padding: '12px 16px' }}>Assignee</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px' }}>Deadline</th>
                <th style={{ padding: '12px 16px' }}>ML Risk Assessment</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No tasks found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: t.status === 'completed' ? 'rgba(16, 185, 129, 0.03)' : 'transparent' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: t.status === 'completed' ? '#cbd5e1' : '#ffffff', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                      {t.title}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                      {t.assignee_name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        color: t.priority === 'urgent' || t.priority === 'high' ? '#f87171' : '#fbbf24',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '11.5px'
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'TBD'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <RiskBadge
                        riskLevel={t.risk_level}
                        riskScore={t.risk_score}
                        riskFactors={t.risk_factors}
                        mitigationTip={t.ai_mitigation_tip}
                      />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="form-select"
                        style={{
                          padding: '4px 8px',
                          fontSize: '11.5px',
                          width: '120px',
                          borderColor: t.status === 'completed' ? '#10b981' : t.status === 'in_progress' ? '#6366f1' : '#f59e0b',
                          color: t.status === 'completed' ? '#34d399' : '#ffffff'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {!loading && totalItems > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={20}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
