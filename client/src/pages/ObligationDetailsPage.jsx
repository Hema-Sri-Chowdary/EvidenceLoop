import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  User,
  Tag,
} from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ReadinessIssueList from '../components/ReadinessIssueList.jsx';
import EvidenceList from '../components/EvidenceList.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { obligationService } from '../services/obligationService.js';
import { formatDate, formatDeadlineRelative } from '../utils/dateUtils.js';
import { useToast } from '../context/ToastContext.jsx';

export function ObligationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [obligation, setObligation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchObligation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await obligationService.getObligationById(id);
      setObligation(res.data);
    } catch (err) {
      setError(err.userMessage || 'Obligation not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObligation();
  }, [id]);

  const handleAddEvidence = async (evidencePayload) => {
    setIsAddingEvidence(true);
    try {
      const res = await obligationService.addEvidence(id, evidencePayload);
      setObligation(res.data);
      toast.success('Supporting evidence link attached successfully.', 'Evidence Added');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to attach evidence.');
      throw err;
    } finally {
      setIsAddingEvidence(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await obligationService.deleteObligation(id);
      toast.success('Obligation removed.');
      navigate('/obligations');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to delete obligation.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading audit obligation details..." />;
  }

  if (error || !obligation) {
    return (
      <ErrorState
        title="Obligation Not Found"
        message={error || `Could not find obligation record with ID ${id}`}
        onRetry={() => navigate('/obligations')}
      />
    );
  }

  const { readiness = {} } = obligation;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1040, margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title={obligation.title}
        description="Audit Readiness Assessment & Evidence Verification File"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge type="priority" value={obligation.priority} />
            <StatusBadge type="workStatus" value={obligation.status} />
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/obligations')} className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button onClick={() => navigate(`/obligations/${id}/edit`)} className="btn btn-secondary">
              <Edit3 size={15} style={{ color: 'var(--text-secondary)' }} />
              <span>Edit</span>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-outline-danger">
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        }
      />

      {/* Main Grid: Left Side (Details + Evidence), Right Side (Readiness Assessment) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Left Side: Overview & Evidence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 2' }}>
          {/* Metadata Overview Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                Description & Control Objectives
              </span>
              <p style={{ marginTop: 8, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {obligation.description || 'No detailed scope or procedural description specified for this obligation.'}
              </p>
            </div>

            {/* Attributes Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
                paddingTop: 16,
                borderTop: '1px solid var(--border)',
              }}
            >
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Responsible Owner</span>
                </span>
                <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {obligation.owner}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Category</span>
                </span>
                <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {obligation.category}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Deadline</span>
                </span>
                <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(obligation.dueDate)}
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    marginTop: 2,
                    fontWeight: 600,
                    color: readiness.overdue
                      ? 'var(--overdue-text)'
                      : readiness.dueSoon
                      ? 'var(--due-soon-text)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {formatDeadlineRelative(obligation.dueDate, obligation.status === 'Completed')}
                </p>
              </div>
            </div>
          </div>

          {/* Evidence Attachments Section */}
          <EvidenceList
            evidence={obligation.evidence || []}
            evidenceRequired={obligation.evidenceRequired}
            onAddEvidence={handleAddEvidence}
            isAdding={isAddingEvidence}
          />
        </div>

        {/* Right Side: Readiness Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ReadinessIssueList
            readiness={readiness}
            obligation={obligation}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Obligation"
        message={`Are you sure you want to delete "${obligation.title}"? This action permanently removes the obligation and all linked evidence references.`}
        confirmLabel="Yes, Delete Obligation"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export default ObligationDetailsPage;
