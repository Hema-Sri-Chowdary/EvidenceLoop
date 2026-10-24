import express from 'express';
import {
  getObligations,
  getObligationById,
  createObligation,
  updateObligation,
  deleteObligation,
  addEvidence,
  seedObligations,
} from '../controllers/obligationController.js';
import {
  validateObjectId,
  validateObligationInput,
  validateEvidenceInput,
} from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Read operations: accessible to all authenticated users (Admin, Auditor, Viewer)
router.get('/', requireAuth, getObligations);
router.get('/:id', requireAuth, validateObjectId, getObligationById);

// Mutation operations: restricted to Admin and Auditor
router.post('/', requireAuth, requireRole('Admin', 'Auditor'), validateObligationInput, createObligation);
router.patch('/:id', requireAuth, requireRole('Admin', 'Auditor'), validateObjectId, validateObligationInput, updateObligation);
router.post('/:id/evidence', requireAuth, requireRole('Admin', 'Auditor'), validateObjectId, validateEvidenceInput, addEvidence);

// Destructive operations: restricted strictly to Admin
router.delete('/:id', requireAuth, requireRole('Admin'), validateObjectId, deleteObligation);
router.post('/seed', requireAuth, requireRole('Admin'), seedObligations);

export default router;
