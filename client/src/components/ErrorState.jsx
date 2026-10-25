import React from 'react';
import { AlertCircle, RefreshCw, Database } from './Icons.jsx';

export function ErrorState({
  title = 'Failed to load records',
  message = 'An error occurred while communicating with the audit service.',
  onRetry,
  onEnableDemo,
}) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '54px 24px',
        textAlign: 'center',
        borderColor: 'var(--overdue-border)',
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          backgroundColor: 'var(--overdue-bg)',
          color: 'var(--overdue-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <AlertCircle size={26} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--overdue-text)' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, marginTop: 6, lineHeight: 1.5 }}>
        {message}
      </p>

      <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-secondary">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        )}
        {onEnableDemo && (
          <button onClick={onEnableDemo} className="btn btn-primary">
            <Database size={14} />
            <span>Load Demo Workspace</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
