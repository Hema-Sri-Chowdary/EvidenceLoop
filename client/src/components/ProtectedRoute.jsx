import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingState from './LoadingState.jsx';
import { AlertCircle, Shield } from './Icons.jsx';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState message="Verifying security credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div style={{ maxWidth: 640, margin: '80px auto', padding: 32, textAlign: 'center' }} className="card">
        <div style={{ color: 'var(--critical)', marginBottom: 16, display: 'inline-flex' }}>
          <Shield size={48} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, marginBottom: 20 }}>
          Your current account role (<strong>{role}</strong>) does not have permission to view or manage this compliance section.
          Required role(s): <strong>{allowedRoles.join(', ')}</strong>.
        </p>
        <button onClick={() => window.history.back()} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
