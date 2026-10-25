/**
 * Lightweight In-Memory Rate Limiter Middleware
 * Protects login, MFA verification, and password-reset endpoints against brute-force attacks.
 */

export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 10, message = 'Too many requests. Please try again later.' }) {
  const hits = new Map();

  // Periodic cleanup
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.min(windowMs, 5 * 60 * 1000));
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-ip';
    const clientKey = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();

    const record = hits.get(clientKey);

    if (!record || now > record.resetTime) {
      hits.set(clientKey, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    }

    next();
  };
}

// Pre-configured rate limiters
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
});

export const otpVerifyLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: 'Too many OTP verification attempts. Please wait a few minutes before trying again.',
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many password reset requests from this IP. Please try again later.',
});

export default {
  createRateLimiter,
  loginLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
};
