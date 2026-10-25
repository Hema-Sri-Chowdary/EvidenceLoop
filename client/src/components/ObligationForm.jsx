import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, Save, X, Link2, Calendar } from './Icons.jsx';
import { formatDateInput } from '../utils/dateUtils.js';

const CATEGORIES = [
  'Access Management',
  'Data Privacy',
  'Vulnerability Management',
  'Business Continuity',
  'Human Resources',
  'Vendor Management',
  'Operations',
  'Security Architecture',
  'Incident Response',
  'Policy Governance',
];

export function ObligationForm({
  initialData = {},
  onSubmit,
  isEdit = false,
  isSaving = false,
}) {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || 'Access Management',
    owner: initialData.owner || '',
    dueDate: formatDateInput(initialData.dueDate) || '',
    priority: initialData.priority || 'Medium',
    status: initialData.status || 'Open',
    evidenceRequired: initialData.evidenceRequired !== undefined ? initialData.evidenceRequired : true,
    evidence: initialData.evidence ? [...initialData.evidence] : [],
  });

  // New evidence row draft
  const [newEvidenceLabel, setNewEvidenceLabel] = useState('');
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [evidenceError, setEvidenceError] = useState('');

  // Inline Validation Errors
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required.';
    } else if (formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    }

    if (!formData.category.trim()) {
      errs.category = 'Category is required.';
    }

    if (!formData.owner.trim()) {
      errs.owner = 'Responsible owner is required.';
    }

    if (!formData.dueDate) {
      errs.dueDate = 'Due date is required.';
    } else {
      const d = new Date(formData.dueDate);
      if (isNaN(d.getTime())) {
        errs.dueDate = 'Please provide a valid date.';
      }
    }

    if (!['Low', 'Medium', 'High', 'Critical'].includes(formData.priority)) {
      errs.priority = 'Invalid priority selection.';
    }

    if (!['Open', 'In Progress', 'Completed'].includes(formData.status)) {
      errs.status = 'Invalid work status selection.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddEvidenceRow = (e) => {
    e.preventDefault();
    setEvidenceError('');

    if (!newEvidenceLabel.trim()) {
      setEvidenceError('Label is required for evidence link.');
      return;
    }
    const trimmedUrl = newEvidenceUrl.trim();
    if (!trimmedUrl) {
      setEvidenceError('URL is required for evidence link.');
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setEvidenceError('URL must begin with http:// or https://');
        return;
      }
    } catch {
      setEvidenceError('Please enter a valid HTTP or HTTPS URL.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      evidence: [
        ...prev.evidence,
        {
          label: newEvidenceLabel.trim(),
          url: trimmedUrl,
          addedAt: new Date().toISOString(),
        },
      ],
    }));

    setNewEvidenceLabel('');
    setNewEvidenceUrl('');
  };

  const handleRemoveEvidenceRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!validate()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* General Obligation Details Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          Obligation Definition
        </h3>

        {/* Title */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Obligation Title <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Annual SOC 2 User Access Review & Deprovisioning Audit"
            className={`form-input ${errors.title ? 'error' : ''}`}
          />
          {errors.title && (
            <p className="form-error">
              <AlertCircle size={12} />
              <span>{errors.title}</span>
            </p>
          )}
        </div>

        {/* Description */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Obligation Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Document scope, compliance standard, control objective, or procedural requirements..."
            className="form-textarea"
          />
        </div>

        {/* Category & Owner Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Compliance Category <span className="required">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="form-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Responsible Owner <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => handleChange('owner', e.target.value)}
              placeholder="e.g., Sarah Jenkins (IT SecOps)"
              className={`form-input ${errors.owner ? 'error' : ''}`}
            />
            {errors.owner && (
              <p className="form-error">
                <AlertCircle size={12} />
                <span>{errors.owner}</span>
              </p>
            )}
          </div>
        </div>

        {/* Due Date, Priority, Work Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Due Date <span className="required">*</span>
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className={`form-input ${errors.dueDate ? 'error' : ''}`}
            />
            {errors.dueDate && (
              <p className="form-error">
                <AlertCircle size={12} />
                <span>{errors.dueDate}</span>
              </p>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Priority <span className="required">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="form-select"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Work Status <span className="required">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="form-select"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Configuration Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Evidence Configuration</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Specify whether internal auditors require documented proof to consider this ready.
            </p>
          </div>
          {/* Custom Checkbox Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={formData.evidenceRequired}
              onChange={(e) => handleChange('evidenceRequired', e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--teal-action)' }}
            />
            <span>{formData.evidenceRequired ? 'Evidence Required' : 'Optional Evidence'}</span>
          </label>
        </div>

        {formData.evidenceRequired && (
          <div style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: 'var(--missing-bg)', border: '1px solid var(--missing-border)', color: 'var(--missing-text)', fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ lineHeight: 1.4 }}>
              <strong>Audit Readiness Rule:</strong> Even if this obligation is marked <em>Completed</em>, it will be flagged as an <strong>Unresolved Readiness Gap</strong> until at least one supporting evidence link is attached.
            </div>
          </div>
        )}

        {/* Existing Attached Evidence */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Attached Evidence Links ({formData.evidence.length})
          </label>

          {formData.evidence.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px 0' }}>
              No evidence links attached yet. You can attach links now or add them later from the obligation details page.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: 8, backgroundColor: '#F8FAFC' }}>
              {formData.evidence.map((item, index) => (
                <li
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Link2 size={14} style={{ color: 'var(--teal-action)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                      {item.url}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvidenceRow(index)}
                    className="btn-icon danger"
                    title="Remove evidence link"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inline Add Evidence Link Section */}
        <div style={{ paddingTop: 8 }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Attach Link Now
          </span>
          {evidenceError && (
            <p className="form-error" style={{ marginBottom: 8 }}>
              <AlertCircle size={12} />
              <span>{evidenceError}</span>
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <input
              type="text"
              value={newEvidenceLabel}
              onChange={(e) => setNewEvidenceLabel(e.target.value)}
              placeholder="Label (e.g. Q3 SOC2 Report PDF)"
              className="form-input"
              style={{ flex: 1, minWidth: 200, height: 36, fontSize: 12 }}
            />
            <input
              type="url"
              value={newEvidenceUrl}
              onChange={(e) => setNewEvidenceUrl(e.target.value)}
              placeholder="URL (https://...)"
              className="form-input"
              style={{ flex: 1, minWidth: 200, height: 36, fontSize: 12 }}
            />
            <button
              type="button"
              onClick={handleAddEvidenceRow}
              className="btn btn-secondary btn-sm"
              style={{ height: 36 }}
            >
              + Add Link
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isSaving}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="btn btn-primary"
        >
          <Save size={16} />
          <span>{isSaving ? 'Saving Obligation...' : isEdit ? 'Update Obligation' : 'Create Obligation'}</span>
        </button>
      </div>
    </form>
  );
}

export default ObligationForm;
