import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Shield, Lock, User, Key, CheckCircle, ArrowRight, RefreshCw, AlertCircle } from '../components/Icons.jsx';
import authService from '../services/authService.js';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyMfa, resendOtp, register, isAuthenticated } = useAuth();
  const toast = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Auditor',
  });

  // MFA State
  const [mfaState, setMfaState] = useState({
    active: false,
    otpSessionToken: '',
    previewOtp: '',
    email: '',
    expiresInSeconds: 600,
  });
  const [otpInput, setOtpInput] = useState('');
  const [countdown, setCountdown] = useState(600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);

  // Load demo accounts
  useEffect(() => {
    authService.getDemoAccounts().then(setDemoAccounts).catch(() => {});
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // MFA Countdown Timer
  useEffect(() => {
    if (!mfaState.active) return;
    setCountdown(mfaState.expiresInSeconds || 600);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [mfaState.active, mfaState.expiresInSeconds]);

  const handleSelectDemo = (acc) => {
    setFormData((prev) => ({
      ...prev,
      email: acc.email,
      password: acc.password,
    }));
    toast.info(`Loaded ${acc.role} credentials for ${acc.name}. Click 'Sign In' to proceed.`);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isRegister) {
        const res = await register(formData);
        toast.success(res.message, 'Account Created');
        setMfaState({
          active: true,
          otpSessionToken: res.otpSessionToken,
          previewOtp: res.previewOtp,
          email: res.user?.email || formData.email,
          expiresInSeconds: res.expiresInSeconds || 600,
        });
      } else {
        const res = await login(formData.email, formData.password);
        toast.info(res.message, 'MFA Code Dispatched');
        setMfaState({
          active: true,
          otpSessionToken: res.otpSessionToken,
          previewOtp: res.previewOtp,
          email: res.user?.email || formData.email,
          expiresInSeconds: res.expiresInSeconds || 600,
        });
      }
    } catch (err) {
      toast.error(err.userMessage || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      toast.warning('Please enter a valid 6-digit OTP verification code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyMfa(mfaState.otpSessionToken, otpInput.trim());
      toast.success(`Authenticated as ${res.user?.name} (${res.user?.role})`, 'MFA Verified');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.userMessage || 'Incorrect verification code. Please check your OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendOtp(mfaState.otpSessionToken);
      setMfaState((prev) => ({ ...prev, previewOtp: res.previewOtp }));
      toast.success(res.message, 'New Code Dispatched');
      setCountdown(600);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to resend verification code.');
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: 20 }}>
      <div style={{ maxWidth: 480, width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', padding: 36 }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', marginBottom: 16 }}>
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            EvidenceLoop
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Internal Audit Readiness & Compliance Workspace
          </p>
        </div>

        {/* STEP 2: MFA OTP Verification */}
        {mfaState.active ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, backgroundColor: '#EEF2FF', color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                <Key size={14} />
                <span>Multi-Factor Authentication (MFA)</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                Enter Verification Code
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                A 6-digit security OTP has been sent to your registered account:
                <br />
                <strong style={{ color: 'var(--text-primary)' }}>{mfaState.email}</strong>
              </p>
            </div>

            {/* Test Helper Preview Banner */}
            {mfaState.previewOtp && (
              <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 8, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>
                    MFA Security Dispatch (OTP)
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: '#15803D', letterSpacing: 2 }}>
                    {mfaState.previewOtp}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpInput(mfaState.previewOtp)}
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                >
                  Auto-fill OTP
                </button>
              </div>
            )}

            <form onSubmit={handleMfaSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: 10 }}>
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: 8,
                    textAlign: 'center',
                    padding: '12px 16px',
                    width: '100%',
                    borderRadius: 8,
                    border: '2px solid var(--border)',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
                <span>Expires in: <strong>{formatTimer(countdown)}</strong></span>
                <button
                  type="button"
                  onClick={handleResend}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpInput.length !== 6}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 15 }}
              >
                {isSubmitting ? 'Verifying Code...' : 'Verify & Enter Workspace'}
              </button>

              <button
                type="button"
                onClick={() => setMfaState({ active: false, otpSessionToken: '', previewOtp: '', email: '', expiresInSeconds: 600 })}
                style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13.5, marginTop: 14, textDecoration: 'underline' }}
              >
                Return to Login
              </button>
            </form>
          </div>
        ) : (
          /* STEP 1: Login / Register Form */
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderRadius: 8, backgroundColor: '#F1F5F9', padding: 4, marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: !isRegister ? '#FFFFFF' : 'transparent',
                  color: !isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isRegister ? '#FFFFFF' : 'transparent',
                  color: isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleLoginSubmit}>
              {isRegister && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Alex Morgan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              {isRegister && (
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Audit Readiness Role</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Auditor">Auditor (Full creation, editing & evidence attachment)</option>
                    <option value="Admin">Admin (Full administrative control & record deletion)</option>
                    <option value="Viewer">Viewer (Read-only observation)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 15, marginTop: 8 }}
              >
                {isSubmitting
                  ? 'Processing...'
                  : isRegister
                  ? 'Register & Send OTP'
                  : 'Sign In & Send MFA Code'}
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Quick Demo Credentials */}
            {!isRegister && demoAccounts.length > 0 && (
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Quick-Fill Demo Credentials
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        backgroundColor: '#F8FAFC',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 13,
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EEF2FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>{acc.role}</strong>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{acc.email}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Use</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
