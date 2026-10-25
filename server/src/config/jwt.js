/**
 * Centralized JWT Secret Management
 * Enforces production-grade secret configuration and fails fast if missing.
 */

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  
  if (!secret || secret.trim() === '') {
    const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
    if (isProduction) {
      console.error('FATAL: JWT_SECRET environment variable is missing in production environment. Refusing to start.');
      throw new Error('FATAL: Missing required JWT_SECRET environment variable in production');
    }
    throw new Error('JWT_SECRET environment variable is required. Please define JWT_SECRET in server/.env');
  }

  return secret.trim();
}

export default {
  getJwtSecret,
};
