/**
 * Date utilities for consistent date rendering and calculation
 */

export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid date';

  // Format e.g., "Oct 28, 2026"
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateInput(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysDifference(targetDate, currentDate = new Date()) {
  if (!targetDate) return 0;
  const target = new Date(targetDate);
  const current = new Date(currentDate);
  if (isNaN(target.getTime()) || isNaN(current.getTime())) return 0;

  // Set to midnight for clean day comparisons
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const c = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const diffMs = t - c;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDeadlineRelative(targetDate, isCompleted = false, currentDate = new Date()) {
  if (!targetDate) return 'No deadline';
  if (isCompleted) return 'Completed';

  const days = getDaysDifference(targetDate, currentDate);

  if (days < 0) {
    const abs = Math.abs(days);
    return `Overdue by ${abs} day${abs === 1 ? '' : 's'}`;
  }
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return 'Due tomorrow';
  }
  return `Due in ${days} days`;
}
