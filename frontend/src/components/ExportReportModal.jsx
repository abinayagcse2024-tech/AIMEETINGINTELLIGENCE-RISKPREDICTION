import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, Copy, Check, X, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../services/api';

export const ExportReportModal = ({ meetingId, isOpen, onClose }) => {
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);

  useEffect(() => {
    if (isOpen && meetingId) {
      const fetchReport = async () => {
        setLoading(true);
        try {
          const res = await api.dashboard.getReportMarkdown(meetingId);
          setReportMarkdown(res.markdown_content);
        } catch (err) {
          console.error('Failed to load report', err);
          setReportMarkdown('# Error loading report');
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    }
  }, [isOpen, meetingId]);

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

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Intelligence_Report_${meetingId}.md`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
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
        maxHeight: isFullScreen ? '100vh' : '88vh',
        background: '#0f172a',
        border: isFullScreen ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: isFullScreen ? 0 : 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: isFullScreen ? '20px 32px' : '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(99, 102, 241, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#818cf8" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Export Executive Meeting Report
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Module 16: Formatted AI Meeting Minutes & Decisions
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Restore modal size" : "Expand report full screen"}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Markdown Content Preview */}
        <div style={{ flex: 1, padding: isFullScreen ? '24px 32px' : '20px 24px', overflowY: 'auto' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Generating comprehensive report...</p>
          ) : (
            <pre style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: '#cbd5e1',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              height: '100%',
              boxSizing: 'border-box'
            }}>
              {reportMarkdown}
            </pre>
          )}
        </div>

        {/* Action Controls Footer */}
        <div style={{
          padding: isFullScreen ? '18px 32px' : '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.9)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Ready to export in Markdown or print to PDF
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleCopy} className="btn-secondary">
              {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button onClick={handleDownload} className="btn-primary">
              <Download size={15} />
              <span>Download .MD</span>
            </button>
            <button onClick={handlePrint} className="btn-secondary">
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
