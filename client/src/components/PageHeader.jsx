import React from 'react';

export function PageHeader({ title, description, actions, badge }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', maxWidth: 720, lineHeight: 1.5 }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
