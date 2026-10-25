import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  deleteUserById,
  updateUserPassword,
  determineRoleByEmail,
  determineOrgByEmail,
  DEFAULT_USERS,
} from '../config/userStore.js';
import {
  createOtpSession,
  verifyOtp,
  resendOtp as serviceResendOtp,
  createPasswordResetSession,
  verifyPasswordResetOtp,
} from '../services/otpService.js';
import { getJwtSecret } from '../config/jwt.js';

const JWT_EXPIRES_IN = '24h';

/**
 * Helper to generate JWT token with MFA claim, role, and org
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: String(user._id || user.id),
      email: user.email,
      name: user.name,
      role: user.role === 'Auditor' ? 'Auditor' : 'Viewer',
      org: user.org,
      mfaVerified: true,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/auth/login
 * Step 1: Validate email & password, dispatch Real-Time MFA OTP
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Role assignment strictly derived server-side
    const enforcedRole = determineRoleByEmail(cleanEmail);
    user.role = enforcedRole;
    user.org = determineOrgByEmail(cleanEmail, user.org);

    // Step 2: Trigger Real-Time Multi-Factor Authentication via OTP (awaited & error handled)
    let otpData;
    try {
      otpData = await createOtpSession(user);
    } catch (deliveryErr) {
      return res.status(503).json({
        success: false,
        message: `MFA code dispatch failed: ${deliveryErr.message}. Please verify email delivery service.`,
      });
    }

    const { otpSessionToken, expiresInSeconds } = otpData;

    return res.json({
      success: true,
      mfaRequired: true,
      message: `A 6-digit real-time verification code has been dispatched to ${user.email}`,
      otpSessionToken,
      expiresInSeconds,
      user: {
        id: String(user._id || user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        org: user.org,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-mfa
 * Step 2: Verify OTP and issue JWT access token
 */
export async function verifyMfa(req, res, next) {
  try {
    const { otpSessionToken, otp } = req.body;

    if (!otpSessionToken || !otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP session token and 6-digit verification code are required',
      });
    }

    const result = await verifyOtp(otpSessionToken, otp);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Ensure role and org are guaranteed up to date (Auditor or Viewer)
    result.user.role = determineRoleByEmail(result.user.email);
    result.user.org = determineOrgByEmail(result.user.email, result.user.org);

    // Issue JWT token
    const token = generateToken(result.user);

    return res.json({
      success: true,
      message: 'MFA verified successfully. Welcome to EvidenceLoop.',
      token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/resend-otp
 */
export async function resendOtp(req, res, next) {
  try {
    const { otpSessionToken } = req.body;
    if (!otpSessionToken) {
      return res.status(400).json({
        success: false,
        message: 'OTP session token is required',
      });
    }

    let result;
    try {
      result = await serviceResendOtp(otpSessionToken);
    } catch (deliveryErr) {
      return res.status(503).json({
        success: false,
        message: `MFA code redelivery failed: ${deliveryErr.message}.`,
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register
 * Server-Enforced Role Assignment:
 * - @vit and @vcomply domains -> Auditor
 * - All others -> Viewer
 * Request body 'role' parameter is strictly ignored.
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, org } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // Role sent by browser is ignored; strictly evaluated on server
    const user = await createUser({
      name,
      email: cleanEmail,
      password,
      org: org ? org.trim() : undefined,
    });

    // Start Real-Time MFA verification for newly created user
    let otpData;
    try {
      otpData = await createOtpSession(user);
    } catch (deliveryErr) {
      return res.status(503).json({
        success: false,
        message: `Registration succeeded, but verification code delivery failed: ${deliveryErr.message}`,
      });
    }

    const { otpSessionToken, expiresInSeconds } = otpData;

    return res.status(201).json({
      success: true,
      mfaRequired: true,
      message: `Account created with role '${user.role}'. A 6-digit verification code has been dispatched to ${user.email}`,
      otpSessionToken,
      expiresInSeconds,
      user: {
        id: String(user._id || user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        org: user.org,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const properRole = determineRoleByEmail(user.email);
    const properOrg = determineOrgByEmail(user.email, user.org);

    return res.json({
      success: true,
      user: {
        id: String(user._id || user.id),
        email: user.email,
        name: user.name,
        role: properRole,
        org: properOrg,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/me
 * Update user profile (Name and Organization)
 */
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, org } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    const updated = await updateUserProfile(userId, { name, org });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role remains strictly tied to the email rule (Auditor / Viewer)
    updated.role = determineRoleByEmail(updated.email);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/auth/me
 * Permanently delete authenticated user's account
 */
export async function deleteAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const deleted = await deleteUserById(userId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Account could not be found' });
    }

    return res.json({
      success: true,
      message: 'Your account has been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/demo-accounts
 */
export function getDemoAccounts(req, res) {
  const accounts = DEFAULT_USERS.map((u) => ({
    name: u.name,
    email: u.email,
    password: u.passwordRaw,
    role: u.role === 'Auditor' ? 'Auditor' : 'Viewer',
    org: u.org,
  }));
  res.json({
    success: true,
    data: accounts,
  });
}

/**
 * POST /api/auth/forgot-password
 * Generic response prevents email enumeration attacks
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);

    // Generic response if account doesn't exist (prevents account enumeration)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account is associated with this email, a verification code has been dispatched.',
      });
    }

    let resetData;
    try {
      resetData = await createPasswordResetSession(user);
    } catch (deliveryErr) {
      return res.status(503).json({
        success: false,
        message: `Password reset delivery failed: ${deliveryErr.message}.`,
      });
    }

    const { resetSessionToken, expiresInSeconds } = resetData;

    return res.json({
      success: true,
      message: 'If an account is associated with this email, a verification code has been dispatched.',
      resetSessionToken,
      expiresInSeconds,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 * Step 2: Verify reset OTP and update password
 */
export async function resetPassword(req, res, next) {
  try {
    const { resetSessionToken, otp, newPassword } = req.body;

    if (!resetSessionToken || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Reset session token and 6-digit code are required',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const result = await verifyPasswordResetOtp(resetSessionToken, otp);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updated = await updateUserPassword(result.email, hashedPassword);
    if (!updated) {
      return res.status(500).json({
        success: false,
        message: 'Unable to update password. Please try again.',
      });
    }

    return res.json({
      success: true,
      message: 'Password successfully reset! You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

export default {
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
};
