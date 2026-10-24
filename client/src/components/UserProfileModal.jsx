import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  User,
  Shield,
  Building,
  LogOut,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Key,
  Edit3,
  Save,
} from './Icons.jsx';

export function UserProfileModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, role, isAdmin, isAuditor, isViewer, updateProfile, deleteAccount, logout } = useAuth();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    org: user?.org || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !user) return null;

  const getRoleTheme = (r) => {
    switch (r) {
      case 'Admin':
        return {
          bg: '#FAF5FF',
          border: '#D8B4FE',
          color: '#7E22CE',
          tag: 'Administrator (Super Authority)',
          desc: 'Assigned via hemasrichowdary@gmail.com. Complete platform management, deletion authority, and compliance reset permissions.',
        };
      case 'Auditor':
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          color: '#1D4ED8',
          tag: 'Institutional Auditor',
          desc: 'Assigned via @vitap institutional email. Full authority to create, edit, assess obligations, and attach audit evidence.',
        };
      default:
        return {
          bg: '#F8FAFC',
          border: '#CBD5E1',
          color: '#475569',
          tag: 'Compliance Observer (Viewer)',
          desc: 'Assigned to general domains. Read-only observation across obligations, dashboards, and audit readiness reports.',
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
    onClose();
    navigate('/login');
    toast.info('You have been signed out');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      toast.error('Please type DELETE to confirm account removal');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount();
      onClose();
      navigate('/login');
      toast.success('Your account has been permanently removed');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 540,
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header with Cover Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
            padding: '24px 28px 20px 28px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar Circle */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: '#0F766E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '3px solid rgba(255, 255, 255, 0.9)',
                flexShrink: 0,
              }}
            >
              {getInitials(user.name)}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  {user.name}
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setFormData({ name: user.name, org: user.org || '' });
                      setIsEditing(true);
                    }}
                    title="Edit profile information"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.8)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    <Edit3 size={15} />
                  </button>
                )}
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          {isEditing ? (
            /* Edit Profile Form */
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Organization / University
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter organization / university"
                  value={formData.org}
                  onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
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
                  <Save size={15} />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Profile Details Grid */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Organization Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B' }}>
                    Organization
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1E293B' }}>
                    {user.org || 'VIT-AP University'}
                  </div>
                </div>
              </div>

              {/* Role & Access Level Card */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  backgroundColor: roleTheme.bg,
                  border: `1px solid ${roleTheme.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: roleTheme.color, fontWeight: 700, fontSize: 13.5 }}>
                    <Shield size={16} />
                    <span>Role: {role}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      backgroundColor: '#FFFFFF',
                      color: roleTheme.color,
                      border: `1px solid ${roleTheme.border}`,
                    }}
                  >
                    {roleTheme.tag}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                  {roleTheme.desc}
                </p>
              </div>

              {/* Real-Time MFA Status Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>
                      Real-Time Multi-Factor Authentication (MFA)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#059669', fontWeight: 600 }}>
                      <CheckCircle size={12} /> Active
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                    One-time 6-digit codes are delivered in real time for every sign-in attempt.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone: Delete Account */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #E2E8F0' }}>
            {showDeleteConfirm ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B91C1C', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  <AlertCircle size={18} />
                  <span>Confirm Permanent Account Deletion</span>
                </div>
                <p style={{ fontSize: 12.5, color: '#7F1D1D', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  This will permanently delete your account, saved preferences, and revoke active sessions. This action cannot be reversed.
                </p>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#991B1B', marginBottom: 6 }}>
                  Type <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>DELETE</span> to confirm:
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Type DELETE"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    style={{ flex: 1, borderColor: '#FCA5A5' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmationText('');
                    }}
                    className="btn btn-secondary btn-sm"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none' }}
                    disabled={isDeleting || deleteConfirmationText.trim().toLowerCase() !== 'delete'}
                  >
                    <Trash2 size={14} />
                    <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={15} />
                  <span>Delete Account</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;
