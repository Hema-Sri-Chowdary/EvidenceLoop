import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, HelpCircle } from './Icons.jsx';

export function ReadinessIssueList({ readiness, obligation }) {
  if (!readiness) return null;

  const { overdue, missingEvidence, dueSoon, readyForReview, hasGap, reasons = [], nextAction } = readiness;

  const bannerTheme = hasGap
    ? { bg: 'var(--overdue-bg)', border: 'var(--overdue-border)', color: 'var(--overdue-text)', Icon: AlertCircle }
    : readyForReview
    ? { bg: 'var(--ready-bg)', border: 'var(--ready-border)', color: 'var(--ready-text)', Icon: CheckCircle2 }
    : dueSoon
    ? { bg: 'var(--due-soon-bg)', border: 'var(--due-soon-border)', color: 'var(--due-soon-text)', Icon: AlertTriangle }
    : { bg: '#F1F5F9', border: 'var(--border)', color: 'var(--text-secondary)', Icon: ShieldCheck };

  const { Icon } = bannerTheme;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Banner Summary */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: `1px solid ${bannerTheme.border}`,
          backgroundColor: bannerTheme.bg,
          color: bannerTheme.color,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ marginTop: 2 }}>
          <Icon size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700 }}>
            {hasGap
              ? 'Readiness Gap Detected'
              : readyForReview
              ? 'Ready for Audit Review'
              : dueSoon
              ? 'Upcoming Deadline Warning'
              : 'Audit Status: On Track'}
          </h4>
          <p style={{ fontSize: 12, marginTop: 4, lineHeight: 1.4, opacity: 0.9 }}>
            {hasGap
              ? 'This obligation has one or more unresolved compliance gaps that prevent audit sign-off.'
              : readyForReview
              ? 'All required work has been recorded and supporting evidence is attached for auditor review.'
              : dueSoon
              ? 'The due date for this open obligation is within the next 7 days.'
              : 'Work is currently in progress within the allotted timeframe.'}
          </p>
        </div>
      </div>

      {/* Audit Readiness Explanations & Reasons */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            Readiness Diagnosis & Explanations
          </h4>
          <ul style={{ marginTop: 10, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reasons.map((reason, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--border)',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--teal-action)', marginTop: 6, flexShrink: 0 }} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggested Next Action */}
        {nextAction && (
          <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
              Recommended Next Action
            </span>
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--teal-action)',
                backgroundColor: 'var(--teal-subtle)',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--teal-border)',
              }}
            >
              <ArrowRight size={16} style={{ flexShrink: 0 }} />
              <span>{nextAction}</span>
            </div>
          </div>
        )}

        {/* Guidance Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
          <HelpCircle size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span>Readiness status indicates required evidence is linked; it does not constitute certification.</span>
        </div>
      </div>
    </div>
  );
}

export default ReadinessIssueList;
