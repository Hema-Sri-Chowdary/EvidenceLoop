import express from 'express';
import {
  login,
  verifyMfa,
  resendOtp,
  register,
  getMe,
  updateProfile,
  deleteAccount,
  getDemoAccounts,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public auth endpoints
router.post('/login', login);
router.post('/verify-mfa', verifyMfa);
router.post('/resend-otp', resendOtp);
router.post('/register', register);
router.get('/demo-accounts', getDemoAccounts);

// Protected user profile & account management endpoints
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateProfile);
router.delete('/me', requireAuth, deleteAccount);

export default router;
