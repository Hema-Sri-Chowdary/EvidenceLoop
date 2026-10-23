import React from 'react';
import { Search, X, RotateCcw } from './Icons.jsx';

export function SearchAndFilters({ filters, onChange, onReset, totalResults }) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== 'All' ||
    filters.priority !== 'All' ||
    filters.evidenceStatus !== 'All' ||
    filters.sortBy !== 'dueDate' ||
    filters.order !== 'asc';

  return (
    <div className="card" style={{ padding: 16 }}>
      {/* Top row: Search input & Active count */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder="Search obligations by title, owner, or category..."
            className="form-input"
            style={{ paddingLeft: 36, paddingRight: 32 }}
          />
          {filters.search && (
            <button
              onClick={() => onChange('search', '')}
              className="btn-icon"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 24,
                height: 24,
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{totalResults}</strong> obligation
            {totalResults === 1 ? '' : 's'}
          </span>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--teal-action)' }}
            >
              <RotateCcw size={13} />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Filter dropdowns and sort */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Work Status */}
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="form-select"
            style={{ height: 38, fontSize: 13.5 }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => onChange('priority', e.target.value)}
            className="form-select"
            style={{ height: 38, fontSize: 13.5 }}
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Evidence Status */}
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Evidence Status
          </label>
          <select
            value={filters.evidenceStatus}
            onChange={(e) => onChange('evidenceStatus', e.target.value)}
            className="form-select"
            style={{ height: 38, fontSize: 13.5 }}
          >
            <option value="All">All Requirements</option>
            <option value="Missing Evidence">Missing Evidence</option>
            <option value="Evidence Attached">Evidence Attached</option>
            <option value="Ready for Review">Ready for Review</option>
            <option value="Not Required">Evidence Not Required</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Sort By
          </label>
          <select
            value={`${filters.sortBy}-${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              onChange('sortBy', sortBy);
              onChange('order', order);
            }}
            className="form-select"
            style={{ height: 38, fontSize: 13.5 }}
          >
            <option value="dueDate-asc">Deadline (Earliest First)</option>
            <option value="dueDate-desc">Deadline (Furthest First)</option>
            <option value="priority-desc">Priority (Highest First)</option>
            <option value="priority-asc">Priority (Lowest First)</option>
            <option value="title-asc">Title (A to Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default SearchAndFilters;
