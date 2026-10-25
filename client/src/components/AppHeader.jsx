import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, LogOut, User, Shield, Building } from './Icons.jsx';
import { isDemoModeActive } from '../services/obligationService.js';
import { useAuth } from '../context/AuthContext.jsx';
import UserProfileModal from './UserProfileModal.jsx';

export function AppHeader({ onOpenSidebar, isBackendOnline = true }) {
  const navigate = useNavigate();
  const { user, role, logout, canMutate } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'Auditor':
        return { backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' };
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      <header className="app-header">
        {/* Left side: Hamburger button + Title context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onOpenSidebar}
            className="btn-icon"
            style={{ display: 'none' }}
            id="mobile-nav-toggle"
            aria-label="Open navigation sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="header-breadcrumbs">
            <span className="header-breadcrumbs-section">Internal Audit</span>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Compliance Readiness Workspace
            </span>
          </div>
        </div>

        {/* Right side: Status Indicator + User Profile + Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* System / Storage Mode Badge */}
          <div
            className="badge"
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            <span>Live Engine Connected</span>
          </div>

          {/* User Profile Card Button */}
          {user && (
            <button
              onClick={() => setIsProfileOpen(true)}
              title="Click to view and edit profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '4px 12px 4px 6px',
                borderRadius: 24,
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0F766E';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 118, 110, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              }}
            >
              {/* Mini Avatar */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {getInitials(user.name)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 10,
                      ...getRoleBadgeStyle(role),
                    }}
                  >
                    {role}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {user.org || (role === 'Auditor' ? 'VIT-AP University' : user.email)}
                </span>
              </div>
            </button>
          )}

          {/* Primary Action Button (Restricted to Auditor) */}
          {canMutate && (
            <button onClick={() => navigate('/obligations/new')} className="btn btn-primary">
              <Plus size={16} />
              <span>New Obligation</span>
            </button>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn btn-secondary"
              title="Log out of EvidenceLoop"
              style={{ padding: '8px 12px' }}
            >
              <LogOut size={16} />
              <span style={{ fontSize: 13 }}>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}

export default AppHeader;
