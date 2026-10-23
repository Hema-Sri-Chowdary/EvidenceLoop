import Obligation from '../models/Obligation.js';
import { isDbConnected } from '../config/db.js';
import { enrichObligation, calculateReadiness } from '../services/readinessService.js';
import { generateSeedObligations } from '../utils/seedData.js';

// Fallback in-memory store if running without active MongoDB daemon
let memoryStore = generateSeedObligations().map((item, idx) => ({
  _id: `mem_obl_${idx + 1}`,
  ...item,
  evidence: Array.isArray(item.evidence) ? item.evidence.map((ev, eIdx) => ({
    _id: `mem_ev_${idx + 1}_${eIdx + 1}`,
    ...ev,
  })) : [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * GET /api/obligations
 */
export async function getObligations(req, res, next) {
  try {
    const { search, status, priority, evidenceStatus, sortBy = 'dueDate', order = 'asc' } = req.query;

    if (isDbConnected()) {
      // Build safe query filter
      const query = {};

      if (search) {
        const safeRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ title: safeRegex }, { owner: safeRegex }, { category: safeRegex }];
      }

      if (status && status !== 'All') {
        query.status = status;
      }

      if (priority && priority !== 'All') {
        query.priority = priority;
      }

      // Sort direction
      const sortDirection = order === 'desc' ? -1 : 1;
      let sortConfig = { [sortBy]: sortDirection };
      if (sortBy === 'priority') {
        // Priority custom sorting requires post-processing or aggregate
        sortConfig = { createdAt: -1 };
      }

      const docs = await Obligation.find(query).sort(sortConfig).lean();
      let enriched = docs.map((doc) => enrichObligation(doc));

      // Post-filter by calculated readiness state
      if (evidenceStatus && evidenceStatus !== 'All') {
        enriched = enriched.filter((o) => {
          if (evidenceStatus === 'Missing Evidence') return o.readiness.missingEvidence;
          if (evidenceStatus === 'Evidence Attached') return o.evidence && o.evidence.length > 0;
          if (evidenceStatus === 'Ready for Review') return o.readiness.readyForReview;
          if (evidenceStatus === 'Not Required') return !o.evidenceRequired;
          return true;
        });
      }

      if (sortBy === 'priority') {
        const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        enriched.sort((a, b) => ((rank[a.priority] || 0) - (rank[b.priority] || 0)) * sortDirection);
      }

      return res.json({
        success: true,
        data: enriched,
        total: enriched.length,
      });
    }

    // In-memory fallback
    let records = [...memoryStore].map((item) => enrichObligation(item));

    if (search) {
      const q = search.toLowerCase().trim();
      records = records.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.owner.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All') {
      records = records.filter((o) => o.status === status);
    }

    if (priority && priority !== 'All') {
      records = records.filter((o) => o.priority === priority);
    }

    if (evidenceStatus && evidenceStatus !== 'All') {
      records = records.filter((o) => {
        if (evidenceStatus === 'Missing Evidence') return o.readiness.missingEvidence;
        if (evidenceStatus === 'Evidence Attached') return o.evidence && o.evidence.length > 0;
        if (evidenceStatus === 'Ready for Review') return o.readiness.readyForReview;
        if (evidenceStatus === 'Not Required') return !o.evidenceRequired;
        return true;
      });
    }

    const sortDirection = order === 'desc' ? -1 : 1;
    records.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * sortDirection;
      }
      if (sortBy === 'priority') {
        const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return ((rank[a.priority] || 0) - (rank[b.priority] || 0)) * sortDirection;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title) * sortDirection;
      }
      return 0;
    });

    return res.json({
      success: true,
      data: records,
      total: records.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/obligations/:id
 */
export async function getObligationById(req, res, next) {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const doc = await Obligation.findById(id).lean();
      if (!doc) {
        return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
      }
      return res.json({ success: true, data: enrichObligation(doc) });
    }

    const item = memoryStore.find((o) => String(o._id) === String(id));
    if (!item) {
      return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
    }
    return res.json({ success: true, data: enrichObligation(item) });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/obligations
 */
export async function createObligation(req, res, next) {
  try {
    const { title, description, category, owner, dueDate, priority, status, evidenceRequired, evidence } = req.body;

    if (isDbConnected()) {
      const doc = new Obligation({
        title,
        description,
        category,
        owner,
        dueDate,
        priority: priority || 'Medium',
        status: status || 'Open',
        evidenceRequired: evidenceRequired !== undefined ? evidenceRequired : true,
        evidence: Array.isArray(evidence) ? evidence : [],
      });
      await doc.save();
      return res.status(201).json({
        success: true,
        message: 'Obligation created successfully',
        data: enrichObligation(doc),
      });
    }

    const newRecord = {
      _id: `mem_obl_${Date.now()}`,
      title,
      description: description || '',
      category,
      owner,
      dueDate,
      priority: priority || 'Medium',
      status: status || 'Open',
      evidenceRequired: evidenceRequired !== undefined ? evidenceRequired : true,
      evidence: Array.isArray(evidence) ? evidence : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.unshift(newRecord);

    return res.status(201).json({
      success: true,
      message: 'Obligation created successfully',
      data: enrichObligation(newRecord),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/obligations/:id
 */
export async function updateObligation(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbConnected()) {
      const doc = await Obligation.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).lean();

      if (!doc) {
        return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
      }
      return res.json({
        success: true,
        message: 'Obligation updated successfully',
        data: enrichObligation(doc),
      });
    }

    const idx = memoryStore.findIndex((o) => String(o._id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
    }

    memoryStore[idx] = {
      ...memoryStore[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      message: 'Obligation updated successfully',
      data: enrichObligation(memoryStore[idx]),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/obligations/:id
 */
export async function deleteObligation(req, res, next) {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const doc = await Obligation.findByIdAndDelete(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
      }
      return res.json({ success: true, message: 'Obligation deleted successfully' });
    }

    const initialLen = memoryStore.length;
    memoryStore = memoryStore.filter((o) => String(o._id) !== String(id));
    if (memoryStore.length === initialLen) {
      return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
    }

    return res.json({ success: true, message: 'Obligation deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/obligations/:id/evidence
 */
export async function addEvidence(req, res, next) {
  try {
    const { id } = req.params;
    const { label, url } = req.body;

    if (isDbConnected()) {
      const doc = await Obligation.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
      }

      doc.evidence.push({ label: label.trim(), url: url.trim(), addedAt: new Date() });
      await doc.save();

      return res.status(201).json({
        success: true,
        message: 'Evidence attached successfully',
        data: enrichObligation(doc),
      });
    }

    const idx = memoryStore.findIndex((o) => String(o._id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
    }

    const ev = {
      _id: `mem_ev_${Date.now()}`,
      label: label.trim(),
      url: url.trim(),
      addedAt: new Date().toISOString(),
    };
    memoryStore[idx].evidence.push(ev);
    memoryStore[idx].updatedAt = new Date().toISOString();

    return res.status(201).json({
      success: true,
      message: 'Evidence attached successfully',
      data: enrichObligation(memoryStore[idx]),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/seed
 * Seeds or resets fictional compliance records without duplicate accumulation.
 */
export async function seedObligations(req, res, next) {
  try {
    const seedRecords = generateSeedObligations();

    if (isDbConnected()) {
      await Obligation.deleteMany({});
      const created = await Obligation.insertMany(seedRecords);
      return res.json({
        success: true,
        message: `Successfully seeded ${created.length} compliance obligations`,
        count: created.length,
      });
    }

    memoryStore = seedRecords.map((item, idx) => ({
      _id: `mem_obl_${idx + 1}`,
      ...item,
      evidence: Array.isArray(item.evidence) ? item.evidence : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return res.json({
      success: true,
      message: `Successfully seeded ${memoryStore.length} compliance obligations in workspace`,
      count: memoryStore.length,
    });
  } catch (error) {
    next(error);
  }
}
