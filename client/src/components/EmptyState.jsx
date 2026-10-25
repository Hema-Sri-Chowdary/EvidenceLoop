import React from 'react';
import { ClipboardList, Plus } from './Icons.jsx';

export function EmptyState({
  title = 'No obligations found',
  description = 'Get started by creating your first compliance obligation or resetting your active filters.',
  icon: Icon = ClipboardList,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        border: '1px dashed var(--border)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon size={26} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, marginTop: 6, lineHeight: 1.5 }}>
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {actionLabel && (
            <button onClick={onAction} className="btn btn-primary">
              <Plus size={16} />
              <span>{actionLabel}</span>
            </button>
          )}
          {secondaryActionLabel && (
            <button onClick={onSecondaryAction} className="btn btn-secondary">
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
