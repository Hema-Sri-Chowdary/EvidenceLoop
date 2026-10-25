import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Key, ArrowRight, ShieldCheck, RefreshCw } from '../components/Icons.jsx';
import { OtpCirclesInput } from '../components/OtpCirclesInput.jsx';

export function MfaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMfa, resendOtp, isAuthenticated } = useAuth();
  const toast = useToast();

  const stateSession = location.state || {};
  const [otpSessionToken, setOtpSessionToken] = useState(stateSession.otpSessionToken || '');
  const [email, setEmail] = useState(stateSession.email || '');
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
    if (e && e.preventDefault) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      toast.warning('Please enter all 6 digits of your verification code.');
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
      await resendOtp(otpSessionToken);
      setCountdown(600);
      setOtpInput('');
      toast.info('A new verification code has been dispatched to your email.');
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Decorative ambient blur spheres */}
      <div
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.12)',
          filter: 'blur(70px)',
          top: '5%',
          left: '10%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'rgba(13, 148, 136, 0.14)',
          filter: 'blur(80px)',
          bottom: '5%',
          right: '10%',
          pointerEvents: 'none',
        }}
      />

      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div
            className="auth-badge-pill"
            style={{
              backgroundColor: '#ECFDF5',
              color: '#0F766E',
              border: '1px solid #A7F3D0',
              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)',
            }}
          >
            <ShieldCheck size={14} />
            <span>Step 2: Real-Time Multi-Factor Authentication</span>
          </div>

          <h1 className="auth-brand-title">Two-Step Verification</h1>
          <p className="auth-brand-subtitle" style={{ marginTop: 4 }}>
            Enter the 6-digit security code dispatched to:
            <br />
            <strong style={{ color: '#0F172A', fontWeight: 700 }}>{email}</strong>
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#1E293B',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Enter OTP
            </label>
          </div>

          {/* 6 Round Circular Inputs Component */}
          <OtpCirclesInput
            length={6}
            value={otpInput}
            onChange={setOtpInput}
            disabled={isSubmitting}
            autoFocus={true}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 10.5,
              color: '#64748B',
              marginBottom: 24,
              padding: '0 4px',
              fontFamily: 'var(--font-display)',
            }}
          >
            <span>
              Expires in: <strong style={{ color: countdown < 60 ? '#DC2626' : '#0F172A', fontWeight: 700 }}>{formatTimer(countdown)}</strong>
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none',
                border: 'none',
                color: '#0F766E',
                cursor: isResending ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: 700,
                fontSize: 10.5,
              }}
            >
              <RefreshCw size={13} className={isResending ? 'animate-spin-svg' : ''} />
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpInput.length !== 6}
            className="auth-btn-pill"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Code & Enter Workspace'}
            <ArrowRight size={17} />
          </button>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link
              to="/login"
              style={{
                color: '#64748B',
                fontSize: 10.5,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
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
