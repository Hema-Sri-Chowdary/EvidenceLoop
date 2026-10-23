import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Download } from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchAndFilters from '../components/SearchAndFilters.jsx';
import ObligationTable from '../components/ObligationTable.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import useObligations from '../hooks/useObligations.js';

export function ObligationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialParams = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'All',
    priority: searchParams.get('priority') || 'All',
    evidenceStatus: searchParams.get('evidenceStatus') || 'All',
    sortBy: searchParams.get('sortBy') || 'dueDate',
    order: searchParams.get('order') || 'asc',
  };

  const {
    obligations,
    total,
    isLoading,
    error,
    params,
    updateParam,
    resetFilters,
    refetch,
    deleteObligation,
    handleExportCsv,
  } = useObligations(initialParams);

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFilterChange = (key, value) => {
    updateParam(key, value);
    const nextParams = new URLSearchParams(searchParams);
    if (value && value !== 'All') {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleResetFilters = () => {
    resetFilters();
    setSearchParams({}, { replace: true });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteObligation(itemToDelete._id);
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSearchOrFilterActive =
    Boolean(params.search) ||
    params.status !== 'All' ||
    params.priority !== 'All' ||
    params.evidenceStatus !== 'All';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <PageHeader
        title="Obligations Register"
        description="Comprehensive audit-readiness ledger. Track obligation deadlines, compliance owners, evidence requirements, and readiness flags."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleExportCsv}
              disabled={obligations.length === 0}
              className="btn btn-secondary"
              title="Export filtered records to CSV"
            >
              <Download size={15} style={{ color: 'var(--text-secondary)' }} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => navigate('/obligations/new')}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Create Obligation</span>
            </button>
          </div>
        }
      />

      {/* Search and Filters Control */}
      <SearchAndFilters
        filters={params}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={total}
      />

      {/* Main Content States */}
      {isLoading ? (
        <LoadingState message="Loading obligations register..." />
      ) : error ? (
        <ErrorState
          title="Failed to load obligations"
          message={error}
          onRetry={refetch}
        />
      ) : obligations.length === 0 ? (
        hasSearchOrFilterActive ? (
          <EmptyState
            title="No matching obligations found"
            description="No obligations matched your current search criteria and filters. Try clearing your search or resetting filters."
            actionLabel="Reset Active Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            title="Obligations register is empty"
            description="There are currently no compliance obligations in your workspace. Register your first obligation to start tracking audit readiness."
            actionLabel="Create First Obligation"
            onAction={() => navigate('/obligations/new')}
          />
        )
      ) : (
        <ObligationTable
          obligations={obligations}
          onDeleteRequest={(item) => setItemToDelete(item)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Obligation"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? All attached evidence references will be removed. This action cannot be undone.`}
        confirmLabel="Yes, Delete Obligation"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}

export default ObligationsPage;
