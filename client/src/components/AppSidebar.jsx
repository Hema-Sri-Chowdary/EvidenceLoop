import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, PlusCircle, ShieldAlert, X, Database, User } from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function AppSidebar({ isOpen, onClose, onResetDemo }) {
  const { canMutate, isAdmin, role } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      to: '/',
      icon: LayoutDashboard,
      end: true,
      visible: true,
    },
    {
      label: 'Obligations Register',
      to: '/obligations',
      icon: CheckSquare,
      end: false,
      visible: true,
    },
    {
      label: 'Create Obligation',
      to: '/obligations/new',
      icon: PlusCircle,
      end: false,
      visible: canMutate,
    },
    {
      label: 'User Profile',
      to: '/profile',
      icon: User,
      end: false,
      visible: true,
    },
  ].filter((item) => item.visible);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 35,
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-badge">EL</div>
            <div>
              <div className="brand-title">EvidenceLoop</div>
              <div className="brand-subtitle">Audit Readiness</div>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: '#94a3b8' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Audit Standard Card */}
        <div className="sidebar-audit-card">
          <div className="sidebar-audit-title">
            <ShieldAlert size={14} />
            <span>Audit Standard</span>
          </div>
          <p className="sidebar-audit-desc">
            Evidence is strictly required. Tasks marked completed without proof remain flagged.
          </p>
          {onResetDemo && isAdmin && (
            <button
              onClick={onResetDemo}
              className="btn btn-secondary btn-sm"
              style={{
                marginTop: 10,
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Database size={13} style={{ color: '#5eead4' }} />
              <span>Reset Demo Records</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="sidebar-footer">
          <span>Enterprise MERN</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399' }} />
            System Live
          </span>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
