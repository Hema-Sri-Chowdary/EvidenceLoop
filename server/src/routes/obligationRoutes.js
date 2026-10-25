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

// Read operations: accessible to all authenticated users (Auditor, Viewer)
router.get('/', requireAuth, getObligations);
router.get('/:id', requireAuth, validateObjectId, getObligationById);

// Mutation operations: restricted strictly to Auditor role (Viewer has read-only access)
router.post('/', requireAuth, requireRole('Auditor'), validateObligationInput, createObligation);
router.patch('/:id', requireAuth, requireRole('Auditor'), validateObjectId, validateObligationInput, updateObligation);
router.post('/:id/evidence', requireAuth, requireRole('Auditor'), validateObjectId, validateEvidenceInput, addEvidence);

// Destructive operations: delete privilege granted to Auditor
router.delete('/:id', requireAuth, requireRole('Auditor'), validateObjectId, deleteObligation);
router.post('/seed', requireAuth, requireRole('Auditor'), seedObligations);

export default router;
