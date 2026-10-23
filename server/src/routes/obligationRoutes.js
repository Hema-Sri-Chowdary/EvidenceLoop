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

const router = express.Router();

router.get('/', getObligations);
router.post('/', validateObligationInput, createObligation);
router.post('/seed', seedObligations);

router.get('/:id', validateObjectId, getObligationById);
router.patch('/:id', validateObjectId, validateObligationInput, updateObligation);
router.delete('/:id', validateObjectId, deleteObligation);

router.post('/:id/evidence', validateObjectId, validateEvidenceInput, addEvidence);

export default router;
