import React from 'react';
import { ArrowUpRight } from './Icons.jsx';

/**
 * StatCard Component
 * Enterprise KPI summary card with pure Vanilla CSS.
 */
export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  onClick,
  active = false,
}) {
  const variantClass =
    variant === 'overdue'
      ? 'variant-overdue'
      : variant === 'missingEvidence'
      ? 'variant-missing'
      : variant === 'dueSoon'
      ? 'variant-due-soon'
      : '';

  const valueColors = {
    default: 'var(--text-primary)',
    overdue: 'var(--overdue-text)',
    missingEvidence: 'var(--missing-text)',
    dueSoon: 'var(--due-soon-text)',
    ready: 'var(--ready-text)',
  };

  const iconBgStyles = {
    default: { bg: '#F1F5F9', color: '#475569' },
    overdue: { bg: 'var(--overdue-bg)', color: 'var(--overdue-text)' },
    missingEvidence: { bg: 'var(--missing-bg)', color: 'var(--missing-text)' },
    dueSoon: { bg: 'var(--due-soon-bg)', color: 'var(--due-soon-text)' },
    ready: { bg: 'var(--ready-bg)', color: 'var(--ready-text)' },
  };

  const iconStyle = iconBgStyles[variant] || iconBgStyles.default;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`stat-card ${variantClass}`}
      style={{
        outline: active ? '2px solid var(--teal-action)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: valueColors[variant] || valueColors.default }}>
              {value}
            </span>
          </div>
          {subtext && <p style={{ marginTop: 4, fontSize: 13.5, color: 'var(--text-secondary)' }}>{subtext}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {Icon && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: iconStyle.bg,
                color: iconStyle.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={20} />
            </div>
          )}
          {onClick && <ArrowUpRight size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
