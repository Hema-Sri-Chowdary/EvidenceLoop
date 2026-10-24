import apiClient from './api.js';
import { INITIAL_DEMO_OBLIGATIONS } from './demoData.js';
import { calculateReadiness, calculateDashboardSummary } from '../utils/readinessEngine.js';

const STORAGE_KEY = 'evidenceloop_local_records';
const DEMO_MODE_KEY = 'evidenceloop_demo_mode';

// Ensure legacy demo mode flags do not fork frontend data from backend
try {
  localStorage.removeItem(DEMO_MODE_KEY);
} catch {
  // ignore in non-browser or restricted contexts
}

// Helper to check if offline/demo storage is enabled
export function isDemoModeActive() {
  return false;
}

export function setDemoModeActive(active) {
  if (!active) {
    try {
      localStorage.removeItem(DEMO_MODE_KEY);
    } catch {
      // ignore
    }
  }
}

// Local storage storage helpers for standalone/preview resilience
function getLocalRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_OBLIGATIONS));
    return [...INITIAL_DEMO_OBLIGATIONS];
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [...INITIAL_DEMO_OBLIGATIONS];
  }
}

function saveLocalRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Could not save local cache:', err);
  }
}

export const obligationService = {
  /**
   * Health check
   */
  async checkHealth() {
    try {
      const res = await apiClient.get('/health', { timeout: 3000 });
      return { online: true, data: res.data };
    } catch (err) {
      return { online: false, error: err.userMessage || 'Backend unreachable' };
    }
  },

  /**
   * Get all obligations with search, filtering, and sorting
   */
  async getObligations(params = {}) {
    try {
      const response = await apiClient.get('/obligations', { params });
      if (response.data && Array.isArray(response.data.data)) {
        saveLocalRecords(response.data.data);
      }
      return response.data;
    } catch (err) {
      // If server unreachable, fall back to cached local records with transparent notice
      if (err.request && !err.response) {
        console.warn('Backend API unreachable. Serving cached records from local storage.');
        return this._getLocalObligations(params, true);
      }
      throw err;
    }
  },

  /**
   * Get single obligation by ID
   */
  async getObligationById(id) {
    try {
      const response = await apiClient.get(`/obligations/${id}`);
      return response.data;
    } catch (err) {
      if (err.request && !err.response) {
        return this._getLocalObligationById(id);
      }
      throw err;
    }
  },

  /**
   * Create new obligation
   */
  async createObligation(data) {
    try {
      const response = await apiClient.post('/obligations', data);
      if (response.data && response.data.data) {
        const local = getLocalRecords();
        saveLocalRecords([response.data.data, ...local.filter((r) => r._id !== response.data.data._id)]);
      }
      return response.data;
    } catch (err) {
      if (err.request && !err.response) {
        return this._createLocalObligation(data);
      }
      throw err;
    }
  },

  /**
   * Update obligation
   */
  async updateObligation(id, data) {
    try {
      const response = await apiClient.patch(`/obligations/${id}`, data);
      if (response.data && response.data.data) {
        const local = getLocalRecords();
        const idx = local.findIndex((r) => r._id === id);
        if (idx !== -1) {
          local[idx] = response.data.data;
          saveLocalRecords(local);
        }
      }
      return response.data;
    } catch (err) {
      if (err.request && !err.response) {
        return this._updateLocalObligation(id, data);
      }
      throw err;
    }
  },

  /**
   * Delete obligation
   */
  async deleteObligation(id) {
    try {
      const response = await apiClient.delete(`/obligations/${id}`);
      const local = getLocalRecords();
      saveLocalRecords(local.filter((r) => r._id !== id));
      return response.data;
    } catch (err) {
      if (err.request && !err.response) {
        return this._deleteLocalObligation(id);
      }
      throw err;
    }
  },

  /**
   * Add evidence link to obligation
   */
  async addEvidence(id, evidenceData) {
    try {
      const response = await apiClient.post(`/obligations/${id}/evidence`, evidenceData);
      if (response.data && response.data.data) {
        const local = getLocalRecords();
        const idx = local.findIndex((r) => r._id === id);
        if (idx !== -1) {
          local[idx] = response.data.data;
          saveLocalRecords(local);
        }
      }
      return response.data;
    } catch (err) {
      if (err.request && !err.response) {
        return this._addLocalEvidence(id, evidenceData);
      }
      throw err;
    }
  },

  /**
   * Get dashboard summary
   */
  async getDashboardSummary() {
    try {
      const response = await apiClient.get('/dashboard/summary');
      return response.data;
    } catch (err) {
      if (err.request && !err.response) {
        return this._getLocalDashboardSummary();
      }
      throw err;
    }
  },

  /**
   * Reset compliance dataset using backend seed endpoint or offline fallback
   */
  async resetDemoData() {
    try {
      const response = await apiClient.post('/obligations/seed');
      if (response.data && Array.isArray(response.data.data)) {
        saveLocalRecords(response.data.data);
      } else {
        const fresh = await apiClient.get('/obligations');
        if (fresh.data && Array.isArray(fresh.data.data)) {
          saveLocalRecords(fresh.data.data);
        }
      }
      return response.data;
    } catch (err) {
      if (err.request && !err.response) {
        saveLocalRecords(INITIAL_DEMO_OBLIGATIONS);
        return {
          success: true,
          message: 'Offline demo obligations restored',
          count: INITIAL_DEMO_OBLIGATIONS.length,
          data: INITIAL_DEMO_OBLIGATIONS,
        };
      }
      throw err;
    }
  },

  // ----------------------------------------------------
  // Internal fallback/offline implementation
  // ----------------------------------------------------
  _getLocalObligations(params = {}, isOfflineFallback = false) {
    let records = getLocalRecords();

    // Enrich with calculated readiness
    records = records.map((item) => ({
      ...item,
      readiness: calculateReadiness(item),
    }));

    // Search filter (title, owner, category)
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      records = records.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.owner.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (params.status && params.status !== 'All') {
      records = records.filter((o) => o.status === params.status);
    }

    // Priority filter
    if (params.priority && params.priority !== 'All') {
      records = records.filter((o) => o.priority === params.priority);
    }

    // Evidence status filter
    if (params.evidenceStatus && params.evidenceStatus !== 'All') {
      records = records.filter((o) => {
        if (params.evidenceStatus === 'Missing Evidence') {
          return o.readiness.missingEvidence;
        }
        if (params.evidenceStatus === 'Evidence Attached') {
          return Array.isArray(o.evidence) && o.evidence.length > 0;
        }
        if (params.evidenceStatus === 'Not Required') {
          return !o.evidenceRequired;
        }
        if (params.evidenceStatus === 'Ready for Review') {
          return o.readiness.readyForReview;
        }
        return true;
      });
    }

    // Sorting
    const sortBy = params.sortBy || 'dueDate';
    const order = params.order === 'desc' ? -1 : 1;

    records.sort((a, b) => {
      if (sortBy === 'dueDate') {
        const timeA = new Date(a.dueDate).getTime() || 0;
        const timeB = new Date(b.dueDate).getTime() || 0;
        return (timeA - timeB) * order;
      }
      if (sortBy === 'priority') {
        const priorityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return ((priorityRank[a.priority] || 0) - (priorityRank[b.priority] || 0)) * order;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title) * order;
      }
      return 0;
    });

    return {
      success: true,
      data: records,
      total: records.length,
      isOfflineFallback,
    };
  },

  _getLocalObligationById(id) {
    const records = getLocalRecords();
    const found = records.find((r) => r._id === id);
    if (!found) {
      const err = new Error(`Obligation not found with ID ${id}`);
      err.response = { status: 404, data: { message: `Obligation not found with ID ${id}` } };
      throw err;
    }
    return {
      success: true,
      data: {
        ...found,
        readiness: calculateReadiness(found),
      },
    };
  },

  _createLocalObligation(data) {
    const records = getLocalRecords();
    const newRecord = {
      _id: 'obl_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      ...data,
      evidence: Array.isArray(data.evidence) ? data.evidence : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    saveLocalRecords(records);
    return {
      success: true,
      data: {
        ...newRecord,
        readiness: calculateReadiness(newRecord),
      },
      message: 'Obligation created successfully.',
    };
  },

  _updateLocalObligation(id, data) {
    const records = getLocalRecords();
    const index = records.findIndex((r) => r._id === id);
    if (index === -1) {
      const err = new Error(`Obligation not found with ID ${id}`);
      err.response = { status: 404, data: { message: `Obligation not found with ID ${id}` } };
      throw err;
    }
    const updated = {
      ...records[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    records[index] = updated;
    saveLocalRecords(records);
    return {
      success: true,
      data: {
        ...updated,
        readiness: calculateReadiness(updated),
      },
      message: 'Obligation updated successfully.',
    };
  },

  _deleteLocalObligation(id) {
    const records = getLocalRecords();
    const filtered = records.filter((r) => r._id !== id);
    if (filtered.length === records.length) {
      const err = new Error(`Obligation not found with ID ${id}`);
      err.response = { status: 404, data: { message: `Obligation not found with ID ${id}` } };
      throw err;
    }
    saveLocalRecords(filtered);
    return {
      success: true,
      message: 'Obligation deleted successfully.',
    };
  },

  _addLocalEvidence(id, evidenceData) {
    const records = getLocalRecords();
    const index = records.findIndex((r) => r._id === id);
    if (index === -1) {
      const err = new Error(`Obligation not found with ID ${id}`);
      err.response = { status: 404, data: { message: `Obligation not found with ID ${id}` } };
      throw err;
    }
    const evidenceItem = {
      _id: 'ev_' + Date.now().toString(36),
      label: evidenceData.label.trim(),
      url: evidenceData.url.trim(),
      addedAt: new Date().toISOString(),
    };
    const evidenceList = Array.isArray(records[index].evidence) ? [...records[index].evidence] : [];
    evidenceList.push(evidenceItem);

    records[index] = {
      ...records[index],
      evidence: evidenceList,
      updatedAt: new Date().toISOString(),
    };
    saveLocalRecords(records);

    return {
      success: true,
      data: {
        ...records[index],
        readiness: calculateReadiness(records[index]),
      },
      message: 'Evidence attached successfully.',
    };
  },

  _getLocalDashboardSummary() {
    const records = getLocalRecords();
    const summary = calculateDashboardSummary(records);
    return {
      success: true,
      data: summary,
    };
  },
};
