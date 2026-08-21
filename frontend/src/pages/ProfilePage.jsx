import React, { useState } from 'react';
import { User, Mail, Briefcase, Building, Bell, Save, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || 'Staff Architect');
  const [department, setDepartment] = useState(user?.department || 'Core Engineering');
  const [emailNotifs, setEmailNotifs] = useState(user?.preferences?.email_notifications ?? true);
  const [taskReminders, setTaskReminders] = useState(user?.preferences?.task_reminders ?? true);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.users.updateProfile({
        name,
        job_title: jobTitle,
        department,
        preferences: {
          email_notifications: emailNotifs,
          task_reminders: taskReminders
        }
      });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(`Failed to update profile: ${err.message}`);
    }
  };

  return (
    <div className="page-body animate-fade-in" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">User Profile & Preferences</h1>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Module 2: Manage account credentials, enterprise role, notification thresholds, and personal preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Avatar & Role Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <img
            src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
            alt="Profile Avatar"
            style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid #6366f1', objectFit: 'cover' }}
          />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
              {user?.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${user?.role === 'admin' ? 'badge-purple' : 'badge-info'}`} style={{ textTransform: 'uppercase' }}>
                <Shield size={12} />
                {user?.role} Role
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="form-input"
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Notification Preferences (Module 14) */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="#818cf8" />
            <span>Automated Notification Settings</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
              />
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                  Email Meeting Follow-Up Digests
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Receive post-meeting executive summaries and extracted decisions directly to your inbox.
                </span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={taskReminders}
                onChange={(e) => setTaskReminders(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
              />
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                  High-Risk Task & Deadline Reminders
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Get automated proactive alerts when machine learning flags potential schedule delays.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {saved ? (
            <span style={{ color: '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Preferences updated successfully!
            </span>
          ) : <span />}

          <button type="submit" className="btn-primary">
            <Save size={16} />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
