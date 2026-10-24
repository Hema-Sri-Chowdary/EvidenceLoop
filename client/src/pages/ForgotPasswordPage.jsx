import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { Key, Lock, ArrowRight, CheckCircle, Shield } from '../components/Icons.jsx';
import authService from '../services/authService.js';
import { OtpCirclesInput } from '../components/OtpCirclesInput.jsx';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1 = Request Code, 2 = Verify Code & Set New Password
  const [email, setEmail] = useState('');
  const [resetSessionToken, setResetSessionToken] = useState('');
  const [previewOtp, setPreviewOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.warning('Please enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(email);
      toast.success(res.message, 'Reset Code Dispatched');
      setResetSessionToken(res.resetSessionToken);
      setPreviewOtp(res.previewOtp || '');
      setStep(2);
    } catch (err) {
      toast.error(err.userMessage || err.message || 'No account found with this email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.warning('Please enter the 6-digit reset code');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.resetPassword({
        resetSessionToken,
        otp: otp.trim(),
        newPassword,
      });
      toast.success(res.message, 'Password Reset Successful');
      navigate('/login', { state: { prefilledEmail: email } });
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Failed to reset password. Please check your code.');
    } finally {
      setIsSubmitting(false);
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
            <Shield size={14} />
            <span>Account Security</span>
          </div>

          <h1 className="auth-brand-title">EvidenceLoop</h1>
          <p className="auth-brand-subtitle">
            Account Password Recovery
          </p>
        </div>

        {step === 1 ? (
          /* STEP 1: Enter Email */
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  fontSize: 10,
                  fontWeight: 700,
                  border: '1.5px solid #FCD34D',
                  marginBottom: 12,
                  fontFamily: 'var(--font-display)',
                }}
              >
                <Key size={14} />
                <span>Password Recovery</span>
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 8px 0',
                }}
              >
                Forgot Your Password?
              </h2>
              <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-display)' }}>
                Enter the email address associated with your account, and we will send a real-time verification code to reset your password.
              </p>
            </div>

            <form onSubmit={handleRequestReset}>
              <div className="form-group" style={{ marginBottom: 22 }}>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-btn-pill"
              >
                {isSubmitting ? 'Sending Reset Code...' : 'Send Password Reset Code'}
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
                  &larr; Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 2: Enter Code in 6 Circles & Set New Password */
          <div>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#ECFDF5',
                  color: '#0F766E',
                  fontSize: 10,
                  fontWeight: 700,
                  border: '1.5px solid #A7F3D0',
                  marginBottom: 12,
                  fontFamily: 'var(--font-display)',
                }}
              >
                <CheckCircle size={14} />
                <span>Code Dispatched</span>
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 8px 0',
                }}
              >
                Reset Your Password
              </h2>
              <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-display)' }}>
                Enter the 6-digit code sent to:
                <br />
                <strong style={{ color: '#0F172A', fontWeight: 700 }}>{email}</strong>
              </p>
            </div>

            {/* Test Helper Preview Banner */}
            {previewOtp && (
              <div
                style={{
                  marginBottom: 20,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#F0FDF4',
                  border: '1.5px solid #BBF7D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Reset Code
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'monospace', color: '#15803D', letterSpacing: 3 }}>
                    {previewOtp}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(previewOtp)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 10,
                    padding: '6px 14px',
                    fontWeight: 700,
                    color: '#0F766E',
                    border: '1px solid #A7F3D0',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  Auto-fill
                </button>
              </div>
            )}

            <form onSubmit={handleConfirmReset}>
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <label
                  className="form-label"
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#1E293B',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  6-Digit Reset Code (1 Digit Per Circle)
                </label>
              </div>

              {/* 6 Round Circular Inputs Component */}
              <OtpCirclesInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={isSubmitting}
                autoFocus={true}
              />

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6 || newPassword.length < 6}
                className="auth-btn-pill"
              >
                {isSubmitting ? 'Updating Password...' : 'Reset Password & Sign In'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  &larr; Change Email
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
