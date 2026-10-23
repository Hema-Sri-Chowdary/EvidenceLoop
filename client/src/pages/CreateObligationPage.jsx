import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ObligationForm from '../components/ObligationForm.jsx';
import { obligationService } from '../services/obligationService.js';
import { useToast } from '../context/ToastContext.jsx';

export function CreateObligationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await obligationService.createObligation(formData);
      toast.success('Obligation created successfully.', 'Obligation Registered');
      const newId = response.data?._id;
      if (newId) {
        navigate(`/obligations/${newId}`);
      } else {
        navigate('/obligations');
      }
    } catch (err) {
      const msg = err.userMessage || 'Failed to create obligation. Please review inputs.';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860, margin: '0 auto' }}>
      <PageHeader
        title="Create Compliance Obligation"
        description="Register a new internal compliance obligation, assign responsibility, establish deadlines, and specify audit evidence requirements."
        actions={
          <button onClick={() => navigate('/obligations')} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to Obligations</span>
          </button>
        }
      />

      {saveError && (
        <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'var(--overdue-bg)', border: '1px solid var(--overdue-border)', color: 'var(--overdue-text)', fontSize: 14.5 }}>
          <strong>Error saving obligation:</strong> {saveError}
        </div>
      )}

      <ObligationForm
        onSubmit={handleSubmit}
        isEdit={false}
        isSaving={isSaving}
      />
    </div>
  );
}

export default CreateObligationPage;
