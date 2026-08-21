import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Square,
  Sparkles,
  Volume2,
  User,
  CheckCircle2,
  Award,
  Zap,
  ArrowLeft,
  Radio,
  FileText,
  Save,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export const LiveMeetingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const hostLabel = user?.role === 'admin' ? `${user?.name || 'Admin'} (Host)` : `${user?.name || 'User'} (Speaker)`;
  const [isLive, setIsLive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [activeSpeaker, setActiveSpeaker] = useState(hostLabel);
  const [liveInterimText, setLiveInterimText] = useState('');
  const [liveDialogue, setLiveDialogue] = useState([]);
  const [notes, setNotes] = useState('');
  const [sessionTitle, setSessionTitle] = useState('Live AI Meeting Session');
  const [isSaving, setIsSaving] = useState(false);
  const [speakersList, setSpeakersList] = useState([hostLabel]);
  const [newSpeakerInput, setNewSpeakerInput] = useState('');
  const [showAddSpeaker, setShowAddSpeaker] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const activeSpeakerRef = useRef(activeSpeaker);
  const isLiveRef = useRef(false);

  useEffect(() => {
    activeSpeakerRef.current = activeSpeaker;
  }, [activeSpeaker]);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const handleAddSpeaker = () => {
    const trimmed = newSpeakerInput.trim();
    if (trimmed && !speakersList.includes(trimmed)) {
      setSpeakersList(prev => [...prev, trimmed]);
      setActiveSpeaker(trimmed);
      setNewSpeakerInput('');
      setShowAddSpeaker(false);
    }
  };

  const startLiveRoom = async () => {
    try {
      // 1. Microphone capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Web Audio Analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);

      setIsLive(true);
      setSessionSeconds(0);

      // Timer
      timerRef.current = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);

      // 3. Web Speech Recognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';

        recognizer.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              const text = transcript.trim();
              if (text.length > 0) {
                const currentSpk = activeSpeakerRef.current;
                const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                let sentiment = 'neutral';
                const lower = text.toLowerCase();
                if (lower.includes('good') || lower.includes('great') || lower.includes('agree') || lower.includes('done') || lower.includes('complete') || lower.includes('perfect')) {
                  sentiment = 'positive';
                } else if (lower.includes('risk') || lower.includes('urgent') || lower.includes('issue') || lower.includes('delay') || lower.includes('blocker')) {
                  sentiment = 'urgent';
                }

                setLiveDialogue(prev => [
                  ...prev,
                  { speaker: currentSpk, time: timeStr, text, sentiment }
                ]);
                setLiveInterimText('');
              }
            } else {
              interim += transcript;
            }
          }
          if (interim) setLiveInterimText(interim);
        };

        recognizer.onerror = (err) => {
          console.log('[Live STT Info]:', err.error);
        };

        recognizer.onend = () => {
          if (isLiveRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {}
          }
        };

        recognizer.start();
        recognitionRef.current = recognizer;
      }

      // Draw dynamic visualizer
      drawWave();
    } catch (err) {
      console.error('Microphone error:', err);
      alert(`Microphone access error: ${err.message}. Please check browser permissions.`);
    }
  };

  const stopLiveRoom = () => {
    setIsLive(false);
    stopAllMedia();
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.7 }
    });
  };

  const drawWave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(11, 15, 25, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.9;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(0.5, '#6366f1');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    };
    render();
  };

  // Convert Live dialogue to full meeting and run AI summarization
  const handleSaveAndGenerateSummary = async () => {
    setIsSaving(true);
    try {
      const fullText = liveDialogue.map(d => `[${d.speaker}]: ${d.text}`).join('\n');
      
      // 1. Create meeting
      const meetingPayload = {
        title: sessionTitle || 'Live Audio Broadcast Session',
        description: `Live session conducted on ${new Date().toLocaleString()}. Notes: ${notes}`,
        agenda: 'Real-time broadcast transcription and AI intelligence extraction',
        scheduled_start: new Date().toISOString(),
        location: 'Live Voice Broadcast Room',
        status: 'completed',
        participants: speakersList.map(name => ({
          name,
          email: (name.includes(user?.name || '') || name.includes('Host')) ? (user?.email || 'host@meetintel.ai') : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`,
          role: name.includes('Host') ? 'host' : 'attendee',
          attended: true
        }))
      };

      const meeting = await api.meetings.create(meetingPayload);

      // 2. Upload audio payload with real live transcript text
      const formData = new FormData();
      const dummyBlob = new Blob([new Uint8Array(44)], { type: 'audio/wav' });
      formData.append('file', dummyBlob, 'live_broadcast.wav');
      formData.append('duration', sessionSeconds || 60);
      formData.append('media_type', 'audio');
      formData.append('raw_transcript', fullText || (notes ? `Live Notes: ${notes}` : 'Meeting session completed.'));

      await api.audio.upload(meeting.id, formData);

      // Navigate to newly created meeting workspace
      navigate(`/meetings/${meeting.id}`);
    } catch (err) {
      console.error('Failed to save session:', err);
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page-body animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={() => navigate('/meetings')} className="btn-secondary">
          <ArrowLeft size={14} />
          <span>Exit Live Room</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '20px',
            fontWeight: 800,
            color: isLive ? '#ef4444' : '#ffffff',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px 14px',
            borderRadius: 'var(--radius-sm)',
            border: isLive ? '1px solid #ef4444' : '1px solid var(--border-glass)'
          }}>
            {formatTimer(sessionSeconds)}
          </span>

          {isLive ? (
            <button onClick={stopLiveRoom} className="btn-danger">
              <Square size={16} />
              <span>End Live Room</span>
            </button>
          ) : (
            <button onClick={startLiveRoom} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <Mic size={16} />
              <span>Start Live Room</span>
            </button>
          )}

          {(liveDialogue.length > 0 || notes) && !isLive && (
            <button
              onClick={handleSaveAndGenerateSummary}
              disabled={isSaving}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)' }}
            >
              {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span>Save & Generate AI Summary</span>
            </button>
          )}
        </div>
      </div>

      {/* Speaker Selector Bar */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Current Speaking Turn:</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {speakersList.map((spk) => (
            <button
              key={spk}
              onClick={() => setActiveSpeaker(spk)}
              style={{
                background: activeSpeaker === spk ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                border: activeSpeaker === spk ? '1px solid #818cf8' : '1px solid var(--border-glass)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: activeSpeaker === spk ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {spk}
            </button>
          ))}

          {showAddSpeaker ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                value={newSpeakerInput}
                onChange={(e) => setNewSpeakerInput(e.target.value)}
                placeholder="Speaker name..."
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid #6366f1',
                  color: '#ffffff',
                  width: '130px'
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSpeaker(); }}
              />
              <button
                onClick={handleAddSpeaker}
                style={{ padding: '4px 8px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddSpeaker(false)}
                style={{ padding: '4px 6px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '11px' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSpeaker(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#94a3b8',
                border: '1px dashed var(--border-glass)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={13} />
              <span>Add Speaker</span>
            </button>
          )}
        </div>
      </div>

      {/* Visualizer Canvas Banner */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isLive ? '#ef4444' : 'var(--text-muted)',
              animation: isLive ? 'pulse-border 1s infinite' : 'none'
            }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              {isLive ? '🔴 LIVE SPEECH RECOGNITION & MICROPHONE WAVE' : 'STANDBY MODE - READY TO RECORD'}
            </h3>
          </div>
          <span className="badge badge-info">Web Audio API • Real-Time Speech Capture</span>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={90}
          style={{ width: '100%', height: '90px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-md)' }}
        />

        {/* Live Interim Speech Text */}
        {isLive && (
          <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={14} color="#ef4444" className="animate-pulse" />
            <span style={{ fontSize: '12px', color: '#c7d2fe', fontWeight: 600 }}>Active Voice ({activeSpeaker}):</span>
            <span style={{ fontSize: '13px', color: '#ffffff', fontStyle: 'italic' }}>
              {liveInterimText || 'Speak into your microphone... Spoken words transcribe here in real-time!'}
            </span>
          </div>
        )}
      </div>

      {/* 2-Column Workspace: Live Stream & Real-time Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Live Diarized Transcription Feed */}
        <div className="glass-card" style={{ padding: '24px', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#6366f1" />
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Real-Time Diarized Feed</h4>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{liveDialogue.length} dialogue turns</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }}>
            {liveDialogue.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Mic size={32} color="#6366f1" style={{ opacity: 0.7 }} />
                <p style={{ margin: 0, fontSize: '14px', maxWidth: '360px', lineHeight: 1.5 }}>
                  Click <strong>Start Live Room</strong> and speak into your microphone. Your spoken words will be captured and speaker-tagged in real time.
                </p>
              </div>
            ) : (
              liveDialogue.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8' }}>{item.speaker}</span>
                      <span className={`badge ${item.sentiment === 'positive' ? 'badge-low' : item.sentiment === 'urgent' ? 'badge-high' : 'badge-info'}`} style={{ fontSize: '10px' }}>
                        {item.sentiment}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.time}</span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Notes & Session Name */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Session Title
            </label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="form-input"
              placeholder="e.g. Sprint Architecture & Roadmap Sync"
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Live Notes & Discussion Points
            </label>
            <textarea
              placeholder="Type real-time meeting notes here... The AI summarizer will combine your notes with the live audio speech transcript."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              style={{ flex: 1, minHeight: '220px', fontSize: '13.5px', lineHeight: 1.6 }}
            />
          </div>

          <button
            onClick={handleSaveAndGenerateSummary}
            disabled={isSaving || (liveDialogue.length === 0 && !notes)}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', opacity: (liveDialogue.length === 0 && !notes) ? 0.6 : 1 }}
          >
            {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Save & Generate AI Executive Summary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
