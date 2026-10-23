import { describe, it, expect } from 'vitest';
import { calculateReadiness, calculateDashboardSummary, normalizeDueDate } from '../utils/readinessEngine.js';

describe('EvidenceLoop Readiness Engine', () => {
  // Use a fixed reference point in time for tests: 2026-10-23T12:00:00Z
  const frozenNow = new Date('2026-10-23T12:00:00Z');

  it('1. Incomplete obligation with a past deadline is overdue', () => {
    const obligation = {
      title: 'Vendor Risk Review',
      status: 'In Progress',
      dueDate: '2026-10-20', // 3 days in the past
      evidenceRequired: false,
      evidence: [],
    };

    const res = calculateReadiness(obligation, frozenNow);
    expect(res.overdue).toBe(true);
    expect(res.hasGap).toBe(true);
    expect(res.reasons.some((r) => r.includes('past its due date'))).toBe(true);
  });

  it('2. Completed obligation with a past deadline is not overdue', () => {
    const obligation = {
      title: 'Server Migration',
      status: 'Completed',
      dueDate: '2026-10-20',
      evidenceRequired: false,
      evidence: [],
    };

    const res = calculateReadiness(obligation, frozenNow);
    expect(res.overdue).toBe(false);
    expect(res.hasGap).toBe(false);
    expect(res.readyForReview).toBe(true);
  });

  it('3. Required evidence missing produces an evidence gap', () => {
    const obligation = {
      title: 'Firewall Policy Review',
      status: 'Open',
      dueDate: '2026-11-15', // Future
      evidenceRequired: true,
      evidence: [],
    };

    const res = calculateReadiness(obligation, frozenNow);
    expect(res.missingEvidence).toBe(true);
    expect(res.hasGap).toBe(true);
    expect(res.nextAction).toBe('Add supporting evidence.');
  });

  it('4. Optional evidence missing does not produce an evidence gap', () => {
    const obligation = {
      title: 'Team Wiki Styling',
      status: 'In Progress',
      dueDate: '2026-11-15', // Future
      evidenceRequired: false,
      evidence: [],
    };

    const res = calculateReadiness(obligation, frozenNow);
    expect(res.missingEvidence).toBe(false);
    expect(res.hasGap).toBe(false);
  });

  it('5. Critical Rule: Completed obligation with missing required evidence remains a readiness gap', () => {
    const obligation = {
      title: 'Quarterly Pen Test',
      status: 'Completed',
      dueDate: '2026-10-20',
      evidenceRequired: true,
      evidence: [], // Empty evidence!
    };

    const res = calculateReadiness(obligation, frozenNow);
    // Must NOT be considered ready for review!
    expect(res.missingEvidence).toBe(true);
    expect(res.hasGap).toBe(true);
    expect(res.readyForReview).toBe(false);
    expect(res.nextAction).toBe('Add supporting evidence.');
  });

  it('6. Obligation with all required information is ready for review', () => {
    const obligation = {
      title: 'Annual Disaster Recovery Test',
      status: 'Completed',
      dueDate: '2026-10-20',
      evidenceRequired: true,
      evidence: [
        {
          label: 'Failover logs export',
          url: 'https://storage.internal/audit/failover-2026.pdf',
        },
      ],
    };

    const res = calculateReadiness(obligation, frozenNow);
    expect(res.readyForReview).toBe(true);
    expect(res.hasGap).toBe(false);
    expect(res.missingEvidence).toBe(false);
    expect(res.nextAction).toBe('Required information is available for review.');
  });

  it('7. Due-soon boundary cases behave correctly', () => {
    // 5 days away and incomplete -> dueSoon is true
    const dueIn5Days = {
      status: 'In Progress',
      dueDate: '2026-10-28',
      evidenceRequired: false,
    };
    expect(calculateReadiness(dueIn5Days, frozenNow).dueSoon).toBe(true);

    // 10 days away and incomplete -> dueSoon is false
    const dueIn10Days = {
      status: 'In Progress',
      dueDate: '2026-11-02',
      evidenceRequired: false,
    };
    expect(calculateReadiness(dueIn10Days, frozenNow).dueSoon).toBe(false);

    // Completed within 5 days -> dueSoon is false (completed tasks are not due soon)
    const completedSoon = {
      status: 'Completed',
      dueDate: '2026-10-28',
      evidenceRequired: false,
    };
    expect(calculateReadiness(completedSoon, frozenNow).dueSoon).toBe(false);

    // Past deadline -> overdue is true, dueSoon is false
    const pastDeadline = {
      status: 'In Progress',
      dueDate: '2026-10-15',
      evidenceRequired: false,
    };
    const pastRes = calculateReadiness(pastDeadline, frozenNow);
    expect(pastRes.overdue).toBe(true);
    expect(pastRes.dueSoon).toBe(false);
  });

  it('8. Invalid dates are rejected or handled safely without crashing', () => {
    const invalidObligation = {
      title: 'Corrupted Date Entry',
      status: 'Open',
      dueDate: 'not-a-valid-date',
      evidenceRequired: false,
      evidence: [],
    };

    const res = calculateReadiness(invalidObligation, frozenNow);
    expect(res.overdue).toBe(false);
    expect(res.dueSoon).toBe(false);
    expect(normalizeDueDate('invalid-date')).toBeNull();
  });

  it('9. Overlapping issues are represented correctly', () => {
    // Overdue AND missing required evidence simultaneously
    const multiIssueObligation = {
      title: 'Critical Audit Failure',
      status: 'Open',
      dueDate: '2026-10-10', // Overdue
      evidenceRequired: true,
      evidence: [], // Missing evidence
    };

    const res = calculateReadiness(multiIssueObligation, frozenNow);
    expect(res.overdue).toBe(true);
    expect(res.missingEvidence).toBe(true);
    expect(res.hasGap).toBe(true);
    expect(res.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('10. calculateDashboardSummary accurately summarizes workspace', () => {
    const list = [
      {
        status: 'In Progress',
        dueDate: '2026-10-20', // Overdue
        evidenceRequired: true,
        evidence: [], // Missing evidence
      },
      {
        status: 'Completed',
        dueDate: '2026-10-20',
        evidenceRequired: true,
        evidence: [{ label: 'report', url: 'https://example.com' }], // Ready
      },
      {
        status: 'Open',
        dueDate: '2026-10-26', // Due soon (3 days)
        evidenceRequired: false,
        evidence: [],
      },
    ];

    const summary = calculateDashboardSummary(list, frozenNow);
    expect(summary.total).toBe(3);
    expect(summary.open).toBe(2);
    expect(summary.overdue).toBe(1);
    expect(summary.missingEvidence).toBe(1);
    expect(summary.dueSoon).toBe(1);
    expect(summary.readyForReview).toBe(1);
    expect(summary.hasGap).toBe(1); // 1 item has gaps
  });
});
