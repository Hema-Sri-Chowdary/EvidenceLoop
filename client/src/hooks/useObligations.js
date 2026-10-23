import { useState, useEffect, useCallback } from 'react';
import { obligationService } from '../services/obligationService.js';
import { useToast } from '../context/ToastContext.jsx';
import { exportObligationsToCsv } from '../utils/csvExport.js';

export function useObligations(initialParams = {}) {
  const [obligations, setObligations] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const toast = useToast();

  const fetchObligations = useCallback(async (customParams = params) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await obligationService.getObligations(customParams);
      setObligations(response.data || []);
      setTotal(response.total !== undefined ? response.total : (response.data || []).length);
    } catch (err) {
      setError(err.userMessage || 'Failed to fetch obligations.');
      toast.error(err.userMessage || 'Failed to load obligations.');
    } finally {
      setIsLoading(false);
    }
  }, [params, toast]);

  useEffect(() => {
    fetchObligations(params);
  }, [params, fetchObligations]);

  const updateParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setParams({
      search: '',
      status: 'All',
      priority: 'All',
      evidenceStatus: 'All',
      sortBy: 'dueDate',
      order: 'asc',
    });
  }, []);

  const deleteObligation = async (id) => {
    try {
      await obligationService.deleteObligation(id);
      toast.success('Obligation removed successfully.');
      await fetchObligations();
      return true;
    } catch (err) {
      toast.error(err.userMessage || 'Failed to delete obligation.');
      throw err;
    }
  };

  const handleExportCsv = () => {
    try {
      if (obligations.length === 0) {
        toast.warning('No obligations match the current filters to export.');
        return;
      }
      exportObligationsToCsv(obligations, `evidenceloop-obligations-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${obligations.length} records to CSV.`);
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV.');
    }
  };

  return {
    obligations,
    total,
    isLoading,
    error,
    params,
    updateParam,
    resetFilters,
    refetch: fetchObligations,
    deleteObligation,
    handleExportCsv,
  };
}

export default useObligations;
