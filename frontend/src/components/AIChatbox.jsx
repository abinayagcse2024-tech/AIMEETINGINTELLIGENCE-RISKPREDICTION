import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, ChevronUp, ChevronDown, CheckCircle2, User, Zap } from 'lucide-react';
import { api } from '../services/api';

const PROMPT_CHIPS = [
  "What tasks were assigned to me?",
  "What decisions were made?",
  "What is the deadline?",
  "Summarize this meeting",
  "Create a task to review sprint deliverables"
];

export const AIChatbox = ({ meetingId = null, floating = true }) => {
  const [isOpen, setIsOpen] = useState(!floating);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hi! I'm your **Meeting Intelligence Agent**. You can ask me questions about your meetings, tasks, deadlines, or have me execute actions like creating tasks or triggering automations!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend = inputValue) => {
    const query = textToSend.trim();
    if (!query || loading) return;

    // Add user message
    const userMsg = { sender: 'user', text: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.chat.query(query, meetingId, historyPayload);

      const aiMsg = {
        sender: 'ai',
        text: res.response,
        suggestedActions: res.suggested_actions || [],
        executedAction: res.executed_action,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `⚠️ Apologies, I encountered an issue: ${err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (floating && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 90,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div
      className="glass-card"
      style={floating ? {
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        width: '420px',
        height: '580px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 90,
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        background: '#0f172a'
      } : {
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(99, 102, 241, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={18} color="#ffffff" />
          </div>
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Meeting Intelligence Chatbox
            </h4>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
              Module 15 & 17 • Active Context
            </span>
          </div>
        </div>

        {floating && (
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '4px'
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.sender === 'user' ? 'var(--accent-gradient)' : 'rgba(30, 41, 59, 0.85)',
              color: '#ffffff',
              fontSize: '13px',
              lineHeight: 1.5,
              border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              whiteSpace: 'pre-line'
            }}>
              {msg.text}
            </div>

            {/* Render Executed Tool Action Chip */}
            {msg.executedAction && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                fontSize: '11px',
                color: '#6ee7b7',
                marginTop: '4px'
              }}>
                <Zap size={12} />
                <span>Agent executed: <strong>{msg.executedAction.tool}</strong></span>
              </div>
            )}

            {/* Render Suggested Action Buttons */}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {msg.suggestedActions.map((act, aIdx) => (
                  <button
                    key={aIdx}
                    onClick={() => {
                      if (act.query) handleSendMessage(act.query);
                      if (act.target) window.location.href = act.target;
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#c7d2fe',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Sparkles size={14} className="animate-spin" color="#6366f1" />
            <span>Agent analyzing transcript context...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        {PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-secondary)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.9)'
        }}
      >
        <input
          type="text"
          placeholder="Ask a question or instruct the Agent..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="form-input"
          style={{ flex: 1, fontSize: '13px', padding: '8px 14px' }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="btn-primary"
          style={{ padding: '8px 14px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
