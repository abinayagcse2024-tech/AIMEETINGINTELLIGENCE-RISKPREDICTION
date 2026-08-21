import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Download,
  Share2,
  Zap,
  CheckCircle2,
  FileText,
  Play,
  ArrowLeft,
  Video,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Save,
  Mail,
  Send,
  RefreshCw,
  X,
  AlertTriangle,
  ShieldAlert,
  Lock,
  UserCheck,
  UserX,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AudioRecorder } from '../components/AudioRecorder';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { MeetingIntelligenceHub } from '../components/MeetingIntelligenceHub';
import { AgenticAutomationPanel } from '../components/AgenticAutomationPanel';
import { ExportReportModal } from '../components/ExportReportModal';
import { RescheduleMeetingModal } from '../components/RescheduleMeetingModal';
import confetti from 'canvas-confetti';

export const MeetingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [meeting, setMeeting] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [seekTime, setSeekTime] = useState(null);
  const [transcriptPage, setTranscriptPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [taskTotalPages, setTaskTotalPages] = useState(1);
  const [taskTotalItems, setTaskTotalItems] = useState(0);

  // Link state
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [meetingUrlInput, setMeetingUrlInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savingLink, setSavingLink] = useState(false);

  // Email Digest Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTab, setEmailTab] = useState('high_risk'); // 'high_risk' or 'all_digest'
  const [emailRecipients, setEmailRecipients] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentResult, setEmailSentResult] = useState(null);
  const [isEmailFullScreen, setIsEmailFullScreen] = useState(true);

  const handleToggleAttendance = async (participantId, currentAttended) => {
    try {
      await api.meetings.updateAttendance(id, participantId, !currentAttended);
      fetchFullMeetingData();
    } catch (err) {
      alert(`Failed to update attendance: ${err.message}`);
    }
  };

  const fetchFullMeetingData = async () => {
    setLoading(true);
    try {
      // 1. Meeting metadata
      const m = await api.meetings.getById(id);
      setMeeting(m);
      setMeetingUrlInput(m.meeting_url || '');

      // Set default email recipients from participants
      if (m.participants && m.participants.length > 0) {
        setEmailRecipients(m.participants.map(p => p.email).filter(Boolean).join(', '));
      }

      // 2. Transcript & Diarization
      try {
        const tr = await api.transcription.getByMeeting(id, transcriptPage);
        setTranscript(tr);
      } catch (e) {
        setTranscript(null);
      }

      // 3. Summary & Topics
      try {
        const sm = await api.intelligence.getSummary(id);
        setSummary(sm);
      } catch (e) {
        setSummary(null);
      }

      // 4. Decisions
      try {
        const decs = await api.intelligence.getDecisions(id);
        setDecisions(decs);
      } catch (e) {
        setDecisions([]);
      }

      // 5. Tasks
      try {
        const ts = await api.tasks.getAll({ meetingId: id }, taskPage);
        if (ts.data) {
          setTasks(ts.data);
          setTaskTotalPages(ts.total_pages);
          setTaskTotalItems(ts.total);
        } else {
          setTasks(ts);
        }
      } catch (e) {
        setTasks([]);
      }
    } catch (err) {
      console.error('Failed to load meeting details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullMeetingData();
  }, [id, transcriptPage, taskPage]);

  // Lock background scroll when email modal is open
  useEffect(() => {
    if (showEmailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEmailModal]);

  const handleSaveMeetingUrl = async () => {
    setSavingLink(true);
    try {
      const updated = await api.meetings.update(id, { meeting_url: meetingUrlInput.trim() });
      setMeeting(updated);
      setIsEditingLink(false);
    } catch (err) {
      alert(`Failed to save link: ${err.message}`);
    } finally {
      setSavingLink(false);
    }
  };

  const handleCopyLink = () => {
    const urlToCopy = meeting?.meeting_url || window.location.href;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendEmailDigest = async () => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin users have permission to send meeting emails.');
      return;
    }
    setSendingEmail(true);
    setEmailSentResult(null);
    try {
      const list = emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
      const res = await api.meetings.sendEmailDigest(id, { recipients: list });
      setEmailSentResult(res);
      confetti({ particleCount: 60, spread: 60 });
    } catch (err) {
      alert(`Failed to send email digest: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendHighRiskAlerts = async () => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin users can dispatch high-risk alerts.');
      return;
    }
    setSendingEmail(true);
    setEmailSentResult(null);
    try {
      const res = await api.meetings.sendHighRiskAlerts(id);
      setEmailSentResult(res);
      confetti({ particleCount: 80, spread: 70 });
    } catch (err) {
      alert(`Failed to dispatch high risk alert: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const highRiskTasks = tasks.filter(t => t.risk_level === 'high' || (t.risk_score && t.risk_score >= 0.60));

  if (loading) {
    return (
      <div className="page-body" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <Sparkles size={36} color="#6366f1" className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ color: '#ffffff' }}>Loading Meeting Intelligence Workspace...</h3>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="page-body">
        <h2>Meeting not found</h2>
        <button onClick={() => navigate('/meetings')} className="btn-secondary">Back to Meetings</button>
      </div>
    );
  }

  return (
    <div className="page-body animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={() => navigate('/meetings')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
          <ArrowLeft size={14} />
          <span>All Meetings</span>
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {meeting.meeting_url && (
            <a
              href={meeting.meeting_url.startsWith('http') ? meeting.meeting_url : `https://${meeting.meeting_url}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
            >
              <Video size={16} />
              <span>Join Video Call</span>
              <ExternalLink size={14} />
            </a>
          )}

          {/* Schedule Meeting Again / Reschedule Button */}
          <button
            onClick={() => setShowRescheduleModal(true)}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            <RefreshCw size={15} />
            <span>Schedule Again</span>
          </button>

          {/* High Risk Alert Dispatch Button for Admin */}
          {highRiskTasks.length > 0 && (
            <button
              onClick={() => { setEmailTab('high_risk'); setShowEmailModal(true); }}
              className="btn-danger"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
                border: '1px solid #f87171'
              }}
              title={isAdmin ? "Admin: Send High Risk Alert to Assignees" : "High Risk Tasks Detected (Admin Only to dispatch)"}
            >
              <AlertTriangle size={15} />
              <span>⚠️ Send High-Risk Alert ({highRiskTasks.length})</span>
            </button>
          )}

          {/* Email Digest Button */}
          <button
            onClick={() => { setEmailTab('all_digest'); setShowEmailModal(true); }}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
          >
            <Mail size={15} />
            <span>Email Digest</span>
            {!isAdmin && <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '3px', marginLeft: '4px' }}>Admin</span>}
          </button>

          <button onClick={handleCopyLink} className="btn-secondary">
            {copiedLink ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button onClick={() => setShowExportModal(true)} className="btn-secondary">
            <FileText size={15} />
            <span>Export Report</span>
          </button>

          <button onClick={() => navigate('/live')} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <Play size={15} />
            <span>Live Mic Room</span>
          </button>
        </div>
      </div>

      {/* Missed Meeting Alert Banner */}
      {meeting.is_missed && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(220, 38, 38, 0.08) 100%)',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={22} color="#f87171" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', color: '#fca5a5', fontWeight: 700 }}>
                ⚠️ Missed Meeting Session Detected
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
                This session was scheduled for <strong>{new Date(meeting.scheduled_start).toLocaleString()}</strong> and was missed. You can request to schedule it again for a new date/time with 1-click calendar sync.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowRescheduleModal(true)}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              padding: '8px 18px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} />
            <span>🔄 Request to Schedule Meeting Again</span>
          </button>
        </div>
      )}

      {/* Meeting Header Banner */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className={`badge ${meeting.is_missed ? 'badge-high' : meeting.status === 'completed' ? 'badge-low' : 'badge-info'}`} style={{ textTransform: 'uppercase' }}>
                {meeting.is_missed ? '⚠️ MISSED' : meeting.status}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Session ID: #{meeting.id}
              </span>
              {highRiskTasks.length > 0 && (
                <span className="badge badge-high" style={{ animation: 'pulse 2s infinite' }}>
                  ⚠️ {highRiskTasks.length} High-Risk Task(s)
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0' }}>
              {meeting.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarDays size={15} color="#818cf8" />
                <span>{new Date(meeting.scheduled_start).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#38bdf8" />
                <span>{meeting.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} color="#34d399" />
                <span>{meeting.participants?.length || 0} Participants</span>
              </div>
            </div>

            {/* Video Meeting Link Banner / Editor */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              maxWidth: '680px'
            }}>
              {!isEditingLink ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Video size={16} color="#818cf8" flexShrink={0} />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Video Call Link:</span>
                    {meeting.meeting_url ? (
                      <a
                        href={meeting.meeting_url.startsWith('http') ? meeting.meeting_url : `https://${meeting.meeting_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#38bdf8', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        <span>{meeting.meeting_url}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No meeting link posted yet.
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setIsEditingLink(true)}
                    style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#cbd5e1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  >
                    <Edit2 size={12} />
                    <span>{meeting.meeting_url ? 'Edit Link' : '+ Post Link'}</span>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', width: '100%', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="url"
                    placeholder="Paste meeting link (Google Meet, Zoom, MS Teams)..."
                    value={meetingUrlInput}
                    onChange={(e) => setMeetingUrlInput(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '12.5px', padding: '6px 10px', flex: 1 }}
                  />
                  <button
                    onClick={handleSaveMeetingUrl}
                    disabled={savingLink}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                  >
                    <Save size={13} />
                    <span>Save Link</span>
                  </button>
                  <button
                    onClick={() => setIsEditingLink(false)}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px', flexShrink: 0 }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Participant Attendance Manager */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '380px' }}>
              {meeting.participants && meeting.participants.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: p.attended ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                    border: p.attended ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 'var(--radius-full)',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleAttendance(p.id, p.attended)}
                    title={p.attended ? "Click to mark as Missed" : "Click to mark as Attended"}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {p.attended ? <UserCheck size={14} color="#34d399" /> : <UserX size={14} color="#f87171" />}
                  </button>
                  <span style={{ color: p.attended ? '#e2e8f0' : '#fca5a5', fontWeight: 500 }}>
                    {p.name}
                  </span>
                  {!p.attended && (
                    <button
                      type="button"
                      onClick={() => setShowRescheduleModal(true)}
                      title="Request reschedule for absent participant"
                      style={{
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: 'none',
                        color: '#fecaca',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click icon to toggle Attendance (Attended / Missed)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left Column: Audio Recorder & STT Transcript Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Module 5: Audio Recording & Upload */}
          <AudioRecorder
            meetingId={meeting.id}
            onRecordingComplete={fetchFullMeetingData}
          />

          {/* Module 6 & 7: Speech-to-Text & Speaker Diarization */}
          <TranscriptViewer
            transcript={transcript}
            onSeekTimestamp={(time) => setSeekTime(time)}
            meetingId={meeting.id}
            meeting={meeting}
            onMappingUpdated={fetchFullMeetingData}
          />
        </div>

        {/* Right Column: AI Intelligence Hub & Agentic Automation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Module 8, 9, 11, 12: Intelligence Hub */}
          <MeetingIntelligenceHub
            summary={summary}
            decisions={decisions}
            tasks={tasks}
            meetingId={meeting.id}
            onRefresh={fetchFullMeetingData}
          />

          {/* Module 17: Agentic Automation Panel */}
          <AgenticAutomationPanel
            meetingId={meeting.id}
            onExecutionComplete={fetchFullMeetingData}
          />
        </div>
      </div>

      {/* Export Report Modal (Module 16) */}
      <ExportReportModal
        meetingId={meeting.id}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Send Email Follow-Up & High-Risk Alert Modal (Module 17) */}
      {showEmailModal && createPortal(
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
          padding: isEmailFullScreen ? 0 : '20px',
          boxSizing: 'border-box'
        }}>
          <div className="glass-card" style={{
            width: isEmailFullScreen ? '100vw' : '760px',
            height: isEmailFullScreen ? '100vh' : 'auto',
            maxHeight: isEmailFullScreen ? '100vh' : '90vh',
            maxWidth: isEmailFullScreen ? '100vw' : '100%',
            borderRadius: isEmailFullScreen ? 0 : 'var(--radius-lg)',
            padding: isEmailFullScreen ? '24px 36px' : '26px',
            background: '#0b101e',
            border: isEmailFullScreen ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: emailTab === 'high_risk' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)' }}>
                  {emailTab === 'high_risk' ? <ShieldAlert size={22} color="#ffffff" /> : <Mail size={22} color="#ffffff" />}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                    {emailTab === 'high_risk' ? '⚠️ High-Risk Task Mitigation Alert' : 'Send Meeting Email Digest'}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {isAdmin ? '👑 Administrator Dispatched Email Engine • Module 17' : '🔒 Administrator Access Required'}
                  </span>
                </div>
              </div>

              {/* Top Action Controls: Fullscreen Toggle & Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEmailFullScreen(!isEmailFullScreen)}
                  title={isEmailFullScreen ? "Exit Fullscreen (Restore Window)" : "Maximize to Fullscreen"}
                  style={{
                    background: isEmailFullScreen ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    border: isEmailFullScreen ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                    color: isEmailFullScreen ? '#a5b4fc' : '#ffffff',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isEmailFullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
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

            {/* Admin Permission Warning if not Admin */}
            {!isAdmin && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} flexShrink={0} />
                <span><strong>Admin Only:</strong> You are currently logged in as a standard member (<code>{user?.role}</code>). Only workspace administrators have permission to dispatch email digests and high-risk alerts.</span>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setEmailTab('high_risk')}
                style={{
                  background: emailTab === 'high_risk' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: emailTab === 'high_risk' ? '#f87171' : 'var(--text-secondary)',
                  border: emailTab === 'high_risk' ? '1px solid #ef4444' : '1px solid transparent',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <AlertTriangle size={15} />
                <span>High-Risk Task Alerts ({highRiskTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setEmailTab('all_digest')}
                style={{
                  background: emailTab === 'all_digest' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: emailTab === 'all_digest' ? '#818cf8' : 'var(--text-secondary)',
                  border: emailTab === 'all_digest' ? '1px solid #6366f1' : '1px solid transparent',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Mail size={15} />
                <span>All Attendees Summary</span>
              </button>
            </div>

            {/* Main Modal Content Body (Supports 2-Column Split in Fullscreen) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: isEmailFullScreen ? 'grid' : 'block',
              gridTemplateColumns: isEmailFullScreen ? '1fr 1fr' : '1fr',
              gap: isEmailFullScreen ? '28px' : '16px',
              paddingRight: '4px'
            }}>
              {/* Left Pane / Main Settings */}
              <div>
                {/* TAB 1: High Risk Tasks Targeted to Assignee */}
                {emailTab === 'high_risk' && (
                  <div>
                    <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Targeted alerts will be sent <strong>directly to the assigned owner for each high-risk task</strong> with their ML delay probability and recommended mitigation tips:
                    </div>

                    {highRiskTasks.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', color: '#6ee7b7' }}>
                        <CheckCircle2 size={32} style={{ margin: '0 auto 8px' }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>All tasks are on track! No high-risk items detected in this meeting.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px', maxHeight: isEmailFullScreen ? 'calc(100vh - 290px)' : '240px', overflowY: 'auto' }}>
                        {highRiskTasks.map(t => (
                          <div key={t.id} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <UserCheck size={15} color="#f87171" />
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5' }}>
                                  Recipient: {t.assignee_name} {t.assignee_email ? `(${t.assignee_email})` : ''}
                                </span>
                              </div>
                              <span className="badge badge-high" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                {Math.round((t.risk_score || 0.85) * 100)}% Delay Risk
                              </span>
                            </div>
                            <div style={{ fontSize: '13.5px', color: '#ffffff', fontWeight: 600, marginBottom: '6px' }}>{t.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(0, 0, 0, 0.25)', padding: '6px 10px', borderRadius: '6px' }}>
                              💡 <i>Mitigation: {t.ai_mitigation_tip || 'Reassign sub-tasks and hold a 15-minute unblocker sync.'}</i>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: All Attendees Digest */}
                {emailTab === 'all_digest' && (
                  <div>
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Attendee Recipients (Comma-separated emails)
                        </label>
                        {meeting?.participants && meeting.participants.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#818cf8' }}>
                            {meeting.participants.length} participant(s) detected
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={emailRecipients}
                        onChange={(e) => setEmailRecipients(e.target.value)}
                        className="form-input"
                        placeholder="colleague1@company.com, colleague2@company.com"
                        style={{ width: '100%', fontSize: '13px', padding: '10px 14px' }}
                      />

                      {/* Quick Attendee Add/Remove Chips */}
                      {meeting?.participants && meeting.participants.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          {meeting.participants.map((p, idx) => {
                            const isIncluded = emailRecipients.includes(p.email || p.name);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  const pEmail = p.email || p.name;
                                  if (isIncluded) {
                                    const updated = emailRecipients
                                      .split(',')
                                      .map(x => x.trim())
                                      .filter(x => x && x !== pEmail && x !== p.email && x !== p.name)
                                      .join(', ');
                                    setEmailRecipients(updated);
                                  } else {
                                    setEmailRecipients(emailRecipients ? `${emailRecipients}, ${pEmail}` : pEmail);
                                  }
                                }}
                                style={{
                                  background: isIncluded ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                  border: isIncluded ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                                  color: isIncluded ? '#c7d2fe' : 'var(--text-muted)',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '3px 10px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}
                              >
                                {isIncluded ? '✓ ' : '+ '} {p.name} ({p.role || 'Member'})
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <div style={{ color: '#c7d2fe', fontWeight: 600, marginBottom: '4px' }}>
                        Subject: 📋 Meeting Summary & Action Items: {meeting?.title}
                      </div>
                      <p style={{ margin: 0 }}>Includes Executive Summary, {decisions.length} recorded decision(s), and {tasks.length} task(s).</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Pane: Live Email Preview (Visible in Fullscreen or Expansive View) */}
              {isEmailFullScreen && (
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
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Live Email Delivery Preview</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rendered HTML Template</span>
                  </div>

                  {/* Mock Email Client Container */}
                  <div style={{ background: '#ffffff', color: '#1e293b', borderRadius: '8px', padding: '20px', fontSize: '13px', fontFamily: 'sans-serif', lineHeight: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
                    <div style={{ borderBottom: '2px solid #6366f1', paddingBottom: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#1e1b4b', fontWeight: 800 }}>⚡ AI Meeting Intelligence Digest</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Generated on {new Date().toLocaleDateString()} for {meeting?.title}</p>
                      </div>
                      <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                        Enterprise AI
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '14px' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>Executive Summary:</strong>
                      <p style={{ margin: 0, color: '#334155', fontSize: '12px' }}>
                        {summary?.executive_summary || 'The team reviewed key milestones, discussed deliverables, and agreed on actionable next steps.'}
                      </p>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>Key Decisions ({decisions.length}):</strong>
                      {decisions.length === 0 ? (
                        <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No formal decisions recorded.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155', fontSize: '12px' }}>
                          {decisions.map(d => (
                            <li key={d.id} style={{ marginBottom: '4px' }}>
                              <strong>{d.decision_text}</strong> (Impact: {d.impact_level || 'Medium'})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>Action Items & Risk Status ({tasks.length}):</strong>
                      {tasks.length === 0 ? (
                        <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No pending tasks assigned.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {tasks.map(t => (
                            <div key={t.id} style={{ background: t.risk_level === 'high' ? '#fef2f2' : '#f8fafc', border: t.risk_level === 'high' ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: '4px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '12px' }}>{t.title}</span>
                                <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '6px' }}>→ {t.assignee_name}</span>
                              </div>
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: t.risk_level === 'high' ? '#dc2626' : '#2563eb' }}>
                                {t.risk_level === 'high' ? '⚠️ High Risk' : t.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '16px', paddingTop: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                      Automated by Enterprise AI Meeting Intelligence • Confidential
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Result Toast */}
            {emailSentResult && (
              <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: 'var(--radius-sm)', margin: '14px 0', color: '#6ee7b7', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} flexShrink={0} />
                <span>{emailSentResult.message}</span>
              </div>
            )}

            {/* Modal Action Controls Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEmailFullScreen(!isEmailFullScreen)}
                  className="btn-secondary"
                  style={{ fontSize: '12.5px', padding: '8px 14px' }}
                >
                  {isEmailFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span>{isEmailFullScreen ? 'Exit Full Screen' : 'Full Screen View'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => setShowEmailModal(false)} className="btn-secondary">
                  Close
                </button>

                {emailTab === 'high_risk' ? (
                  <button
                    type="button"
                    onClick={handleSendHighRiskAlerts}
                    disabled={sendingEmail || !isAdmin || highRiskTasks.length === 0}
                    className="btn-danger"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 14px rgba(239, 68, 68, 0.4)' }}
                  >
                    {sendingEmail ? <RefreshCw size={15} className="animate-spin" /> : <AlertTriangle size={15} />}
                    <span>{sendingEmail ? 'Dispatching...' : `Dispatch Alert to ${highRiskTasks.length} Assignee(s)`}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendEmailDigest}
                    disabled={sendingEmail || !isAdmin}
                    className="btn-primary"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                  >
                    {sendingEmail ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                    <span>{sendingEmail ? 'Sending...' : 'Send Summary to All Attendees'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reschedule Missed Meeting Modal */}
      <RescheduleMeetingModal
        meeting={meeting}
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        onSuccess={(updated) => {
          fetchFullMeetingData();
          if (updated?.id && updated.id !== meeting.id) {
            navigate(`/meetings/${updated.id}`);
          }
        }}
      />
    </div>
  );
};
