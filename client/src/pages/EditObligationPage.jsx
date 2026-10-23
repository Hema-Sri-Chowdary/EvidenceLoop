import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ObligationForm from '../components/ObligationForm.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { obligationService } from '../services/obligationService.js';
import { useToast } from '../context/ToastContext.jsx';

export function EditObligationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [obligation, setObligation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchObligation = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await obligationService.getObligationById(id);
        if (isMounted) {
          setObligation(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage || 'Obligation not found or failed to load.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchObligation();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await obligationService.updateObligation(id, formData);
      toast.success('Obligation updated successfully.', 'Changes Saved');
      navigate(`/obligations/${id}`);
    } catch (err) {
      const msg = err.userMessage || 'Failed to update obligation.';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading obligation details..." />;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860, margin: '0 auto' }}>
      <PageHeader
        title="Edit Obligation"
        description={`Modifying obligation record: ${obligation.title}`}
        actions={
          <button onClick={() => navigate(`/obligations/${id}`)} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Cancel & Back</span>
          </button>
        }
      />

      {saveError && (
        <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'var(--overdue-bg)', border: '1px solid var(--overdue-border)', color: 'var(--overdue-text)', fontSize: 14.5 }}>
          <strong>Error updating obligation:</strong> {saveError}
        </div>
      )}

      <ObligationForm
        initialData={obligation}
        onSubmit={handleSubmit}
        isEdit={true}
        isSaving={isSaving}
      />
    </div>
  );
}

export default EditObligationPage;
