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
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, otpVerifyLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public auth endpoints with rate limiting protection
router.post('/login', loginLimiter, login);
router.post('/verify-mfa', otpVerifyLimiter, verifyMfa);
router.post('/resend-otp', otpVerifyLimiter, resendOtp);
router.post('/register', loginLimiter, register);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/demo-accounts', getDemoAccounts);

// Protected user profile & account management endpoints
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateProfile);
router.delete('/me', requireAuth, deleteAccount);

export default router;
