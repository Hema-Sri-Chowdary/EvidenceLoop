import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Key, ArrowRight, ShieldCheck, RefreshCw } from '../components/Icons.jsx';

export function MfaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMfa, resendOtp, isAuthenticated } = useAuth();
  const toast = useToast();

  const stateSession = location.state || {};
  const [otpSessionToken, setOtpSessionToken] = useState(stateSession.otpSessionToken || '');
  const [email, setEmail] = useState(stateSession.email || '');
  const [previewOtp, setPreviewOtp] = useState(stateSession.previewOtp || '');
  const [expiresInSeconds, setExpiresInSeconds] = useState(stateSession.expiresInSeconds || 600);
  const [otpInput, setOtpInput] = useState('');
  const [countdown, setCountdown] = useState(expiresInSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // If already authenticated, redirect to workspace
  useEffect(() => {
    if (isAuthenticated) {
      const from = stateSession.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, stateSession.from]);

  // If no session token, redirect to login
  useEffect(() => {
    if (!otpSessionToken && !isAuthenticated) {
      toast.warning('No active MFA session. Please sign in first.');
      navigate('/login', { replace: true });
    }
  }, [otpSessionToken, isAuthenticated, navigate, toast]);

  // Live countdown timer
  useEffect(() => {
    if (!otpSessionToken) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSessionToken]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      toast.warning('Please enter a valid 6-digit OTP verification code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyMfa(otpSessionToken, otpInput.trim());
      toast.success(`Welcome, ${res.user?.name || 'User'}!`, 'MFA Verified');
      const destination = stateSession.from || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Incorrect verification code. Please check your OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const res = await resendOtp(otpSessionToken);
      if (res.previewOtp) {
        setPreviewOtp(res.previewOtp);
      }
      setCountdown(600);
      toast.info('A new verification code has been dispatched in real time.');
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ECFDF5 0%, #E6F4F1 50%, #D8EFEA 100%)',
        backgroundColor: '#E6F4F1',
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #CCFBF1',
          boxShadow: '0 20px 40px -12px rgba(15, 118, 110, 0.15)',
          padding: 36,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            EvidenceLoop
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
            Internal Audit Readiness & Compliance Workspace
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              borderRadius: 20,
              backgroundColor: '#ECFDF5',
              color: '#0F766E',
              fontSize: 12.5,
              fontWeight: 600,
              border: '1px solid #A7F3D0',
              marginBottom: 12,
            }}
          >
            <Key size={14} />
            <span>Step 2: Real-Time Multi-Factor Authentication</span>
          </div>

          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            Enter Verification Code
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            A 6-digit real-time security OTP has been dispatched to:
            <br />
            <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
          </p>
        </div>

        {/* Real-Time Test Helper Preview Banner */}
        {previewOtp && (
          <div
            style={{
              marginBottom: 22,
              padding: '12px 16px',
              borderRadius: 10,
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Real-Time MFA Security Code
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: '#15803D', letterSpacing: 3 }}>
                {previewOtp}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOtpInput(previewOtp)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12, padding: '5px 12px', fontWeight: 600 }}
            >
              Auto-fill OTP
            </button>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: 10, fontSize: 13 }}>
              Enter 6-Digit One-Time Password
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              autoFocus
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 8,
                textAlign: 'center',
                padding: '12px 16px',
                width: '100%',
                borderRadius: 10,
                border: '2px solid #CCFBF1',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                outline: 'none',
              }}
              required
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 24,
            }}
          >
            <span>
              Expires in: <strong style={{ color: countdown < 60 ? '#DC2626' : 'var(--text-primary)' }}>{formatTimer(countdown)}</strong>
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none',
                border: 'none',
                color: '#0F766E',
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0,
                fontSize: 13,
              }}
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpInput.length !== 6}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px 16px',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {isSubmitting ? 'Verifying Code...' : 'Verify & Enter Workspace'}
            <ArrowRight size={16} />
          </button>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Link
              to="/login"
              style={{
                color: 'var(--text-secondary)',
                fontSize: 13.5,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              &larr; Return to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MfaPage;
