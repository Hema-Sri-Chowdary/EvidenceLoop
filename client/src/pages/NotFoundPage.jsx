import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from '../components/Icons.jsx';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: 'var(--teal-subtle)',
          border: '1px solid var(--teal-border)',
          color: 'var(--teal-action)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <ShieldAlert size={32} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--teal-action)' }}>
        404 Not Found
      </span>
      <h1 style={{ marginTop: 8, fontSize: 30, fontWeight: 800, color: 'var(--text-primary)' }}>
        Page Does Not Exist
      </h1>
      <p style={{ marginTop: 8, fontSize: 14.5, color: 'var(--text-secondary)', maxWidth: 440, lineHeight: 1.55 }}>
        The requested compliance record, audit page, or resource could not be located in EvidenceLoop.
      </p>

      <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          <LayoutDashboard size={16} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}

export default NotFoundPage;
