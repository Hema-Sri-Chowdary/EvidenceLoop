import Obligation from '../models/Obligation.js';
import { isDbConnected, loadFallbackData, saveFallbackData } from '../config/db.js';
import { enrichObligation, calculateReadiness } from '../services/readinessService.js';
import { generateSeedObligations } from '../utils/seedData.js';

// Predictable file-backed fallback store when MongoDB is unavailable
function initFallbackStore() {
  const loaded = loadFallbackData();
  if (loaded && Array.isArray(loaded) && loaded.length > 0) {
    return loaded;
  }
  const defaultSeeds = generateSeedObligations().map((item, idx) => ({
    _id: `obl_${idx + 1}`,
    ...item,
    org: 'General Organization',
    evidence: Array.isArray(item.evidence)
      ? item.evidence.map((ev, eIdx) => ({
          _id: `ev_${idx + 1}_${eIdx + 1}`,
          ...ev,
        }))
      : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  saveFallbackData(defaultSeeds);
  return defaultSeeds;
}

let fallbackStore = initFallbackStore();

function persistFallbackStore(records) {
  fallbackStore = records;
  const saved = saveFallbackData(records);
  if (!saved) {
    console.warn('[ObligationStore Warning] Storage file persistence failed. Maintained in memory store.');
  }
}

/**
 * Check if a record is accessible to the user's trusted organization
 */
function isOrgAccessible(recordOrg, userOrg) {
  if (!recordOrg || recordOrg === 'General Organization') return true;
  return recordOrg === userOrg;
}

/**
 * GET /api/obligations
 * Scoped to authenticated user's trusted organization identifier
 */
export async function getObligations(req, res, next) {
  try {
    const { search, status, priority, evidenceStatus, sortBy = 'dueDate', order = 'asc' } = req.query;
    const userOrg = req.user?.org || 'General Organization';

    if (isDbConnected()) {
      // Organization filter
      const orgFilter = {
        $or: [
          { org: userOrg },
          { org: 'General Organization' },
          { org: { $exists: false } },
        ],
      };

      const conditions = [orgFilter];

      if (search) {
        const safeRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        conditions.push({
          $or: [{ title: safeRegex }, { owner: safeRegex }, { category: safeRegex }],
        });
      }

      if (status && status !== 'All') {
        conditions.push({ status });
      }

      if (priority && priority !== 'All') {
        conditions.push({ priority });
      }

      const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

      const sortDirection = order === 'desc' ? -1 : 1;
      let sortConfig = { [sortBy]: sortDirection };
      if (sortBy === 'priority') {
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
        tenantScope: {
          enforced: true,
          organization: userOrg,
          role: req.user?.role,
        },
      });
    }

    // Persistent file-backed fallback with organization scoping
    let records = [...fallbackStore]
      .filter((o) => isOrgAccessible(o.org, userOrg))
      .map((item) => enrichObligation(item));

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
      tenantScope: {
        enforced: true,
        organization: userOrg,
        role: req.user?.role,
      },
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
    const userOrg = req.user?.org || 'General Organization';

    if (isDbConnected()) {
      const doc = await Obligation.findById(id).lean();
      if (!doc) {
        return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
      }

      // Enforce organization data isolation
      if (!isOrgAccessible(doc.org, userOrg)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Obligation belongs to organization '${doc.org}'. You are authenticated with '${userOrg}'.`,
        });
      }

      return res.json({ success: true, data: enrichObligation(doc) });
    }

    const item = fallbackStore.find((o) => String(o._id) === String(id));
    if (!item) {
      return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
    }

    if (!isOrgAccessible(item.org, userOrg)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Obligation belongs to organization '${item.org}'. You are authenticated with '${userOrg}'.`,
      });
    }

    return res.json({ success: true, data: enrichObligation(item) });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/obligations
 * Automatically tagged with authenticated user's trusted organization
 */
export async function createObligation(req, res, next) {
  try {
    const { title, description, category, owner, dueDate, priority, status, evidenceRequired, evidence } = req.body;
    const userOrg = req.user?.org || 'General Organization';

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
        org: userOrg,
      });
      await doc.save();
      return res.status(201).json({
        success: true,
        message: 'Obligation created successfully',
        data: enrichObligation(doc),
      });
    }

    const newRecord = {
      _id: `obl_${Date.now()}`,
      title,
      description: description || '',
      category,
      owner,
      dueDate,
      priority: priority || 'Medium',
      status: status || 'Open',
      evidenceRequired: evidenceRequired !== undefined ? evidenceRequired : true,
      evidence: Array.isArray(evidence) ? evidence : [],
      org: userOrg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fallbackStore.unshift(newRecord);
    persistFallbackStore(fallbackStore);

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
    const userOrg = req.user?.org || 'General Organization';

    if (isDbConnected()) {
      const existing = await Obligation.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
      }

      if (!isOrgAccessible(existing.org, userOrg)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You are not authorized to modify obligations belonging to '${existing.org}'.`,
        });
      }

      // Do not allow arbitrary reassignment of organization
      delete updates.org;

      Object.assign(existing, updates);
      await existing.save();

      return res.json({
        success: true,
        message: 'Obligation updated successfully',
        data: enrichObligation(existing),
      });
    }

    const idx = fallbackStore.findIndex((o) => String(o._id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
    }

    if (!isOrgAccessible(fallbackStore[idx].org, userOrg)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You are not authorized to modify obligations belonging to '${fallbackStore[idx].org}'.`,
      });
    }

    delete updates.org;
    fallbackStore[idx] = {
      ...fallbackStore[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    persistFallbackStore(fallbackStore);

    return res.json({
      success: true,
      message: 'Obligation updated successfully',
      data: enrichObligation(fallbackStore[idx]),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/obligations/:id
 * Delete operation granted to Auditor role
 */
export async function deleteObligation(req, res, next) {
  try {
    const { id } = req.params;
    const userOrg = req.user?.org || 'General Organization';

    if (isDbConnected()) {
      const existing = await Obligation.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
      }

      if (!isOrgAccessible(existing.org, userOrg)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You are not authorized to delete obligations belonging to '${existing.org}'.`,
        });
      }

      await Obligation.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Obligation deleted successfully' });
    }

    const existing = fallbackStore.find((o) => String(o._id) === String(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
    }

    if (!isOrgAccessible(existing.org, userOrg)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You are not authorized to delete obligations belonging to '${existing.org}'.`,
      });
    }

    const remaining = fallbackStore.filter((o) => String(o._id) !== String(id));
    persistFallbackStore(remaining);

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
    const userOrg = req.user?.org || 'General Organization';

    if (isDbConnected()) {
      const doc = await Obligation.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
      }

      if (!isOrgAccessible(doc.org, userOrg)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You are not authorized to attach evidence to records belonging to '${doc.org}'.`,
        });
      }

      doc.evidence.push({ label: label.trim(), url: url.trim(), addedAt: new Date() });
      await doc.save();

      return res.status(201).json({
        success: true,
        message: 'Evidence attached successfully',
        data: enrichObligation(doc),
      });
    }

    const idx = fallbackStore.findIndex((o) => String(o._id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: `Obligation not found with ID ${id}` });
    }

    if (!isOrgAccessible(fallbackStore[idx].org, userOrg)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You are not authorized to attach evidence to records belonging to '${fallbackStore[idx].org}'.`,
      });
    }

    const ev = {
      _id: `ev_${Date.now()}`,
      label: label.trim(),
      url: url.trim(),
      addedAt: new Date().toISOString(),
    };
    if (!Array.isArray(fallbackStore[idx].evidence)) {
      fallbackStore[idx].evidence = [];
    }
    fallbackStore[idx].evidence.push(ev);
    fallbackStore[idx].updatedAt = new Date().toISOString();
    persistFallbackStore(fallbackStore);

    return res.status(201).json({
      success: true,
      message: 'Evidence attached successfully',
      data: enrichObligation(fallbackStore[idx]),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/obligations/seed
 * Seed compliance baseline templates
 */
export async function seedObligations(req, res, next) {
  try {
    const seedRecords = generateSeedObligations();
    const userOrg = req.user?.org || 'General Organization';

    const recordsWithOrg = seedRecords.map((item) => ({
      ...item,
      org: userOrg,
    }));

    if (isDbConnected()) {
      await Obligation.deleteMany({ org: userOrg });
      const created = await Obligation.insertMany(recordsWithOrg);
      const enriched = created.map((doc) => enrichObligation(doc));
      return res.json({
        success: true,
        message: `Successfully seeded ${created.length} compliance obligations for ${userOrg}`,
        count: created.length,
        data: enriched,
      });
    }

    const newSeeds = seedRecords.map((item, idx) => ({
      _id: `obl_${idx + 1}`,
      ...item,
      org: userOrg,
      evidence: Array.isArray(item.evidence)
        ? item.evidence.map((ev, eIdx) => ({
            _id: `ev_${idx + 1}_${eIdx + 1}`,
            ...ev,
          }))
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    persistFallbackStore(newSeeds);
    const enriched = newSeeds.map((item) => enrichObligation(item));

    return res.json({
      success: true,
      message: `Successfully seeded ${fallbackStore.length} compliance obligations in workspace`,
      count: fallbackStore.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getObligations,
  getObligationById,
  createObligation,
  updateObligation,
  deleteObligation,
  addEvidence,
  seedObligations,
};
