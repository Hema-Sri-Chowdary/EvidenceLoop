import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertCircle,
  FileQuestion,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Calendar,
  ClipboardList,
} from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { obligationService } from '../services/obligationService.js';
import { formatDeadlineRelative } from '../utils/dateUtils.js';

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await obligationService.getDashboardSummary();
      setSummary(res.data);
    } catch (err) {
      setError(err.userMessage || 'Failed to load audit dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingState message="Analyzing compliance obligations & calculating readiness gaps..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load audit dashboard"
        message={error}
        onRetry={loadDashboard}
        onEnableDemo={() => {
          obligationService.resetDemoData();
          loadDashboard();
        }}
      />
    );
  }

  const {
    total = 0,
    open = 0,
    overdue = 0,
    missingEvidence = 0,
    dueSoon = 0,
    readyForReview = 0,
    enriched = [],
  } = summary || {};

  if (total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <PageHeader
          title="Audit Readiness Dashboard"
          description="Identify what prevents your team from being internal-audit ready and what to remediate first."
        />
        <EmptyState
          title="No compliance obligations registered"
          description="Your audit registry is currently empty. Start by creating an obligation or load standard demo compliance records."
          actionLabel="Create First Obligation"
          onAction={() => navigate('/obligations/new')}
          secondaryActionLabel="Load Demo Dataset"
          onSecondaryAction={() => {
            obligationService.resetDemoData();
            loadDashboard();
          }}
        />
      </div>
    );
  }

  // Prioritized Needs Attention Queue
  const priorityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const needsAttentionQueue = enriched
    .filter((o) => o.readiness?.hasGap)
    .sort((a, b) => {
      const rankDiff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      if (rankDiff !== 0) return rankDiff;
      if (b.readiness?.overdue && !a.readiness?.overdue) return 1;
      if (!b.readiness?.overdue && a.readiness?.overdue) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  // Upcoming deadlines
  const upcomingDeadlines = enriched
    .filter((o) => o.status !== 'Completed' && !o.readiness?.overdue)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const readinessPercent = total > 0 ? Math.round((readyForReview / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page Header */}
      <PageHeader
        title="Audit Readiness Dashboard"
        description="Core Question: What is preventing our team from being audit-ready, and what should we fix first?"
        actions={
          <button onClick={() => navigate('/obligations/new')} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Obligation</span>
          </button>
        }
      />

      {/* KPI Cards Grid */}
      <section aria-label="Key Performance Indicators">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <StatCard
            title="Open Obligations"
            value={open}
            subtext={`${total} total obligations tracked`}
            icon={ClipboardList}
            variant="default"
            onClick={() => navigate('/obligations?status=Open')}
          />
          <StatCard
            title="Overdue Obligations"
            value={overdue}
            subtext="Past deadline & incomplete"
            icon={AlertCircle}
            variant="overdue"
            onClick={() => navigate('/obligations?status=In%20Progress&sortBy=dueDate&order=asc')}
          />
          <StatCard
            title="Missing Evidence"
            value={missingEvidence}
            subtext="Proof required but unlinked"
            icon={FileQuestion}
            variant="missingEvidence"
            onClick={() => navigate('/obligations?evidenceStatus=Missing%20Evidence')}
          />
          <StatCard
            title="Due in 7 Days"
            value={dueSoon}
            subtext="Upcoming compliance deadlines"
            icon={Clock}
            variant="dueSoon"
            onClick={() => navigate('/obligations?sortBy=dueDate&order=asc')}
          />
        </div>
      </section>

      {/* Readiness Health & Multi-segment Progress Bar */}
      <section aria-label="Audit Readiness Summary" className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} style={{ color: 'var(--teal-action)' }} />
              <span>Overall Audit Readiness Stance</span>
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Readiness requires both task completion and linked supporting proof.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--teal-action)' }}>{readinessPercent}%</span>
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginLeft: 6 }}>
              audit ready ({readyForReview}/{total})
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div style={{ width: '100%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
          <div
            style={{ width: `${(readyForReview / total) * 100}%`, backgroundColor: 'var(--ready-text)', transition: 'width 0.3s' }}
            title={`Ready for Review: ${readyForReview}`}
          />
          <div
            style={{ width: `${(missingEvidence / total) * 100}%`, backgroundColor: 'var(--missing-text)', transition: 'width 0.3s' }}
            title={`Missing Evidence: ${missingEvidence}`}
          />
          <div
            style={{ width: `${(overdue / total) * 100}%`, backgroundColor: 'var(--overdue-text)', transition: 'width 0.3s' }}
            title={`Overdue: ${overdue}`}
          />
        </div>

        {/* Legend */}
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: 13.5, color: 'var(--text-secondary)', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--ready-text)' }} />
            <span>Ready for Review: <strong style={{ color: 'var(--text-primary)' }}>{readyForReview}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--missing-text)' }} />
            <span>Missing Evidence: <strong style={{ color: 'var(--text-primary)' }}>{missingEvidence}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--overdue-text)' }} />
            <span>Overdue: <strong style={{ color: 'var(--text-primary)' }}>{overdue}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--due-soon-text)' }} />
            <span>Due Soon: <strong style={{ color: 'var(--text-primary)' }}>{dueSoon}</strong></span>
          </div>
        </div>
      </section>

      {/* Two Column Grid: Prioritized Needs Attention Queue + Upcoming Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Prioritized Needs Attention Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} style={{ color: 'var(--overdue-text)' }} />
                <span>Prioritized Needs Attention Queue</span>
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Urgent compliance gaps ranked by priority and risk
              </p>
            </div>
            <button
              onClick={() => navigate('/obligations')}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--teal-action)' }}
            >
              <span>View all ({total})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {needsAttentionQueue.length === 0 ? (
            <div className="card" style={{ padding: 36, textAlign: 'center' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--ready-text)', margin: '0 auto 8px', display: 'block' }} />
              <h4 style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-primary)' }}>No Active Audit Gaps</h4>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 400, margin: '6px auto 0' }}>
                Excellent! There are currently no overdue obligations or missing evidence requirements in the workspace.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {needsAttentionQueue.slice(0, 5).map((item) => {
                const readiness = item.readiness || {};
                return (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/obligations/${item._id}`)}
                    className="card card-sm"
                    style={{
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, transform 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="badge badge-low badge-sm" style={{ backgroundColor: '#F1F5F9' }}>
                            {item.category}
                          </span>
                          <StatusBadge type="priority" value={item.priority} size="sm" />
                          <StatusBadge type="workStatus" value={item.status} size="sm" />
                        </div>
                        <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </h4>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        {readiness.overdue && <StatusBadge type="readiness" value="overdue" size="sm" />}
                        {readiness.missingEvidence && !readiness.overdue && (
                          <StatusBadge type="readiness" value="missingEvidence" size="sm" />
                        )}
                      </div>
                    </div>

                    {/* Action Needed Callout */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5, paddingTop: 8, marginTop: 8, borderTop: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                      <span>Owner: <strong style={{ color: 'var(--text-primary)' }}>{item.owner}</strong></span>
                      <span style={{ color: 'var(--teal-action)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{readiness.nextAction}</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} style={{ color: 'var(--due-soon-text)' }} />
              <span>Upcoming Deadlines</span>
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 2 }}>Active obligations approaching due date</p>
          </div>

          <div className="card" style={{ padding: 16 }}>
            {upcomingDeadlines.length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>
                No active obligations due in the near term.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingDeadlines.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/obligations/${item._id}`)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <h5 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </h5>
                      <StatusBadge type="priority" value={item.priority} size="sm" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      <span>{item.owner}</span>
                      <span style={{ fontWeight: 600, color: 'var(--due-soon-text)' }}>
                        {formatDeadlineRelative(item.dueDate, false)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
