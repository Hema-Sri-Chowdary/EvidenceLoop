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
    role: 'Auditor',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if email belongs to an institutional domain (@vit or @vcomply)
  const isInstitutional = (email) => {
    const clean = (email || '').trim().toLowerCase();
    return (
      clean.includes('@vit') ||
      clean.includes('.vit.') ||
      clean.includes('@vcomply') ||
      clean.includes('.vcomply.')
    );
  };

  // Determine dynamic role based on input email (Auditor vs Viewer)
  const getDynamicRole = (email) => {
    const clean = (email || '').trim().toLowerCase();
    if (isInstitutional(clean)) {
      const orgTag = clean.includes('vcomply') ? 'VComply' : 'VIT Institutional';
      return {
        isEligible: true,
        role: formData.role || 'Auditor',
        color: '#0F766E',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        label: `${formData.role || 'Auditor'} (${orgTag})`,
      };
    }
    return {
      isEligible: false,
      role: 'Viewer',
      color: '#334155',
      bg: '#F8FAFC',
      border: '#CBD5E1',
      label: 'Viewer (Compliance Observer)',
    };
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
        const payload = {
          ...formData,
          role: isInstitutional(formData.email) ? formData.role : 'Viewer',
        };
        const res = await register(payload);
        toast.success(res.message, 'Account Registered');
        navigate('/mfa', {
          state: {
            otpSessionToken: res.otpSessionToken,
            email: res.user?.email || formData.email,
            name: res.user?.name || formData.name,
            expiresInSeconds: res.expiresInSeconds || 600,
            from: location.state?.from?.pathname || '/',
          },
        });
      } else {
        const res = await login(formData.email, formData.password);
        toast.info(res.message, 'Real-Time MFA Dispatched');
        navigate('/mfa', {
          state: {
            otpSessionToken: res.otpSessionToken,
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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
            <span>Audit & Compliance Portal</span>
          </div>

          <h1 className="auth-brand-title">EvidenceLoop</h1>
          <p className="auth-brand-subtitle">
            Internal Audit Readiness & Compliance Workspace
          </p>
        </div>

        {/* Tabs: Sign In / Create Account with Rounded Pill Switcher */}
        <div className="auth-tabs-pill">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleLoginSubmit}>
          {isRegister && (
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                Full Name
              </label>
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

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Interactive Role Selection for @vit and @vcomply users */}
          {isRegister && formData.email && (
            isInstitutional(formData.email) ? (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#ECFDF5',
                  border: '1.5px solid #A7F3D0',
                  marginBottom: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#065F46', fontWeight: 700, fontSize: 11.5, marginBottom: 4 }}>
                  <Shield size={14} />
                  <span>Institutional Domain Detected (@vit / @vcomply)</span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: 10.5, color: '#047857', lineHeight: 1.4 }}>
                  Would you like to register as an <strong>Auditor</strong> or <strong>Viewer</strong>?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Auditor' })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: formData.role === 'Auditor' ? '2px solid #0F766E' : '1px solid #CBD5E1',
                      backgroundColor: formData.role === 'Auditor' ? '#FFFFFF' : '#F8FAFC',
                      color: formData.role === 'Auditor' ? '#0F766E' : '#64748B',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: formData.role === 'Auditor' ? '0 2px 6px rgba(15, 118, 110, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: '50%',
                          border: formData.role === 'Auditor' ? '4px solid #0F766E' : '1.5px solid #94A3B8',
                          display: 'inline-block',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span>Auditor</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 3, lineHeight: 1.3 }}>
                      Full create, edit &amp; delete obligations
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Viewer' })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: formData.role === 'Viewer' ? '2px solid #0F766E' : '1px solid #CBD5E1',
                      backgroundColor: formData.role === 'Viewer' ? '#FFFFFF' : '#F8FAFC',
                      color: formData.role === 'Viewer' ? '#0F766E' : '#64748B',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: formData.role === 'Viewer' ? '0 2px 6px rgba(15, 118, 110, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: '50%',
                          border: formData.role === 'Viewer' ? '4px solid #0F766E' : '1.5px solid #94A3B8',
                          display: 'inline-block',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span>Viewer</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 3, lineHeight: 1.3 }}>
                      Read-only audit observer access
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  color: '#475569',
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  marginBottom: 18,
                }}
              >
                <Shield size={14} />
                <span>Assigned Role: Viewer (External domain &mdash; read-only access)</span>
              </div>
            )
          )}

          {isRegister && (
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                Organization / Affiliation
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter organization / university"
                value={formData.org}
                onChange={(e) => setFormData({ ...formData, org: e.target.value })}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                Password
              </label>
              {!isRegister && (
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: 10.5,
                    color: '#0F766E',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#047857')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#0F766E')}
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
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                fontSize: 10,
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              <strong style={{ color: '#0F172A' }}>Role Assignment Policy:</strong>
              <div style={{ marginTop: 4 }}>
                &bull; <code>@vit</code> &amp; <code>@vcomply</code> domains &rarr; Can choose between <strong style={{ color: '#0F766E' }}>Auditor</strong> or <strong style={{ color: '#475569' }}>Viewer</strong>
                <br />
                &bull; All other email domains &rarr; <strong style={{ color: '#334155' }}>Viewer</strong> (Read-only observation)
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-btn-pill"
            style={{ marginTop: 6 }}
          >
            {isSubmitting
              ? 'Connecting...'
              : isRegister
              ? 'Register & Proceed to MFA'
              : 'Sign In & Proceed to MFA'}
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
