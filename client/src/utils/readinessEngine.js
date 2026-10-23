/**
 * EvidenceLoop Readiness Engine
 * Evaluates audit readiness and compliance gaps based on strict business logic.
 * Supports clock-injection (now) for reliable unit testing and boundary condition evaluation.
 */

/**
 * Standardize date to end of day if only date (YYYY-MM-DD) is provided,
 * or returns valid Date object.
 */
export function normalizeDueDate(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return null;

  // If string matches YYYY-MM-DD exactly without time, set to end of that day (23:59:59.999)
  if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
    const [year, month, day] = dueDate.trim().split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  return d;
}

/**
 * Compute the full audit readiness state for an obligation.
 * 
 * @param {Object} obligation - The obligation record
 * @param {Date|string|number} [currentDate] - Injected timestamp (defaults to Date.now())
 * @returns {Object} { overdue, missingEvidence, dueSoon, readyForReview, hasGap, reasons, nextAction }
 */
export function calculateReadiness(obligation, currentDate = new Date()) {
  const now = new Date(currentDate);
  const nowTime = now.getTime();

  const isCompleted = obligation?.status === 'Completed';
  const evidenceRequired = Boolean(obligation?.evidenceRequired);
  const evidenceList = Array.isArray(obligation?.evidence) ? obligation.evidence : [];
  const hasEvidence = evidenceList.length > 0;

  // 1. Missing Evidence Rule
  // An obligation has missing evidence if evidence is required and no evidence link has been attached.
  // Critical rule: If marked Completed with evidenceRequired=true and no evidence, missingEvidence MUST still be true.
  const missingEvidence = evidenceRequired && !hasEvidence;

  // Due Date Validation
  const dueDateTimeObj = normalizeDueDate(obligation?.dueDate);
  let overdue = false;
  let dueSoon = false;

  if (dueDateTimeObj) {
    const dueTime = dueDateTimeObj.getTime();

    // 2. Overdue Rule
    // An obligation is overdue if its due date has passed and its work status is not Completed.
    overdue = !isCompleted && dueTime < nowTime;

    // 3. Due Soon Rule
    // An obligation is due soon if it is incomplete, not yet overdue, and its deadline falls within the next seven days.
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    dueSoon = !isCompleted && !overdue && dueTime >= nowTime && dueTime <= nowTime + sevenDaysInMs;
  }

  // 4. Ready for Review Rule
  // An obligation is completed and all required evidence has been provided.
  // Note: "Ready for Review" means required information has been provided, not that an auditor has verified it.
  const readyForReview = isCompleted && !missingEvidence;

  // 5. Readiness Gap Rule
  // An obligation has a readiness gap if it is overdue or required evidence is missing.
  const hasGap = overdue || missingEvidence;

  // Build Explanations / Reasons
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

  // Determine Next Action
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

/**
 * Calculate summary metrics across an array of obligations
 */
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

    return {
      ...item,
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
