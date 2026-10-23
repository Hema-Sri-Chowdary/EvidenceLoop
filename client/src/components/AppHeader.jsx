import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Database } from './Icons.jsx';
import { isDemoModeActive } from '../services/obligationService.js';

export function AppHeader({ onOpenSidebar, isBackendOnline = true }) {
  const navigate = useNavigate();
  const demoActive = isDemoModeActive();

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

      {/* Right side: Status Indicator + Primary Action */}
      <div className="header-actions">
        {/* System / Storage Mode Badge */}
        {demoActive ? (
          <div className="badge badge-medium">
            <Database size={13} />
            <span>Demo Mode</span>
          </div>
        ) : (
          <div
            className="badge"
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
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
        )}

        {/* Primary Action Button */}
        <button onClick={() => navigate('/obligations/new')} className="btn btn-primary">
          <Plus size={16} />
          <span>New Obligation</span>
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
