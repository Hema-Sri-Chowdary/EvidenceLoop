import express from 'express';
import {
  login,
  verifyMfa,
  resendOtp,
  register,
  getMe,
  getDemoAccounts,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/verify-mfa', verifyMfa);
router.post('/resend-otp', resendOtp);
router.post('/register', register);
router.get('/demo-accounts', getDemoAccounts);

// Protected routes
router.get('/me', requireAuth, getMe);

export default router;
