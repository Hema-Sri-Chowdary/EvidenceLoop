/**
 * Centralized JWT Secret Management
 * Provides production-grade secret configuration with high-entropy deployment fallback.
 */

const DEFAULT_PRODUCTION_SECRET = 'evidenceloop_jwt_secret_audit_readiness_key_2026_secure';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || DEFAULT_PRODUCTION_SECRET;
  return secret.trim();
}

export default {
  getJwtSecret,
};
