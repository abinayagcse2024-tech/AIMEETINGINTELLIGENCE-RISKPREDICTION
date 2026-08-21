import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  Clock,
  Video,
  Users,
  Send,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Eye,
  Mail,
  Copy
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export const RescheduleMeetingModal = ({
  meeting,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form State
  const [scheduledStart, setScheduledStart] = useState('');
  const [reason, setReason] = useState('Missed previous scheduled meeting session');
  const [customReason, setCustomReason] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('Online (AI Workspace)');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [createAsNewMeeting, setCreateAsNewMeeting] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [sendEmails, setSendEmails] = useState(true);
  const [requestMode, setRequestMode] = useState('reschedule'); // 'reschedule' (host/admin) or 'request' (attendee asking host)

  // Initialize values when modal opens or meeting changes
  useEffect(() => {
    if (meeting) {
      // Default to tomorrow 10:00 AM local time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      // Format for datetime-local: YYYY-MM-DDTHH:mm
      const pad = (n) => String(n).padStart(2, '0');
      const formattedDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;

      setScheduledStart(formattedDate);
      setMeetingUrl(meeting.meeting_url || 'https://meet.google.com/new');
      setLocation(meeting.location || 'Online (AI Workspace)');
      setReason('Missed previous scheduled meeting session');
      setCustomReason('');
      setAdditionalNotes('');
      setSuccessMessage(null);

      // Set participants
      if (meeting.participants && meeting.participants.length > 0) {
        setSelectedEmails(meeting.participants.map(p => p.email).filter(Boolean));
      } else {
        setSelectedEmails([]);
      }

      // Check if user is host/admin
      const isHost = meeting.host_id === user?.id || user?.role === 'admin';
      setRequestMode(isHost ? 'reschedule' : 'request');
    }
  }, [meeting, user, isOpen]);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !meeting) return null;

  // Preset time helpers
  const setPresetTime = (hoursFromNow) => {
    const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setScheduledStart(formatted);
  };

  const setTomorrowTime = (hour) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setScheduledStart(formatted);
  };

  const setNextWeekTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(10, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setScheduledStart(formatted);
  };

  const finalReason = reason === 'custom' ? (customReason || 'Missed previous meeting session') : reason;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledStart) {
      alert('Please select a new date and time for the meeting.');
      return;
    }

    setLoading(true);
    setSuccessMessage(null);

    try {
      if (requestMode === 'request') {
        // Attendee Request to Host
        const payload = {
          proposed_start: new Date(scheduledStart).toISOString(),
          reason: finalReason,
          notes: additionalNotes || undefined
        };
        const res = await api.meetings.requestReschedule(meeting.id, payload);
        setSuccessMessage(res.message);
        confetti({ particleCount: 60, spread: 60 });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1800);
      } else {
        // Direct Reschedule
        const payload = {
          new_scheduled_start: new Date(scheduledStart).toISOString(),
          reason: finalReason,
          meeting_url: meetingUrl.trim() || undefined,
          location: location.trim() || undefined,
          additional_notes: additionalNotes.trim() || undefined,
          participant_emails: selectedEmails,
          send_notifications: sendNotifications,
          send_emails: sendEmails,
          create_as_new_meeting: createAsNewMeeting
        };

        const res = await api.meetings.reschedule(meeting.id, payload);
        setSuccessMessage(res.message);
        confetti({ particleCount: 90, spread: 70 });
        setTimeout(() => {
          if (onSuccess) onSuccess(res.meeting);
          onClose();
        }, 1600);
      }
    } catch (err) {
      alert(`Failed to reschedule meeting: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmail = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const selectAllEmails = () => {
    if (meeting.participants) {
      setSelectedEmails(meeting.participants.map(p => p.email).filter(Boolean));
    }
  };

  const deselectAllEmails = () => {
    setSelectedEmails([]);
  };

  return createPortal(
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
      padding: isFullScreen ? 0 : '20px',
      boxSizing: 'border-box'
    }}>
      <div className="glass-card" style={{
        width: isFullScreen ? '100vw' : '780px',
        height: isFullScreen ? '100vh' : 'auto',
        maxHeight: isFullScreen ? '100vh' : '92vh',
        maxWidth: isFullScreen ? '100vw' : '100%',
        borderRadius: isFullScreen ? 0 : 'var(--radius-lg)',
        padding: isFullScreen ? '24px 36px' : '26px',
        background: '#0a0f1d',
        border: isFullScreen ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}>
              <RefreshCw size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                {requestMode === 'request' ? 'Request to Schedule Meeting Again' : 'Schedule Meeting Again / Reschedule Session'}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Re-align attendees, send automatic calendar invitations & in-app alerts
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Exit Fullscreen" : "Maximize to Fullscreen"}
              style={{
                background: isFullScreen ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: isFullScreen ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                color: isFullScreen ? '#a5b4fc' : '#ffffff',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isFullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Meeting Information Context Banner */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="badge badge-high" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                Missed / Past Session
              </span>
              <strong style={{ color: '#ffffff', fontSize: '14px' }}>{meeting.title}</strong>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Originally Scheduled: {new Date(meeting.scheduled_start).toLocaleString()}
            </span>
          </div>

          {/* Mode Switcher Toggle (Reschedule vs Request Host) */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              type="button"
              onClick={() => setRequestMode('reschedule')}
              style={{
                background: requestMode === 'reschedule' ? '#6366f1' : 'transparent',
                color: requestMode === 'reschedule' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Direct Reschedule
            </button>
            <button
              type="button"
              onClick={() => setRequestMode('request')}
              style={{
                background: requestMode === 'request' ? '#0ea5e9' : 'transparent',
                color: requestMode === 'request' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Request Host
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{
          flex: 1,
          overflowY: 'auto',
          display: isFullScreen ? 'grid' : 'flex',
          gridTemplateColumns: isFullScreen ? '1.1fr 0.9fr' : '1fr',
          flexDirection: 'column',
          gap: isFullScreen ? '24px' : '16px',
          paddingRight: '4px'
        }}>
          {/* Left Form Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* New Scheduled Start Time with Shortcuts */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarDays size={15} color="#818cf8" />
                  <span>{requestMode === 'request' ? 'Proposed New Date & Time' : 'New Scheduled Start Date & Time'} *</span>
                </label>
              </div>

              <input
                type="datetime-local"
                required
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="form-input"
                style={{ width: '100%', fontSize: '13.5px', padding: '10px 14px' }}
              />

              {/* Quick Time Presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Quick Select:</span>
                <button
                  type="button"
                  onClick={() => setPresetTime(2)}
                  className="tab-btn"
                  style={{ padding: '3px 8px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  +2 Hours
                </button>
                <button
                  type="button"
                  onClick={() => setTomorrowTime(10)}
                  className="tab-btn"
                  style={{ padding: '3px 8px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  Tomorrow 10 AM
                </button>
                <button
                  type="button"
                  onClick={() => setTomorrowTime(14)}
                  className="tab-btn"
                  style={{ padding: '3px 8px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  Tomorrow 2 PM
                </button>
                <button
                  type="button"
                  onClick={setNextWeekTime}
                  className="tab-btn"
                  style={{ padding: '3px 8px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  Next Week
                </button>
              </div>
            </div>

            {/* Reason for Rescheduling */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px', display: 'block' }}>
                Reason for Rescheduling / Missed Session *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-input"
                style={{ width: '100%', fontSize: '13px', padding: '10px 12px', marginBottom: reason === 'custom' ? '8px' : '0' }}
              >
                <option value="Missed previous scheduled meeting session">Missed previous scheduled meeting session</option>
                <option value="Key stakeholders and attendees were unavailable">Key stakeholders and attendees were unavailable</option>
                <option value="Audio / Video connectivity or technical difficulty">Audio / Video connectivity or technical difficulty</option>
                <option value="Schedule conflict with emergency incident">Schedule conflict with emergency incident</option>
                <option value="Follow-up needed on unresolved action items">Follow-up needed on unresolved action items</option>
                <option value="custom">✏️ Custom Reason...</option>
              </select>

              {reason === 'custom' && (
                <input
                  type="text"
                  placeholder="Type custom reason for rescheduling..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
                />
              )}
            </div>

            {/* Meeting URL (Video Call Link) */}
            {requestMode === 'reschedule' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Video size={15} color="#38bdf8" />
                    <span>Video Meeting Link</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMeetingUrl('https://meet.google.com/new')}
                    style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Generate Google Meet Link
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '13px', padding: '9px 12px' }}
                />
              </div>
            )}

            {/* Participant Re-invites Selection */}
            {requestMode === 'reschedule' && meeting.participants && meeting.participants.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={15} color="#34d399" />
                    <span>Re-invite Attendees ({selectedEmails.length}/{meeting.participants.length})</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={selectAllEmails}
                      style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Select All
                    </button>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <button
                      type="button"
                      onClick={deselectAllEmails}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto', padding: '4px' }}>
                  {meeting.participants.map((p, idx) => {
                    const isSelected = selectedEmails.includes(p.email);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleEmail(p.email)}
                        style={{
                          background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          borderRadius: 'var(--radius-full)',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected ? <Check size={12} color="#818cf8" /> : null}
                        <span>{p.name}</span>
                        {!p.attended && (
                          <span style={{ fontSize: '10px', color: '#f87171', background: 'rgba(239, 68, 68, 0.2)', padding: '1px 5px', borderRadius: '4px' }}>
                            Missed
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px', display: 'block' }}>
                Additional Notes / Discussion Points (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Add context or notes for the rescheduled session..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="form-input"
                style={{ width: '100%', fontSize: '12.5px', resize: 'vertical' }}
              />
            </div>

            {/* Checkbox Options */}
            {requestMode === 'reschedule' && (
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendNotifications}
                    onChange={(e) => setSendNotifications(e.target.checked)}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>Send In-App Notification to all attendees</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendEmails}
                    onChange={(e) => setSendEmails(e.target.checked)}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>Dispatch Email Notification with calendar details</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={createAsNewMeeting}
                    onChange={(e) => setCreateAsNewMeeting(e.target.checked)}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span>Create as a new linked follow-up session (preserves current session history)</span>
                </label>
              </div>
            )}
          </div>

          {/* Right Column: Live Email Preview (Visible in Fullscreen or High Res) */}
          {isFullScreen && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 22px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 240px)',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={16} color="#818cf8" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Reschedule Invite Delivery Preview</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rendered Email View</span>
              </div>

              <div style={{ background: '#ffffff', color: '#1e293b', borderRadius: '8px', padding: '20px', fontSize: '13px', fontFamily: 'sans-serif', lineHeight: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
                <div style={{ borderBottom: '2px solid #6366f1', paddingBottom: '10px', marginBottom: '12px' }}>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Missed Session Rescheduled
                  </span>
                  <h4 style={{ margin: '6px 0 2px 0', fontSize: '16px', color: '#1e1b4b', fontWeight: 800 }}>
                    🔄 {meeting.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                    Rescheduled by {user?.name || 'Meeting Host'}
                  </p>
                </div>

                <div style={{ background: '#f0fdf4', borderLeft: '4px solid #10b981', padding: '10px 12px', borderRadius: '4px', marginBottom: '12px' }}>
                  <strong style={{ color: '#166534', fontSize: '11.5px', textTransform: 'uppercase', display: 'block' }}>📅 New Scheduled Time:</strong>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#14532d' }}>
                    {scheduledStart ? new Date(scheduledStart).toLocaleString() : 'Selected Time Slot'}
                  </span>
                </div>

                <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '10px 12px', borderRadius: '4px', marginBottom: '12px' }}>
                  <strong style={{ color: '#92400e', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Reason:</strong>
                  <span style={{ color: '#78350f', fontSize: '12.5px' }}>{finalReason}</span>
                </div>

                {meetingUrl && (
                  <div style={{ textAlign: 'center', margin: '14px 0' }}>
                    <div style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, display: 'inline-block', fontSize: '12px' }}>
                      Join Video Call Link
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '14px', paddingTop: '8px', fontSize: '10.5px', color: '#94a3b8', textAlign: 'center' }}>
                  AI Meeting Intelligence Automated Calendar Sync
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Success Toast */}
        {successMessage && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: 'var(--radius-sm)',
            margin: '12px 0 0 0',
            color: '#6ee7b7',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} flexShrink={0} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '14px'
        }}>
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullScreen ? 'Exit Full Screen' : 'Full Screen View'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
              style={{
                background: requestMode === 'request'
                  ? 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>{requestMode === 'request' ? 'Sending Request...' : 'Rescheduling...'}</span>
                </>
              ) : (
                <>
                  {requestMode === 'request' ? <Send size={15} /> : <RefreshCw size={15} />}
                  <span>{requestMode === 'request' ? 'Send Reschedule Request to Host' : 'Confirm & Reschedule Meeting'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
