import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  deleteUserById,
  determineRoleByEmail,
  determineOrgByEmail,
  DEFAULT_USERS,
} from '../config/userStore.js';
import {
  createOtpSession,
  verifyOtp,
  resendOtp as serviceResendOtp,
} from '../services/otpService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'evidenceloop_jwt_secret_audit_readiness_key_2026_secure';
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
      role: user.role,
      org: user.org,
      mfaVerified: true,
    },
    JWT_SECRET,
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

    // Enforce role assignment rules dynamically
    const enforcedRole = cleanEmail === 'admin@evidenceloop.com' ? 'Admin' : determineRoleByEmail(cleanEmail);
    user.role = enforcedRole;
    user.org = determineOrgByEmail(cleanEmail, user.org);

    // Step 2: Trigger Real-Time Multi-Factor Authentication via OTP
    const { otpSessionToken, expiresInSeconds, previewOtp } = createOtpSession(user);

    return res.json({
      success: true,
      mfaRequired: true,
      message: `A 6-digit real-time verification code has been dispatched to ${user.email}`,
      otpSessionToken,
      expiresInSeconds,
      previewOtp,
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

    const result = verifyOtp(otpSessionToken, otp);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Ensure role and org are guaranteed up to date
    const properRole = result.user.email === 'admin@evidenceloop.com' ? 'Admin' : determineRoleByEmail(result.user.email);
    result.user.role = properRole;
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

    const result = serviceResendOtp(otpSessionToken);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.message,
      previewOtp: result.previewOtp,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register
 * Automatic role assignment:
 * - hemasrichowdary@gmail.com -> Admin
 * - @vitap emails -> Auditor
 * - Others -> Viewer
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

    const user = await createUser({
      name,
      email: cleanEmail,
      password,
      org: org ? org.trim() : undefined,
    });

    // Start Real-Time MFA verification for newly created user
    const { otpSessionToken, expiresInSeconds, previewOtp } = createOtpSession(user);

    return res.status(201).json({
      success: true,
      mfaRequired: true,
      message: `Account created with role '${user.role}'. A 6-digit verification code has been dispatched to ${user.email}`,
      otpSessionToken,
      expiresInSeconds,
      previewOtp,
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
    const properRole = user.email === 'admin@evidenceloop.com' ? 'Admin' : determineRoleByEmail(user.email);
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

    // Role remains strictly tied to the email rule
    updated.role = updated.email === 'admin@evidenceloop.com' ? 'Admin' : determineRoleByEmail(updated.email);

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
 * Exposes preset demo credentials for convenience in reviewer/evaluation sessions
 */
export function getDemoAccounts(req, res) {
  const accounts = DEFAULT_USERS.map((u) => ({
    name: u.name,
    email: u.email,
    password: u.passwordRaw,
    role: u.role,
    org: u.org,
  }));
  res.json({
    success: true,
    data: accounts,
  });
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
};
