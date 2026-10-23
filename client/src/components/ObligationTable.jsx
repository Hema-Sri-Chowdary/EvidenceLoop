import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit3, Trash2, LinkIcon, Calendar } from './Icons.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatDeadlineRelative } from '../utils/dateUtils.js';

export function ObligationTable({ obligations = [], onDeleteRequest }) {
  const navigate = useNavigate();

  return (
    <div className="table-wrapper">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Obligation & Category</th>
              <th>Owner</th>
              <th>Deadline</th>
              <th>Work Status</th>
              <th>Priority</th>
              <th>Audit Readiness</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {obligations.map((item) => {
              const readiness = item.readiness || {};
              const evidenceCount = Array.isArray(item.evidence) ? item.evidence.length : 0;

              return (
                <tr key={item._id} onClick={() => navigate(`/obligations/${item._id}`)}>
                  {/* Title & Category */}
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      <span className="badge badge-low badge-sm" style={{ backgroundColor: '#F1F5F9' }}>
                        {item.category}
                      </span>
                      {item.evidenceRequired ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                          <LinkIcon size={12} />
                          <span>{evidenceCount} link{evidenceCount === 1 ? '' : 's'}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Optional evidence</span>
                      )}
                    </div>
                  </td>

                  {/* Owner */}
                  <td style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {item.owner}
                  </td>

                  {/* Deadline */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 500 }}>{formatDate(item.dueDate)}</div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        marginTop: 2,
                        color: readiness.overdue
                          ? 'var(--overdue-text)'
                          : readiness.dueSoon
                          ? 'var(--due-soon-text)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {formatDeadlineRelative(item.dueDate, item.status === 'Completed')}
                    </div>
                  </td>

                  {/* Work Status */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <StatusBadge type="workStatus" value={item.status} />
                  </td>

                  {/* Priority */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <StatusBadge type="priority" value={item.priority} />
                  </td>

                  {/* Audit Readiness */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {readiness.overdue ? (
                      <StatusBadge type="readiness" value="overdue" />
                    ) : readiness.missingEvidence ? (
                      <StatusBadge type="readiness" value="missingEvidence" />
                    ) : readiness.readyForReview ? (
                      <StatusBadge type="readiness" value="readyForReview" />
                    ) : readiness.dueSoon ? (
                      <StatusBadge type="readiness" value="dueSoon" />
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13.5 }}>
                        On Track
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td
                    style={{ textAlign: 'right', whiteSpace: 'nowrap' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => navigate(`/obligations/${item._id}`)}
                        className="btn-icon"
                        title="View Audit Details"
                        aria-label={`View details for ${item.title}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/obligations/${item._id}/edit`)}
                        className="btn-icon"
                        title="Edit Obligation"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteRequest(item)}
                        className="btn-icon danger"
                        title="Delete Obligation"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ObligationTable;
