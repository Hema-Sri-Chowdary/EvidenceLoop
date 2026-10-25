import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  User,
  Shield,
  Building,
  Key,
  LogOut,
  Trash2,
  Edit3,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from '../components/Icons.jsx';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, role, updateProfile, deleteAccount, logout } = useAuth();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    org: user?.org || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Session Required</h2>
        <p>Please sign in to access your profile.</p>
        <button onClick={() => navigate('/login')} className="btn btn-primary">
          Go to Sign In
        </button>
      </div>
    );
  }

  const getRoleTheme = (r) => {
    switch (r) {
      case 'Auditor':
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          color: '#1D4ED8',
          tag: 'Compliance & Institutional Auditor',
          desc: 'Assigned via @vit and @vcomply domains. Full authority to create, edit, evaluate, and delete compliance obligations, with evidence management.',
        };
      default:
        return {
          bg: '#F8FAFC',
          border: '#CBD5E1',
          color: '#475569',
          tag: 'Compliance Observer (Viewer)',
          desc: 'Assigned to general email domains. Read-only observation across obligations, dashboards, and audit readiness reports.',
        };
    }
  };

  const roleTheme = getRoleTheme(role);

  const getInitials = (nameStr) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        org: formData.org.trim(),
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
    toast.info('You have been signed out');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/login');
      toast.success('Your account has been permanently removed');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 800, padding: '32px 20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
          User Profile & Security
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
          Manage your identity, role permissions, organization affiliation, and authentication security.
        </p>
      </div>

      {/* Main Profile Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {/* Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
            padding: '32px 32px 28px 32px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: '#0F766E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                border: '4px solid rgba(255, 255, 255, 0.9)',
              }}
            >
              {getInitials(user.name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  {user.name}
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setFormData({ name: user.name, org: user.org || '' });
                      setIsEditing(true);
                    }}
                    className="btn btn-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '4px 10px',
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: 14, color: 'rgba(255, 255, 255, 0.85)' }}>
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="btn btn-secondary"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F766E',
              border: 'none',
              fontWeight: 600,
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Card Body */}
        <div style={{ padding: 32 }}>
          {isEditing ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                  Organization / University Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.org}
                  onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                  placeholder="Enter organization / university"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Organization Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 12,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B' }}>
                    Organization Affiliation
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>
                    {user.org || 'VIT-AP University'}
                  </div>
                </div>
              </div>

              {/* Role & Permissions Card */}
              <div
                style={{
                  padding: '20px 24px',
                  borderRadius: 12,
                  backgroundColor: roleTheme.bg,
                  border: `1px solid ${roleTheme.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: roleTheme.color, fontWeight: 700, fontSize: 16 }}>
                    <Shield size={18} />
                    <span>Role Assignment: {role}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      color: roleTheme.color,
                      border: `1px solid ${roleTheme.border}`,
                    }}
                  >
                    {roleTheme.tag}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
                  {roleTheme.desc}
                </p>
              </div>

              {/* Real-Time MFA Security */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 12,
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#065F46' }}>
                      Real-Time Multi-Factor Authentication (MFA)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#059669', fontWeight: 700, backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: 10 }}>
                      <CheckCircle size={13} /> Active & Enforced
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>
                    6-digit cryptographic verification codes are sent in real time to <strong>{user.email}</strong> on every authentication attempt.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone: Permanent Account Deletion */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #FCA5A5',
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.06)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', marginBottom: 8 }}>
          <AlertCircle size={20} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Danger Zone: Delete Account</h3>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: 13.5, color: '#64748B', lineHeight: 1.5 }}>
          Permanently remove your account and credentials from EvidenceLoop. Once deleted, your session will be revoked immediately and you will need to re-register to regain access.
        </p>

        {showDeleteConfirm ? (
          <div
            style={{
              padding: 18,
              borderRadius: 10,
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
            }}
          >
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#991B1B', marginBottom: 8 }}>
              To confirm deletion, please type <strong style={{ fontFamily: 'monospace' }}>DELETE</strong> below:
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                className="input"
                placeholder="Type DELETE"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                style={{ maxWidth: 300, borderColor: '#FCA5A5' }}
              />
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmationText('');
                }}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="btn"
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none' }}
                disabled={isDeleting || deleteConfirmationText.trim().toLowerCase() !== 'delete'}
              >
                <Trash2 size={16} />
                <span>{isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn"
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              fontWeight: 600,
            }}
          >
            <Trash2 size={16} />
            <span>Delete My Account</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
