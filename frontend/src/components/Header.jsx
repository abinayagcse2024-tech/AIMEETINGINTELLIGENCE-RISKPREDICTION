import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sparkles, Plus, CheckCircle2, Clock, AlertTriangle, Maximize, Minimize, RefreshCw } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Pagination } from './Pagination';

export const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllAsRead, triggerDemoAlerts, page, setPage, totalPages, totalItems } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen request error:', err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log('Exit fullscreen error:', err));
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'high_risk_alert':
        return <AlertTriangle size={15} color="#ef4444" />;
      case 'meeting_reminder':
        return <Clock size={15} color="#38bdf8" />;
      case 'task_deadline':
        return <CheckCircle2 size={15} color="#f59e0b" />;
      case 'meeting_rescheduled':
      case 'reschedule_request':
        return <RefreshCw size={15} color="#a855f7" />;
      default:
        return <Sparkles size={15} color="#6366f1" />;
    }
  };

  return (
    <header style={{
      height: '68px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      {/* Universal Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '380px' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search transcripts, meetings, tasks, decisions... (Press Enter)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '38px', borderRadius: 'var(--radius-full)', background: 'rgba(255, 255, 255, 0.05)', fontSize: '13px' }}
        />
      </form>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/meetings?action=new')}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
          >
            <Plus size={16} />
            <span>New Meeting</span>
          </button>
        )}

        {/* Global Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isFullscreen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            border: isFullscreen ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-glass)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>

        {/* Notification Bell Dropdown (Module 14) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: isOpen ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-glass)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Drawer */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '360px',
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px',
              zIndex: 50
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Personalized Alerts</h4>
                  <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '2px 6px', borderRadius: '10px' }}>
                    {notifications.length}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={markAllAsRead}
                    style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Mark read
                  </button>
                  <button
                    onClick={triggerDemoAlerts}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Demo Alert
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                    No alerts at this moment. You're all caught up!
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link_url) {
                          navigate(n.link_url);
                          setIsOpen(false);
                        }
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        background: n.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.1)',
                        border: n.read ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(99, 102, 241, 0.3)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {getNotifIcon(n.type)}
                        <span style={{ fontSize: '12.5px', fontWeight: n.read ? 500 : 700, color: '#ffffff' }}>
                          {n.title}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
              
              {totalItems > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={10}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
