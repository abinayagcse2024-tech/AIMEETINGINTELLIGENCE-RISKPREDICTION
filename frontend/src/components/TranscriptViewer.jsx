import React, { useState, useEffect } from 'react';
import { Download, Search, User, Clock, MessageSquare, Volume2, Sparkles, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { Pagination } from './Pagination';

export const TranscriptViewer = ({ transcript, onSeekTimestamp, meetingId, meeting, onMappingUpdated, onPageChange }) => {
  const [filterText, setFilterText] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  
  const [mappingState, setMappingState] = useState(meeting?.speaker_mapping || {});
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  useEffect(() => {
    if (meeting?.speaker_mapping) {
      setMappingState(meeting.speaker_mapping);
    }
  }, [meeting?.speaker_mapping]);

  const segmentsData = transcript?.segments?.data || [];
  const { page, totalPages, total } = transcript?.segments || { page: 1, totalPages: 1, total: 0 };

  if (!transcript || !segmentsData || segmentsData.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
        <MessageSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          No Transcript Generated Yet
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Record or upload meeting audio above and click 'Process & Transcribe Meeting' to generate diarized transcripts.
        </p>
      </div>
    );
  }

  // Get unique speakers for filter chips
  const speakers = Array.from(new Set(segmentsData.map(s => s.speaker_label)));

  const filteredSegments = segmentsData.filter(seg => {
    const matchesText = seg.text.toLowerCase().includes(filterText.toLowerCase()) ||
                        seg.speaker_label.toLowerCase().includes(filterText.toLowerCase());
    const matchesSpeaker = selectedSpeaker === 'all' || seg.speaker_label === selectedSpeaker;
    return matchesText && matchesSpeaker;
  });

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSentimentBadge = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '1px 6px', borderRadius: '4px' }}>Positive</span>;
      case 'constructive':
        return <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '1px 6px', borderRadius: '4px' }}>Constructive</span>;
      case 'negative':
        return <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '1px 6px', borderRadius: '4px' }}>Concern</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Speech-to-Text & Speaker Diarization</span>
            <span className="badge badge-info" style={{ fontSize: '11px' }}>
              {transcript.word_count} words • {(transcript.confidence_score * 100).toFixed(0)}% accuracy
            </span>
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Module 6 & 7: Timestamped dialogues mapped to participants
          </span>
        </div>

        {/* Download Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={api.transcription.download(meetingId, 'txt')}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Download size={13} />
            <span>TXT</span>
          </a>
          <a
            href={api.transcription.download(meetingId, 'vtt')}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Download size={13} />
            <span>WebVTT</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search within this transcript..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '32px', fontSize: '12.5px', padding: '6px 12px 6px 32px' }}
          />
        </div>

        {/* Speaker Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => setSelectedSpeaker('all')}
            style={{
              background: selectedSpeaker === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: selectedSpeaker === 'all' ? '1px solid #6366f1' : '1px solid var(--border-glass)',
              color: selectedSpeaker === 'all' ? '#ffffff' : 'var(--text-secondary)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            All Speakers
          </button>
          {speakers.map((spk, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSpeaker(spk)}
              style={{
                background: selectedSpeaker === spk ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedSpeaker === spk ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                color: selectedSpeaker === spk ? '#ffffff' : 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {spk}
            </button>
          ))}
        </div>
      </div>

      {/* Speaker Mapping Settings */}
      {speakers.length > 0 && meeting?.participants && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <UserCheck size={15} color="#8b5cf6" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Identify Speakers</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {speakers.map(spk => (
              <div key={spk} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600, minWidth: '70px' }}>{spk}</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <select
                  className="form-input"
                  style={{ fontSize: '12px', padding: '4px 24px 4px 8px', minWidth: '140px', height: '28px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                  value={mappingState[spk] || ''}
                  onChange={(e) => {
                    const newMapping = { ...mappingState, [spk]: e.target.value };
                    setMappingState(newMapping);
                  }}
                >
                  <option value="">Unknown (Keep Label)</option>
                  {meeting.participants.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
            <button
              onClick={async () => {
                setIsSavingMapping(true);
                try {
                  await api.meetings.updateSpeakerMapping(meetingId, mappingState);
                  if (onMappingUpdated) onMappingUpdated();
                } catch(e) {
                  alert(`Failed to save mapping: ${e.message}`);
                } finally {
                  setIsSavingMapping(false);
                }
              }}
              disabled={isSavingMapping}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '12.5px', height: '30px' }}
            >
              {isSavingMapping ? 'Saving...' : 'Save Mapping'}
            </button>
          </div>
        </div>
      )}

      {/* Diarized Dialogue Stream */}
      <div style={{
        maxHeight: '440px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingRight: '6px'
      }}>
        {filteredSegments.map((seg, i) => (
          <div
            key={i}
            onClick={() => onSeekTimestamp && onSeekTimestamp(seg.start_time)}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-glass)',
              transition: 'all 0.15s ease',
              cursor: onSeekTimestamp ? 'pointer' : 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'var(--border-glass)';
            }}
          >
            {/* Speaker Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {(mappingState[seg.speaker_label] || seg.speaker_label).charAt(0)}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  {mappingState[seg.speaker_label] || seg.speaker_label}
                </span>
                {getSentimentBadge(seg.sentiment)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
                <Clock size={12} />
                <span>{formatSeconds(seg.start_time)} - {formatSeconds(seg.end_time)}</span>
              </div>
            </div>

            {/* Segment Dialogue Text */}
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>
              {seg.text}
            </p>
          </div>
        ))}
      </div>

      {total > 0 && onPageChange && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={20}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
