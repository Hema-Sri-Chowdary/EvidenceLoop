import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { Key, Lock, ArrowRight, CheckCircle, AlertCircle } from '../components/Icons.jsx';
import authService from '../services/authService.js';

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
    e.preventDefault();
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            EvidenceLoop
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
            Account Password Recovery
          </p>
        </div>

        {step === 1 ? (
          /* STEP 1: Enter Email */
          <div>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 20,
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: '1px solid #FCD34D',
                  marginBottom: 12,
                }}
              >
                <Key size={14} />
                <span>Password Recovery</span>
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                Forgot Your Password?
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Enter the email address associated with your account, and we will send you a real-time verification code to reset your password.
              </p>
            </div>

            <form onSubmit={handleRequestReset}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Email Address</label>
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
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 15 }}
              >
                {isSubmitting ? 'Sending Reset Code...' : 'Send Password Reset Code'}
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <Link
                  to="/login"
                  style={{ color: 'var(--text-secondary)', fontSize: 13.5, textDecoration: 'none' }}
                >
                  &larr; Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 2: Enter Code & New Password */
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
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
                <CheckCircle size={14} />
                <span>Code Dispatched</span>
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                Reset Your Password
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Enter the 6-digit code sent to:
                <br />
                <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
            </div>

            {/* Test Helper Preview Banner */}
            {previewOtp && (
              <div
                style={{
                  marginBottom: 18,
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>
                    Reset Code
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: '#15803D', letterSpacing: 2 }}>
                    {previewOtp}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(previewOtp)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11.5, padding: '4px 10px' }}
                >
                  Auto-fill
                </button>
              </div>
            )}

            <form onSubmit={handleConfirmReset}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">6-Digit Reset Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: 6,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                  }}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Confirm New Password</label>
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
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 15 }}
              >
                {isSubmitting ? 'Updating Password...' : 'Reset Password & Sign In'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}
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
