import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Database, LogOut, User, Shield } from './Icons.jsx';
import { isDemoModeActive } from '../services/obligationService.js';
import { useAuth } from '../context/AuthContext.jsx';

export function AppHeader({ onOpenSidebar, isBackendOnline = true }) {
  const navigate = useNavigate();
  const { user, role, logout, canMutate } = useAuth();
  const demoActive = isDemoModeActive();

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'Admin':
        return { backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #D8B4FE' };
      case 'Auditor':
        return { backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' };
    }
  };

  return (
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
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 12,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isBackendOnline ? '#10B981' : '#F59E0B',
            }}
          />
          <span>{isBackendOnline ? 'Live API Connected' : 'Offline Engine'}</span>
        </div>

        {/* User Identity & Role Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {user.email}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                ...getRoleBadgeStyle(role),
              }}
            >
              {role}
            </span>
          </div>
        )}

        {/* Primary Action Button (Restricted to Admin & Auditor) */}
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
  );
}

export default AppHeader;
