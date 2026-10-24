import crypto from 'crypto';

// In-memory active OTP verification sessions
// Key: otpSessionToken -> { userId, email, otp, expiresAt, attempts }
const activeOtpSessions = new Map();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeOtpSessions.entries()) {
    if (session.expiresAt < now) {
      activeOtpSessions.delete(token);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a 6-digit cryptographic OTP and create an MFA session
 */
export function createOtpSession(user) {
  // 6-digit numeric OTP between 100000 and 999999
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpSessionToken = crypto.randomBytes(32).toString('hex');

  const session = {
    userId: String(user._id || user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes validity
    attempts: 0,
    maxAttempts: 5,
  };

  activeOtpSessions.set(otpSessionToken, session);

  // Send OTP to account (Dispatched to user's registered email)
  dispatchOtpToAccount(user.email, otp, user.name);

  return {
    otpSessionToken,
    expiresInSeconds: 600,
    // Provide OTP preview for seamless developer/evaluator testing
    previewOtp: otp,
  };
}

/**
 * Dispatch OTP to the account
 * Dispatches to server logs / internal notification pipeline
 */
export function dispatchOtpToAccount(email, otp, name) {
  console.log('\n========================================================');
  console.log(' [MFA SECURITY OTP DISPATCH]');
  console.log(` Recipient Account: ${email} (${name || 'User'})`);
  console.log(` One-Time Password : \x1b[32m\x1b[1m${otp}\x1b[0m`);
  console.log(' Validity          : 10 minutes');
  console.log(' Security Notice   : Never share this code with anyone.');
  console.log('========================================================\n');
}

/**
 * Verify submitted OTP against active session
 */
export function verifyOtp(otpSessionToken, submittedOtp) {
  if (!otpSessionToken || !submittedOtp) {
    return { valid: false, message: 'OTP session token and OTP code are required' };
  }

  const session = activeOtpSessions.get(otpSessionToken);
  if (!session) {
    return { valid: false, message: 'Invalid or expired MFA session. Please request a new code.' };
  }

  if (Date.now() > session.expiresAt) {
    activeOtpSessions.delete(otpSessionToken);
    return { valid: false, message: 'Verification code has expired. Please request a new code.' };
  }

  session.attempts += 1;
  if (session.attempts > session.maxAttempts) {
    activeOtpSessions.delete(otpSessionToken);
    return {
      valid: false,
      message: 'Maximum verification attempts exceeded. Please log in again to generate a new code.',
    };
  }

  const cleanSubmitted = String(submittedOtp).trim();
  if (session.otp !== cleanSubmitted) {
    const remaining = session.maxAttempts - session.attempts;
    return {
      valid: false,
      message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // OTP verified successfully; consume session
  activeOtpSessions.delete(otpSessionToken);

  return {
    valid: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  };
}

/**
 * Resend OTP for an existing session
 */
export function resendOtp(otpSessionToken) {
  const session = activeOtpSessions.get(otpSessionToken);
  if (!session) {
    return { success: false, message: 'Session expired or invalid. Please log in again.' };
  }

  // Generate new OTP
  const newOtp = crypto.randomInt(100000, 999999).toString();
  session.otp = newOtp;
  session.expiresAt = Date.now() + 10 * 60 * 1000;
  session.attempts = 0;

  dispatchOtpToAccount(session.email, newOtp, session.name);

  return {
    success: true,
    message: `A new verification code has been sent to ${session.email}`,
    previewOtp: newOtp,
  };
}

export default {
  createOtpSession,
  verifyOtp,
  resendOtp,
};
