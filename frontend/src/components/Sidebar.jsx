import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Mic,
  CheckSquare,
  AlertTriangle,
  Bot,
  Zap,
  BarChart3,
  Search,
  User,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { path: '/meetings', label: 'Meetings Hub', icon: CalendarDays, badge: 'Active' },
  { path: '/live', label: 'Live Recording', icon: Mic, badge: 'Live' },
  { path: '/tasks', label: 'Tasks & Kanban', icon: CheckSquare, badge: null },
  { path: '/risk-inspector', label: 'ML Risk Inspector', icon: AlertTriangle, badge: 'AI ML' },
  { path: '/automation', label: 'Agentic & n8n', icon: Zap, badge: 'Agent' },
  { path: '/analytics', label: 'Insights & Reports', icon: BarChart3, badge: null },
  { path: '/search', label: 'Universal Search', icon: Search, badge: null },
  { path: '/profile', label: 'User Profile', icon: User, badge: null },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(11, 15, 25, 0.95)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)'
        }}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            MeetIntel AI
          </h2>
          <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, letterSpacing: '0.04em' }}>
            17 MODULE SUITE
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Platform Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'transparent',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                transition: 'all 0.15s ease'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: item.badge === 'Live' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: item.badge === 'Live' ? '#f87171' : '#818cf8',
                  border: item.badge === 'Live' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile Card */}
      {user && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass-bright)' }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                  {user.name}
                </p>
                <span style={{
                  fontSize: '10.5px',
                  color: user.role === 'admin' ? '#a78bfa' : '#38bdf8',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {user.role} • {user.job_title || 'Member'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
