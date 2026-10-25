import jwt from 'jsonwebtoken';
import { findUserById, findUserByEmail } from '../config/userStore.js';
import { getJwtSecret } from '../config/jwt.js';

/**
 * Authentication Middleware
 * Requires a valid Bearer JWT token with MFA verification.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed authorization token.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token. Please log in again.',
      });
    }

    // Verify MFA claim was completed
    if (!decoded.mfaVerified) {
      return res.status(403).json({
        success: false,
        message: 'MFA verification required to access this resource.',
      });
    }

    // Check that user still exists in active registry (lookup by ID, fallback to email)
    let user = await findUserById(decoded.id);
    if (!user && decoded.email) {
      user = await findUserByEmail(decoded.email);
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account associated with token no longer exists.',
      });
    }

    // Attach authenticated user identity to request
    req.user = {
      id: String(user._id || user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      org: user.org,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Authorization Middleware
 * Usage: requireRole('Auditor') or requireRole('Auditor', 'Viewer')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Your current role ('${req.user.role}') is not authorized to perform this operation. Required role(s): ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
}

export default {
  requireAuth,
  requireRole,
};
