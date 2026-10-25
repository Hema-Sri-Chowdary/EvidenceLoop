import React, { useState } from 'react';
import { ExternalLink, Link2, Plus, Calendar, AlertCircle } from './Icons.jsx';
import { formatDate } from '../utils/dateUtils.js';

export function EvidenceList({
  evidence = [],
  evidenceRequired = false,
  onAddEvidence,
  isAdding = false,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!label.trim()) {
      setFormError('Evidence description / label is required.');
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setFormError('Evidence URL is required.');
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setFormError('URL must begin with http:// or https://');
        return;
      }
    } catch {
      setFormError('Please enter a valid HTTP or HTTPS URL (e.g., https://drive.google.com/...)');
      return;
    }

    try {
      await onAddEvidence({ label: label.trim(), url: trimmedUrl });
      setLabel('');
      setUrl('');
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.userMessage || 'Failed to attach evidence. Please try again.');
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            Supporting Evidence Records
          </h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {evidenceRequired ? (
              <span style={{ color: 'var(--missing-text)', fontWeight: 600 }}>Evidence is required for audit readiness</span>
            ) : (
              'Supporting evidence is optional for this obligation'
            )}
          </p>
        </div>
        {onAddEvidence && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--teal-action)' }}
          >
            <Plus size={14} />
            <span>Add Evidence Link</span>
          </button>
        )}
      </div>

      {/* Add Evidence Form */}
      {showAddForm && (
        <form
          onSubmit={handleFormSubmit}
          style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--teal-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Attach Verified Evidence URL</h5>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormError('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--overdue-bg)', border: '1px solid var(--overdue-border)', color: 'var(--overdue-text)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>
              Evidence Label / Title <span className="required">*</span>
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Annual SOC2 Type II Audit Report (Google Drive)"
              className="form-input"
              style={{ height: 36, fontSize: 12 }}
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>
              Evidence URL (HTTPS) <span className="required">*</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/... or https://compliance-docs.internal/..."
              className="form-input"
              style={{ height: 36, fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="btn btn-primary btn-sm"
            >
              {isAdding ? 'Saving...' : 'Save Evidence'}
            </button>
          </div>
        </form>
      )}

      {/* Evidence Items List */}
      {evidence.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>
          <Link2 size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>No evidence links attached</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {evidenceRequired
              ? 'This obligation has an open evidence gap until supporting documentation is attached.'
              : 'Add links to tickets, policies, reports, or drive folders as relevant.'}
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {evidence.map((item, idx) => (
            <li
              key={item._id || idx}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    backgroundColor: 'var(--teal-subtle)',
                    color: 'var(--teal-action)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Link2 size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h5 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </h5>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--teal-action)', marginTop: 2, textDecoration: 'none' }}
                  >
                    <span style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} />
                <span>{formatDate(item.addedAt || item.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EvidenceList;
