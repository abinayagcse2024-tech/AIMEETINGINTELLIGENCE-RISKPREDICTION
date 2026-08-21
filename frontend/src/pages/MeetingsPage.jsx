import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  Search,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRight,
  Video,
  ExternalLink,
  Copy,
  Check,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  X,
  Eye,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RescheduleMeetingModal } from '../components/RescheduleMeetingModal';
import { Pagination } from '../components/Pagination';

export const MeetingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchParams] = useSearchParams();
  const [meetings, setMeetings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showModal, setShowModal] = useState(searchParams.get('action') === 'new' && isAdmin);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [isModalFullScreen, setIsModalFullScreen] = useState(true);
  const [rescheduleMeeting, setRescheduleMeeting] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agenda, setAgenda] = useState('');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('Online (AI Workspace)');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/new');
  const [participantEmails, setParticipantEmails] = useState('');

  // Lock background scroll when modal is active
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const filter = statusFilter === 'all' ? null : statusFilter;
      const res = await api.meetings.getAll(filter, page, 2);
      if (res.data) {
        setMeetings(res.data);
        setTotalPages(res.total_pages);
        setTotalItems(res.total);
      } else {
        setMeetings(res);
      }
    } catch (err) {
      console.error('Failed to load meetings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [statusFilter, page]);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      const emailList = participantEmails.split(',').map(em => em.trim()).filter(Boolean);
      const participants = emailList.map(em => ({
        name: em.split('@')[0].replace('.', ' ').toUpperCase(),
        email: em,
        role: 'attendee',
        attended: true
      }));

      const payload = {
        title,
        description,
        agenda,
        scheduled_start: new Date(startDate || Date.now()).toISOString(),
        location,
        meeting_url: meetingUrl.trim() || undefined,
        status: 'scheduled',
        participants
      };

      const res = await api.meetings.create(payload);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setAgenda('');
      setMeetingUrl('https://meet.google.com/new');
      fetchMeetings();
      navigate(`/meetings/${res.id}`);
    } catch (err) {
      alert(`Failed to create meeting: ${err.message}`);
    }
  };

  const handleDeleteMeeting = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await api.meetings.delete(id);
        fetchMeetings();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleCopyLink = (url, id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMeetings = meetings.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.agenda?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.scheduled_at) - new Date(a.scheduled_at);
    if (sortBy === 'date_asc') return new Date(a.scheduled_at) - new Date(b.scheduled_at);
    if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
    if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
    return 0;
  });

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Meetings Management & Scheduling</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Modules 3 & 4: Post meeting links (Google Meet, Zoom, Teams), manage agendas, transcripts, and intelligence hubs.
          </p>
        </div>

        {isAdmin ? (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} />
            <span>Post & Schedule Meeting</span>
          </button>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-glass)' }}>
            🔒 Host / Admin Permission Required to Schedule
          </span>
        )}
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search meetings by title or agenda..."
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
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'scheduled', 'missed', 'completed', 'in_progress'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className="tab-btn"
              style={{
                background: statusFilter === st
                  ? (st === 'missed' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.25)')
                  : 'rgba(255, 255, 255, 0.05)',
                color: statusFilter === st
                  ? (st === 'missed' ? '#fca5a5' : '#ffffff')
                  : 'var(--text-secondary)',
                border: statusFilter === st
                  ? (st === 'missed' ? '1px solid #ef4444' : '1px solid #6366f1')
                  : '1px solid var(--border-glass)',
                padding: '6px 14px',
                fontSize: '12.5px',
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {st === 'missed' && <AlertTriangle size={12} />}
              <span>{st === 'in_progress' ? 'In Progress' : st}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Meeting Cards List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Loading meetings...</p>
      ) : filteredMeetings.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <CalendarDays size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ color: '#ffffff', marginBottom: '6px' }}>No Meetings Found</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Click 'Post & Schedule Meeting' to create your first session.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredMeetings.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/meetings/${m.id}`)}
              className="glass-card glass-card-interactive"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '250px',
                borderColor: m.is_missed ? 'rgba(239, 68, 68, 0.35)' : undefined,
                background: m.is_missed ? 'rgba(239, 68, 68, 0.03)' : undefined
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${m.is_missed ? 'badge-high' : m.status === 'completed' ? 'badge-low' : m.status === 'in_progress' ? 'badge-purple' : 'badge-info'}`} style={{ textTransform: 'uppercase' }}>
                      {m.is_missed ? '⚠️ MISSED' : m.status}
                    </span>
                    {m.meeting_url && (
                      <span className="badge badge-purple" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Video size={11} /> Video Link Ready
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRescheduleMeeting(m);
                        setShowRescheduleModal(true);
                      }}
                      title="Reschedule this meeting"
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        color: '#a5b4fc',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshCw size={11} />
                      <span>Reschedule</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteMeeting(m.id, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Delete Meeting"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  {m.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {m.description || m.agenda || 'No agenda detailed.'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} />
                    <span>{new Date(m.scheduled_start).toLocaleDateString()} {new Date(m.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Users size={13} />
                    <span>{m.participants?.length || 0} Attendees</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{m.location}</span>
                  </div>
                </div>

                {/* Meeting Link Bar if available */}
                {m.meeting_url && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', marginRight: '8px' }}>
                      <Video size={14} color="#818cf8" flexShrink={0} />
                      <span style={{ fontSize: '12px', color: '#c7d2fe', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.meeting_url}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => handleCopyLink(m.meeting_url, m.id, e)}
                        title="Copy meeting link"
                        style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {copiedId === m.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={m.meeting_url.startsWith('http') ? m.meeting_url : `https://${m.meeting_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'var(--accent-gradient)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>Join</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Intelligence Status Badges & Open Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {m.has_transcript && <span className="badge badge-purple" style={{ fontSize: '10.5px' }}>STT Done</span>}
                    {m.has_summary && <span className="badge badge-low" style={{ fontSize: '10.5px' }}>Summary</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open Workspace <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && totalItems > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={2}
          onPageChange={setPage}
        />
      )}

      {/* Schedule & Post Meeting Modal */}
      {showModal && createPortal(
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
          padding: isModalFullScreen ? 0 : '20px',
          boxSizing: 'border-box'
        }}>
          <div className="glass-card" style={{
            width: isModalFullScreen ? '100vw' : '640px',
            height: isModalFullScreen ? '100vh' : 'auto',
            maxHeight: isModalFullScreen ? '100vh' : '90vh',
            maxWidth: isModalFullScreen ? '100vw' : '100%',
            borderRadius: isModalFullScreen ? 0 : 'var(--radius-lg)',
            padding: isModalFullScreen ? '24px 36px' : '28px',
            background: '#0a0f1d',
            border: isModalFullScreen ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)' }}>
                  <CalendarDays size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>Post & Schedule Meeting</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Add meeting metadata, agenda, attendees & video conference link
                  </span>
                </div>
              </div>

              {/* Fullscreen & Close Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalFullScreen(!isModalFullScreen)}
                  title={isModalFullScreen ? "Restore window size" : "Expand to Fullscreen"}
                  style={{
                    background: isModalFullScreen ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    border: isModalFullScreen ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                    color: isModalFullScreen ? '#a5b4fc' : '#ffffff',
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
                  {isModalFullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

            {/* Modal Body with 2-Column Split in Fullscreen */}
            <form onSubmit={handleCreateMeeting} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: isModalFullScreen ? 'grid' : 'block',
                gridTemplateColumns: isModalFullScreen ? '1fr 1fr' : '1fr',
                gap: isModalFullScreen ? '32px' : '16px',
                paddingRight: '4px'
              }}>
                {/* Left Column: Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Meeting Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Q3 Architecture Scalability & STT Review"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  {/* Video Meeting Link Input */}
                  <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Video size={15} />
                        <span>Meeting Link (Google Meet, Zoom, MS Teams)</span>
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setMeetingUrl('https://meet.google.com/new')}
                          style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          + Google Meet
                        </button>
                        <button
                          type="button"
                          onClick={() => setMeetingUrl('https://zoom.us/join')}
                          style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(129, 140, 248, 0.3)', color: '#818cf8', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          + Zoom
                        </button>
                      </div>
                    </div>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/123456"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Meeting Agenda</label>
                    <textarea
                      placeholder="1. Database indexing&#10;2. Real-time audio latency&#10;3. Action item assignments"
                      value={agenda}
                      onChange={(e) => setAgenda(e.target.value)}
                      className="form-textarea"
                      style={{ minHeight: isModalFullScreen ? '130px' : '90px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Date & Time</label>
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Location / Room</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Participant Emails (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={participantEmails}
                      onChange={(e) => setParticipantEmails(e.target.value)}
                      className="form-input"
                      placeholder="colleague1@company.com, colleague2@company.com"
                    />
                  </div>
                </div>

                {/* Right Column: Live Schedule Card Preview (Visible in Fullscreen) */}
                {isModalFullScreen && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <Eye size={16} color="#818cf8" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Live Meeting Card Preview</span>
                      </div>

                      {/* Mock Meeting Card */}
                      <div className="glass-card" style={{ padding: '20px', background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                            SCHEDULED
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            AI Intelligence Ready
                          </span>
                        </div>

                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                          {title || 'Untitled Meeting Session'}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} color="#818cf8" />
                            <span>{startDate ? new Date(startDate).toLocaleString() : 'Date & Time to be set'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={14} color="#06b6d4" />
                            <span>{location || 'Online'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={14} color="#10b981" />
                            <span>{participantEmails ? participantEmails.split(',').filter(Boolean).length : 0} Invitee(s)</span>
                          </div>
                        </div>

                        {agenda && (
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-glass)', marginBottom: '14px' }}>
                            <strong style={{ fontSize: '11.5px', color: '#c7d2fe', display: 'block', marginBottom: '4px' }}>Agenda Outline:</strong>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                              {agenda}
                            </p>
                          </div>
                        )}

                        {meetingUrl && (
                          <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontSize: '12px' }}>
                              <Video size={14} />
                              <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meetingUrl}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>Join Link Active</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      💡 <i>Automated AI transcription, speech-to-text, executive summary generation, and task risk tracking will be enabled immediately upon creation.</i>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalFullScreen(!isModalFullScreen)}
                  className="btn-secondary"
                  style={{ fontSize: '12.5px', padding: '8px 14px' }}
                >
                  {isModalFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span>{isModalFullScreen ? 'Exit Full Screen' : 'Full Screen View'}</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <Plus size={16} />
                    <span>Post & Schedule Meeting</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Reschedule Missed Meeting Modal */}
      <RescheduleMeetingModal
        meeting={rescheduleMeeting}
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        onSuccess={() => fetchMeetings()}
      />
    </div>
  );
};
