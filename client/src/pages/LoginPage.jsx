import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ArrowRight, Shield } from '../components/Icons.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const toast = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.prefilledEmail || '',
    password: '',
    org: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isRegister) {
        const res = await register(formData);
        toast.success(res.message, 'Account Registered');
        // Direct to MFA Page
        navigate('/mfa', {
          state: {
            otpSessionToken: res.otpSessionToken,
            previewOtp: res.previewOtp,
            email: res.user?.email || formData.email,
            name: res.user?.name || formData.name,
            expiresInSeconds: res.expiresInSeconds || 600,
            from: location.state?.from?.pathname || '/',
          },
        });
      } else {
        const res = await login(formData.email, formData.password);
        toast.info(res.message, 'Real-Time MFA Dispatched');
        // Direct to MFA Page
        navigate('/mfa', {
          state: {
            otpSessionToken: res.otpSessionToken,
            previewOtp: res.previewOtp,
            email: res.user?.email || formData.email,
            name: res.user?.name || '',
            expiresInSeconds: res.expiresInSeconds || 600,
            from: location.state?.from?.pathname || '/',
          },
        });
      }
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Authentication failed. Please verify credentials.');
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
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            EvidenceLoop
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
            Internal Audit Readiness & Compliance Workspace
          </p>
        </div>

        {/* Tabs: Sign In / Create Account */}
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
                placeholder="Enter your full name"
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
              placeholder="name@company.com"
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
                placeholder="Enter organization / university"
                value={formData.org}
                onChange={(e) => setFormData({ ...formData, org: e.target.value })}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              {!isRegister && (
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: 12.5,
                    color: '#0F766E',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {/* Role Rules Explanatory Policy Banner */}
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
              ? 'Connecting...'
              : isRegister
              ? 'Register & Proceed to MFA'
              : 'Sign In & Proceed to MFA'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
