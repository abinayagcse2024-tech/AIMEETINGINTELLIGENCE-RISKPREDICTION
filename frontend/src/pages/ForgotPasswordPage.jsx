import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, Key, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Request code, 2 = Reset password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devToken, setDevToken] = useState(''); // Dev helper token
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your work email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.forgotPassword(email);
      setSuccessMessage(res.message || 'Verification code sent.');
      if (res.dev_token) {
        setDevToken(res.dev_token);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request reset code. Please check the email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const activeToken = token || devToken;
    if (!activeToken || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.resetPassword(email, activeToken, newPassword);
      setSuccessMessage(res.message || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Reset failed. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, #0b0f19 80%)'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '36px',
        background: 'rgba(17, 24, 39, 0.85)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)',
            marginBottom: '12px'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {step === 1 
              ? 'Enter your email to receive a recovery code' 
              : 'Enter verification code and your new password'
            }
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '12.5px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#a7f3d0',
            fontSize: '12.5px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Developer Sandbox Helper for Local Demos */}
        {step === 2 && devToken && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#bae6fd',
            fontSize: '12px',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🛠️ Developer Demo Assist</span>
            </div>
            Your reset token is: <strong style={{ color: '#ffffff', background: 'rgba(255, 255, 255, 0.15)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{devToken}</strong>. (Auto-filled below)
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}
            >
              <span>{loading ? 'Sending Code...' : 'Send Reset Code'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="form-input"
                  style={{ paddingLeft: '38px', opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Verification Code
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  value={token || devToken}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (devToken) setDevToken(''); // clear devToken if they start typing manually
                  }}
                  className="form-input"
                  style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', letterSpacing: '4px' }}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}
            >
              <span>{loading ? 'Resetting Password...' : 'Reset Password'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <Link to="/login" style={{
            color: 'var(--text-secondary)',
            fontSize: '12.5px',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}>
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
