import React from 'react';
import { Loader2 } from './Icons.jsx';

export function LoadingState({ message = 'Loading obligations and audit readiness...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px', textAlign: 'center' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: 'var(--teal-subtle)',
          color: 'var(--teal-action)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Loader2 size={24} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{message}</h3>
      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>Evaluating audit compliance rules</p>
    </div>
  );
}

export default LoadingState;
