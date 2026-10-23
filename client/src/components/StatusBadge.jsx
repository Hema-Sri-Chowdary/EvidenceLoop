import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, AlertTriangle, FileQuestion } from './Icons.jsx';

/**
 * StatusBadge Component
 * Pure Vanilla CSS status tag with text label and icon indicator.
 */
export function StatusBadge({ type, value, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'badge-sm' : '';

  // Work Status Badges
  if (type === 'workStatus') {
    switch (value) {
      case 'Completed':
        return (
          <span className={`badge badge-completed ${sizeClass}`}>
            <CheckCircle2 size={14} />
            <span>Completed</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className={`badge badge-progress ${sizeClass}`}>
            <Clock size={14} />
            <span>In Progress</span>
          </span>
        );
      case 'Open':
      default:
        return (
          <span className={`badge badge-open ${sizeClass}`}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94A3B8' }} />
            <span>Open</span>
          </span>
        );
    }
  }

  // Priority Badges
  if (type === 'priority') {
    switch (value) {
      case 'Critical':
        return (
          <span className={`badge badge-critical ${sizeClass}`}>
            <ShieldAlert size={14} />
            <span>Critical</span>
          </span>
        );
      case 'High':
        return (
          <span className={`badge badge-high ${sizeClass}`}>
            <AlertTriangle size={14} />
            <span>High</span>
          </span>
        );
      case 'Medium':
        return (
          <span className={`badge badge-medium ${sizeClass}`}>
            <span>Medium</span>
          </span>
        );
      case 'Low':
      default:
        return (
          <span className={`badge badge-low ${sizeClass}`}>
            <span>Low</span>
          </span>
        );
    }
  }

  // Readiness Status Badges
  if (type === 'readiness') {
    switch (value) {
      case 'overdue':
        return (
          <span className={`badge badge-overdue ${sizeClass}`}>
            <AlertCircle size={14} />
            <span>Overdue</span>
          </span>
        );
      case 'missingEvidence':
        return (
          <span className={`badge badge-missing-evidence ${sizeClass}`}>
            <FileQuestion size={14} />
            <span>Missing Evidence</span>
          </span>
        );
      case 'dueSoon':
        return (
          <span className={`badge badge-due-soon ${sizeClass}`}>
            <Clock size={14} />
            <span>Due Soon</span>
          </span>
        );
      case 'readyForReview':
        return (
          <span className={`badge badge-ready ${sizeClass}`}>
            <CheckCircle2 size={14} />
            <span>Ready for Review</span>
          </span>
        );
      default:
        return (
          <span className={`badge badge-open ${sizeClass}`}>
            <span>On Track</span>
          </span>
        );
    }
  }

  return (
    <span className={`badge ${sizeClass}`}>
      {value}
    </span>
  );
}

export default StatusBadge;
