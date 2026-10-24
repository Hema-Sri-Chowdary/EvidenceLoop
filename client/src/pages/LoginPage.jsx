import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Key, ArrowRight, Building, User, Lock, CheckCircle, Shield } from '../components/Icons.jsx';
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
    org: '',
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

  // Determine dynamic role based on input email
  const getDynamicRole = (email) => {
    const clean = (email || '').trim().toLowerCase();
    if (clean === 'hemasrichowdary@gmail.com') {
      return { role: 'Admin', color: '#7E22CE', bg: '#FAF5FF', border: '#D8B4FE', label: 'Admin (EvidenceLoop Principal)' };
    }
    if (clean.includes('@vitap') || clean.includes('.vitap.')) {
      return { role: 'Auditor', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', label: 'Auditor (VIT-AP Institutional Auditor)' };
    }
    return { role: 'Viewer', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1', label: 'Viewer (Compliance Observer)' };
  };

  const dynamicRole = getDynamicRole(formData.email);

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
        toast.success(res.message, 'Account Registered');
        setMfaState({
          active: true,
          otpSessionToken: res.otpSessionToken,
          previewOtp: res.previewOtp,
          email: res.user?.email || formData.email,
          expiresInSeconds: res.expiresInSeconds || 600,
        });
      } else {
        const res = await login(formData.email, formData.password);
        toast.info(res.message, 'Real-Time MFA Dispatched');
        setMfaState({
          active: true,
          otpSessionToken: res.otpSessionToken,
          previewOtp: res.previewOtp,
          email: res.user?.email || formData.email,
          expiresInSeconds: res.expiresInSeconds || 600,
        });
      }
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Authentication failed. Please verify credentials.');
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
      toast.error(err.userMessage || err.message || 'Incorrect verification code. Please check your OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendOtp(mfaState.otpSessionToken);
      if (res.previewOtp) {
        setMfaState((prev) => ({ ...prev, previewOtp: res.previewOtp }));
      }
      toast.info('New verification code dispatched in real time.');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to resend code');
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
          maxWidth: 480,
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #CCFBF1',
          boxShadow: '0 20px 40px -12px rgba(15, 118, 110, 0.15)',
          padding: 36,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            EvidenceLoop
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Internal Audit Readiness & Compliance Workspace
          </p>
        </div>

        {/* STEP 2: Real-Time MFA OTP Verification */}
        {mfaState.active ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, backgroundColor: '#ECFDF5', color: '#0F766E', fontSize: 13, fontWeight: 600, marginBottom: 12, border: '1px solid #A7F3D0' }}>
                <Key size={14} />
                <span>Real-Time Multi-Factor Authentication</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                Enter Verification Code
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                A 6-digit real-time security OTP has been dispatched to:
                <br />
                <strong style={{ color: 'var(--text-primary)' }}>{mfaState.email}</strong>
              </p>
            </div>

            {/* Test Helper Preview Banner */}
            {mfaState.previewOtp && (
              <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 8, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>
                    Real-Time MFA Security Code
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
                  style={{ background: 'none', border: 'none', color: '#0F766E', cursor: 'pointer', fontWeight: 600, padding: 0 }}
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
                    placeholder="e.g. Hema Sri Chowdary"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@company.com or name@vitap.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Dynamic Role Indicator during registration */}
              {isRegister && formData.email && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: dynamicRole.bg,
                    border: `1px solid ${dynamicRole.border}`,
                    color: dynamicRole.color,
                    fontSize: 12.5,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  <Shield size={14} />
                  <span>Assigned: {dynamicRole.label}</span>
                </div>
              )}

              {isRegister && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Organization / Affiliation</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. VIT-AP University"
                    value={formData.org}
                    onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                  />
                </div>
              )}

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

              {/* Role Rules Explanatory Banner */}
              {isRegister && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                    color: '#64748B',
                    lineHeight: 1.5,
                    marginBottom: 18,
                  }}
                >
                  <strong>Role Assignment Policy:</strong>
                  <br />
                  &bull; <code>hemasrichowdary@gmail.com</code> &rarr; <strong>Admin</strong>
                  <br />
                  &bull; <code>@vitap</code> emails &rarr; <strong>Auditor</strong>
                  <br />
                  &bull; All other email domains &rarr; <strong>Viewer</strong>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 15, marginTop: 4 }}
              >
                {isSubmitting
                  ? 'Processing...'
                  : isRegister
                  ? 'Register & Send MFA Code'
                  : 'Sign In & Send Real-Time MFA Code'}
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Quick Demo Credentials */}
            {!isRegister && demoAccounts.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Quick-Fill Verified Accounts
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
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECFDF5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    >
                      <div>
                        <strong style={{ color: acc.role === 'Admin' ? '#7E22CE' : acc.role === 'Auditor' ? '#1D4ED8' : '#475569' }}>
                          {acc.role}
                        </strong>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{acc.email}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#0F766E', fontWeight: 600 }}>Use</span>
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
