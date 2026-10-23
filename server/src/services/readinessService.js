/**
 * Backend Audit Readiness Service
 * Enforces audit readiness rules consistently across all endpoints.
 * Supports clock-injection (currentDate) for testing boundary conditions.
 */

export function normalizeDueDate(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return null;

  if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
    const [year, month, day] = dueDate.trim().split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  return d;
}

export function calculateReadiness(obligation, currentDate = new Date()) {
  const now = new Date(currentDate);
  const nowTime = now.getTime();

  const isCompleted = obligation?.status === 'Completed';
  const evidenceRequired = Boolean(obligation?.evidenceRequired);
  const evidenceList = Array.isArray(obligation?.evidence) ? obligation.evidence : [];
  const hasEvidence = evidenceList.length > 0;

  // 1. Missing Evidence Rule
  const missingEvidence = evidenceRequired && !hasEvidence;

  // 2. Overdue Rule & 3. Due Soon Rule
  const dueDateTimeObj = normalizeDueDate(obligation?.dueDate);
  let overdue = false;
  let dueSoon = false;

  if (dueDateTimeObj) {
    const dueTime = dueDateTimeObj.getTime();
    overdue = !isCompleted && dueTime < nowTime;

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    dueSoon = !isCompleted && !overdue && dueTime >= nowTime && dueTime <= nowTime + sevenDaysInMs;
  }

  // 4. Ready for Review Rule
  const readyForReview = isCompleted && !missingEvidence;

  // 5. Readiness Gap Rule
  const hasGap = overdue || missingEvidence;

  // Diagnostic Reasons
  const reasons = [];
  if (overdue) {
    reasons.push('Obligation is past its due date and is not marked Completed.');
  }
  if (missingEvidence) {
    reasons.push(
      isCompleted
        ? 'Obligation was marked Completed, but required supporting evidence link is missing.'
        : 'Evidence is required for compliance, but no supporting evidence link has been attached.'
    );
  }
  if (dueSoon) {
    reasons.push('Obligation deadline falls within the next 7 days.');
  }
  if (readyForReview) {
    reasons.push('Obligation is completed and all required information is available for review.');
  }
  if (reasons.length === 0) {
    reasons.push('Work is in progress and on schedule.');
  }

  // Next Action
  let nextAction = 'Progress obligation to completion.';
  if (missingEvidence && overdue) {
    nextAction = 'Attach required evidence and update overdue status immediately.';
  } else if (missingEvidence) {
    nextAction = 'Add supporting evidence.';
  } else if (overdue) {
    nextAction = 'Review the overdue obligation and record its progress.';
  } else if (dueSoon) {
    nextAction = 'Complete the obligation before its deadline.';
  } else if (readyForReview) {
    nextAction = 'Required information is available for review.';
  }

  return {
    overdue,
    missingEvidence,
    dueSoon,
    readyForReview,
    hasGap,
    reasons,
    nextAction,
  };
}

export function enrichObligation(doc, currentDate = new Date()) {
  const obj = doc && typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  obj.readiness = calculateReadiness(obj, currentDate);
  return obj;
}

export function calculateDashboardSummary(obligations = [], currentDate = new Date()) {
  let openCount = 0;
  let overdueCount = 0;
  let missingEvidenceCount = 0;
  let dueSoonCount = 0;
  let readyForReviewCount = 0;
  let totalWithGap = 0;

  const enriched = obligations.map((item) => {
    const readiness = calculateReadiness(item, currentDate);
    if (item.status !== 'Completed') {
      openCount++;
    }
    if (readiness.overdue) overdueCount++;
    if (readiness.missingEvidence) missingEvidenceCount++;
    if (readiness.dueSoon) dueSoonCount++;
    if (readiness.readyForReview) readyForReviewCount++;
    if (readiness.hasGap) totalWithGap++;

    const plain = item && typeof item.toObject === 'function' ? item.toObject() : { ...item };
    return {
      ...plain,
      readiness,
    };
  });

  return {
    total: obligations.length,
    open: openCount,
    overdue: overdueCount,
    missingEvidence: missingEvidenceCount,
    dueSoon: dueSoonCount,
    readyForReview: readyForReviewCount,
    hasGap: totalWithGap,
    enriched,
  };
}
