import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Video,
  Square,
  Play,
  Pause,
  Upload,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Monitor,
  Camera,
  Film,
  Music,
  Trash2,
  FileText,
  Radio
} from 'lucide-react';
import { api } from '../services/api';

export const AudioRecorder = ({ meetingId, onRecordingComplete }) => {
  const [activeTab, setActiveTab] = useState('video'); // 'video', 'audio', 'upload', 'text'
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mediaBlob, setMediaBlob] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isVideo, setIsVideo] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [recordSource, setRecordSource] = useState('camera'); // 'camera' or 'screen'

  // Live Speech Recognition state
  const [liveTranscript, setLiveTranscript] = useState('');
  const [customText, setCustomText] = useState('');

  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const recordedVideoPreviewRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const speechRecognizerRef = useRef(null);

  // Audio Canvas Refs
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      stopAllMediaStreams();
    };
  }, []);

  const stopAllMediaStreams = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch {}
    }
  };

  // -------------------------------------------------------------
  // BROWSER SPEECH RECOGNITION (WEB SPEECH API)
  // -------------------------------------------------------------
  const startLiveSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';

        recognizer.onresult = (event) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript + ' ';
          }
          setLiveTranscript(fullText.trim());
        };

        recognizer.onerror = (e) => {
          console.log('[Live STT Info]:', e.error);
        };

        recognizer.start();
        speechRecognizerRef.current = recognizer;
      } catch (err) {
        console.log('Web Speech API not active:', err);
      }
    }
  };

  const stopLiveSpeechRecognition = () => {
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch {}
    }
  };

  // -------------------------------------------------------------
  // VIDEO / WEBCAM / SCREEN RECORDING
  // -------------------------------------------------------------
  const startVideoRecording = async () => {
    try {
      stopAllMediaStreams();
      setLiveTranscript('');
      let stream;
      if (recordSource === 'screen') {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const tracks = [...screenStream.getVideoTracks(), ...micStream.getAudioTracks()];
          stream = new MediaStream(tracks);
        } catch {
          stream = screenStream;
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true
        });
      }

      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setMediaBlob(blob);
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
        setIsVideo(true);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      };

      mediaRecorderRef.current.start(500);
      startLiveSpeechRecognition();

      setIsRecording(true);
      setIsVideo(true);
      setRecordTime(0);
      setUploadSuccess(false);

      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start video recording:', err);
      alert(`Camera/Screen access error: ${err.message}. You can upload a video file or record audio.`);
    }
  };

  // -------------------------------------------------------------
  // AUDIO MICROPHONE RECORDING
  // -------------------------------------------------------------
  const startAudioRecording = async () => {
    try {
      stopAllMediaStreams();
      setLiveTranscript('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
        setMediaBlob(blob);
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
        setIsVideo(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      };

      mediaRecorderRef.current.start(250);
      startLiveSpeechRecognition();

      setIsRecording(true);
      setIsVideo(false);
      setRecordTime(0);
      setUploadSuccess(false);

      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);

      drawAudioVisualizer();
    } catch (err) {
      console.error('Microphone error:', err);
      alert(`Microphone error: ${err.message}.`);
    }
  };

  const drawAudioVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(11, 15, 25, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      stopLiveSpeechRecognition();
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // -------------------------------------------------------------
  // FILE UPLOAD (VIDEO OR AUDIO)
  // -------------------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVid = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i);
      setMediaBlob(file);
      setMediaUrl(URL.createObjectURL(file));
      setIsVideo(!!isVid);
      setRecordTime(120);
      setUploadSuccess(false);
    }
  };

  // -------------------------------------------------------------
  // UPLOAD & RUN INTELLIGENCE PIPELINE
  // -------------------------------------------------------------
  const uploadAndProcessMedia = async () => {
    if (!mediaBlob && !customText) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (mediaBlob) {
        const ext = isVideo ? (mediaBlob.name?.split('.').pop() || 'webm') : 'wav';
        const filename = mediaBlob.name || `meeting_${isVideo ? 'video' : 'audio'}.${ext}`;
        formData.append('file', mediaBlob, filename);
        formData.append('duration', recordTime || 60);
        formData.append('media_type', isVideo ? 'video' : 'audio');
      } else {
        // Dummy wav if submitting custom transcript
        const dummyBlob = new Blob([new Uint8Array(44)], { type: 'audio/wav' });
        formData.append('file', dummyBlob, 'text_session.wav');
        formData.append('duration', 60);
        formData.append('media_type', 'audio');
      }

      if (liveTranscript || customText) {
        formData.append('raw_transcript', (liveTranscript || customText).trim());
      }

      // Upload and trigger auto-transcribe & auto-summarize
      await api.audio.upload(meetingId, formData);

      setUploadSuccess(true);
      if (onRecordingComplete) onRecordingComplete();
    } catch (err) {
      console.error('Failed to process media file:', err);
      alert(`Processing error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearRecordedMedia = () => {
    setMediaBlob(null);
    setMediaUrl(null);
    setLiveTranscript('');
    setUploadSuccess(false);
    setRecordTime(0);
  };

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(99, 102, 241, 0.4)'
          }}>
            {activeTab === 'video' ? <Video size={18} color="#ffffff" /> : activeTab === 'audio' ? <Mic size={18} color="#ffffff" /> : activeTab === 'text' ? <FileText size={18} color="#ffffff" /> : <Upload size={18} color="#ffffff" />}
          </div>
          <div>
            <h3 style={{ fontSize: '16.5px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Meeting Video & Audio Recording / Upload
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Module 5: MP4, WebM, MOV, MP3, WAV • Live Speech Recognition & Diarization
            </span>
          </div>
        </div>

        {/* Timer Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            fontWeight: 800,
            color: isRecording ? '#ef4444' : '#ffffff',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            border: isRecording ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-glass)'
          }}>
            {formatTime(recordTime)}
          </span>
          {isRecording && (
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#ef4444',
              display: 'inline-block',
              animation: 'pulse-border 1s infinite'
            }} />
          )}
        </div>
      </div>

      {/* Mode Selector Tabs */}
      {!isRecording && !mediaUrl && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('video')}
            className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
            style={{ fontSize: '12.5px' }}
          >
            <Camera size={14} />
            <span>Record Video / Webcam</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
            style={{ fontSize: '12.5px' }}
          >
            <Mic size={14} />
            <span>Record Audio (Mic)</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            style={{ fontSize: '12.5px' }}
          >
            <Upload size={14} />
            <span>Upload Video / Audio</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            style={{ fontSize: '12.5px' }}
          >
            <FileText size={14} />
            <span>Paste / Edit Transcript</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. VIDEO RECORDING PREVIEW & CONTROLS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'video' && !mediaUrl && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '100%',
            height: '240px',
            background: '#090d16',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isRecording ? '2px solid #ef4444' : '1px solid var(--border-glass)'
          }}>
            <video
              ref={videoPreviewRef}
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isRecording ? 'block' : 'none'
              }}
            />
            {!isRecording && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Film size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: '13.5px', color: '#cbd5e1', fontWeight: 600, margin: '0 0 4px 0' }}>
                  Live Camera & Screen Recorder with Real-Time Speech Recognition
                </p>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Captures video and transcribes your spoken speech in real-time.
                </span>
              </div>
            )}
          </div>

          {/* Live speech feedback while recording */}
          {isRecording && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#818cf8', fontWeight: 700, marginBottom: '4px' }}>
                <Radio size={13} color="#ef4444" className="animate-pulse" />
                <span>LIVE SPEECH RECOGNITION TRANSCRIBING:</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#f8fafc', fontStyle: 'italic', minHeight: '20px' }}>
                {liveTranscript || 'Listening to microphone... Start speaking!'}
              </p>
            </div>
          )}

          {!isRecording && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={() => setRecordSource('camera')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: recordSource === 'camera' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: recordSource === 'camera' ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                  color: recordSource === 'camera' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Camera size={14} />
                <span>Webcam & Microphone</span>
              </button>

              <button
                onClick={() => setRecordSource('screen')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: recordSource === 'screen' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: recordSource === 'screen' ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                  color: recordSource === 'screen' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Monitor size={14} />
                <span>Screen Share + Mic</span>
              </button>
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            {!isRecording ? (
              <button onClick={startVideoRecording} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', flex: 1, justifyContent: 'center' }}>
                <Video size={16} />
                <span>Start Video Recording</span>
              </button>
            ) : (
              <button onClick={stopRecording} className="btn-danger" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                <Square size={16} />
                <span>Stop Video Recording</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. AUDIO MICROPHONE RECORDING */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audio' && !mediaUrl && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            height: '90px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-glass)'
          }}>
            <canvas ref={canvasRef} width={600} height={90} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }} />
            {!isRecording && (
              <span style={{ position: 'absolute', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Microphone standby. Click 'Start Audio Recording' to capture voice.
              </span>
            )}
          </div>

          {/* Live speech feedback while recording audio */}
          {isRecording && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#818cf8', fontWeight: 700, marginBottom: '4px' }}>
                <Radio size={13} color="#ef4444" className="animate-pulse" />
                <span>LIVE SPEECH-TO-TEXT TRANSCRIBING:</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#f8fafc', fontStyle: 'italic', minHeight: '20px' }}>
                {liveTranscript || 'Listening to your speech in real-time...'}
              </p>
            </div>
          )}

          {!isRecording ? (
            <button onClick={startAudioRecording} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', width: '100%', justifyContent: 'center' }}>
              <Mic size={16} />
              <span>Start Audio Recording</span>
            </button>
          ) : (
            <button onClick={stopRecording} className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
              <Square size={16} />
              <span>Stop Audio Recording</span>
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. FILE UPLOAD */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'upload' && !mediaUrl && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.avi,.mp3,.wav,.m4a,.ogg"
            style={{ display: 'none' }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '40px 20px',
              border: '2px dashed rgba(99, 102, 241, 0.4)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.04)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={36} color="#818cf8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              Click or Drag & Drop Video / Audio File Here
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Supports <strong>MP4, WebM, MOV, MKV</strong> videos & <strong>MP3, WAV, M4A</strong> audio tracks (Up to 500MB)
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. PASTE / EDIT TRANSCRIPT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'text' && !mediaUrl && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Paste Meeting Speech Transcript / Discussion Text:
          </label>
          <textarea
            placeholder="Paste or type meeting dialogue here (e.g. Speaker 1: Today we discussed the product release. Speaker 2: We confirmed the deployment schedule and assigned action items...)"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="form-textarea"
            style={{ minHeight: '130px', fontSize: '13px', lineHeight: 1.5, marginBottom: '14px' }}
          />
          <button
            onClick={uploadAndProcessMedia}
            disabled={uploading || !customText.trim()}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>Process & Generate Summary from Transcript</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RECORDED / UPLOADED MEDIA PLAYBACK PREVIEW */}
      {/* ------------------------------------------------------------- */}
      {mediaUrl && (
        <div style={{ marginBottom: '20px', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isVideo ? <Video size={16} color="#818cf8" /> : <Music size={16} color="#818cf8" />}
              <span>{isVideo ? 'Recorded / Uploaded Video Preview' : 'Recorded Audio Track Preview'}</span>
            </span>

            <button
              onClick={clearRecordedMedia}
              style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={13} />
              <span>Discard & Re-record</span>
            </button>
          </div>

          {isVideo ? (
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000000', maxHeight: '280px', display: 'flex', justifyContent: 'center' }}>
              <video
                ref={recordedVideoPreviewRef}
                controls
                src={mediaUrl}
                style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)' }}>
              <audio controls src={mediaUrl} style={{ width: '100%' }} />
            </div>
          )}

          {/* Captured live text preview if available */}
          {liveTranscript && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                CAPTURED SPEECH TRANSCRIPT:
              </span>
              <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: 0, fontStyle: 'italic' }}>
                "{liveTranscript}"
              </p>
            </div>
          )}

          {/* Action Trigger Button */}
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={uploadAndProcessMedia}
              disabled={uploading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                background: uploadSuccess ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--accent-gradient)'
              }}
            >
              {uploading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Uploading & Processing STT Transcription...</span>
                </>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Transcribed & Summarized Successfully!</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Upload & Transcribe {isVideo ? 'Video' : 'Audio'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
