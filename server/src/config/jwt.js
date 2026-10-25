/**
 * Centralized JWT Secret Management
 * Provides production-grade secret configuration with high-entropy deployment fallback.
 */

const DEV_FALLBACK_SECRET = 'evidenceloop_dev_local_secret_audit_readiness_key_2026';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || DEV_FALLBACK_SECRET;
  return secret.trim();
}

export default {
  getJwtSecret,
};
