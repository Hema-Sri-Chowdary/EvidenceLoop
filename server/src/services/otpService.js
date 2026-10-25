import crypto from 'crypto';
import nodemailer from 'nodemailer';
import OtpSession from '../models/OtpSession.js';
import { isDbConnected, isProduction } from '../config/db.js';

// Fallback in-memory active OTP verification sessions (strictly for local offline dev)
// Key: otpSessionToken -> { userId, email, otpHash, expiresAt, attempts, maxAttempts, org, role, name, purpose }
const fallbackOtpSessions = new Map();

// Periodic cleanup for offline memory fallback
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, session] of fallbackOtpSessions.entries()) {
    if (session.expiresAt < now) {
      fallbackOtpSessions.delete(token);
    }
  }
}, 5 * 60 * 1000);
if (cleanupInterval.unref) cleanupInterval.unref();

let mailTransporter = null;

/**
 * Shared mail configuration helper
 * Supplies sender address consistently to both OTP and password-reset emails
 */
export function getMailConfig() {
  const authUser =
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    'hemasrichowdarykilaru@gmail.com';

  const fromAddress =
    process.env.EMAIL_FROM ||
    `"EvidenceLoop Security" <${authUser}>`;

  return {
    authUser,
    fromAddress,
  };
}

export function getMailTransporter() {
  if (mailTransporter) return mailTransporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const { authUser } = getMailConfig();
  const smtpPass =
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    'hqon tiuu iesx ylgp';

  if (authUser && smtpPass) {
    if (smtpHost) {
      mailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: authUser,
          pass: smtpPass,
        },
      });
    } else {
      // Default to Gmail service
      mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: authUser,
          pass: smtpPass,
        },
      });
    }
  }

  return mailTransporter;
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

/**
 * Dispatch OTP to account in real-time
 * Awaits delivery and propagates errors on failure.
 * Never exposes raw OTP in production logs or responses.
 */
export async function dispatchOtpToAccount(email, otp, name) {
  const timestamp = new Date().toISOString();
  console.log(`[REAL-TIME MFA DISPATCH] [${timestamp}] Recipient: ${email} (${name || 'User'}) - Validity: 10 mins`);

  const transporter = getMailTransporter();
  if (!transporter) {
    console.error(`[Real-Time MFA Error] SMTP mail transporter is not configured.`);
    throw new Error('Email delivery service is currently unavailable. Verification code could not be sent.');
  }

  const { fromAddress } = getMailConfig();

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `Your EvidenceLoop MFA Verification Code: ${otp}`,
    text: `Hello ${name || 'User'},\n\nYour 6-digit EvidenceLoop verification code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not initiate this login request, please secure your account immediately.\n\nEvidenceLoop Internal Audit Readiness System`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #CCFBF1; border-radius: 14px; background-color: #FFFFFF;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0F766E; margin: 0 0 6px 0; font-size: 24px; font-weight: 700;">EvidenceLoop</h2>
          <p style="color: #64748B; font-size: 13.5px; margin: 0;">Internal Audit Readiness & Compliance Workspace</p>
        </div>
        <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 22px; text-align: center; margin-bottom: 22px;">
          <p style="color: #065F46; font-size: 13.5px; font-weight: 600; margin: 0 0 10px 0; letter-spacing: 0.5px;">YOUR REAL-TIME MFA VERIFICATION CODE</p>
          <div style="font-family: monospace; font-size: 36px; font-weight: 800; color: #047857; letter-spacing: 8px; margin: 8px 0;">
            ${otp}
          </div>
          <p style="color: #059669; font-size: 12px; margin: 8px 0 0 0;">Expires in 10 minutes &bull; Single-use security token</p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 14px 0;">
          Hello <strong>${name || 'User'}</strong>,<br/>
          A real-time sign-in request was received for account <strong>${email}</strong>. Use the 6-digit verification code above to complete your sign-in.
        </p>
        <div style="background-color: #F8FAFC; border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 12.5px; color: #64748B;">
          <strong>Security Notice:</strong> Never share your one-time code with anyone. EvidenceLoop compliance staff will never ask for your verification code.
        </div>
        <p style="color: #94A3B8; font-size: 11.5px; border-top: 1px solid #F1F5F9; padding-top: 14px; margin: 20px 0 0 0; text-align: center;">
          EvidenceLoop Compliance Engine &bull; Automated Security Notification
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Real-Time MFA] Verification email successfully sent to ${email} (Message ID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`[Real-Time MFA Error] Live SMTP delivery failed for recipient (${email}): ${err.message}`);
    throw new Error(`Verification email delivery failed: ${err.message}`);
  }
}

/**
 * Dispatch Password Reset Code to account
 * Fixes undefined authUser bug via shared getMailConfig()
 * Propagates errors on delivery failure.
 */
export async function dispatchPasswordResetToAccount(email, otp, name) {
  const timestamp = new Date().toISOString();
  console.log(`[PASSWORD RESET DISPATCH] [${timestamp}] Recipient: ${email} (${name || 'User'}) - Validity: 10 mins`);

  const transporter = getMailTransporter();
  if (!transporter) {
    console.error(`[Password Reset Error] SMTP mail transporter is not configured.`);
    throw new Error('Email delivery service is currently unavailable. Password reset code could not be sent.');
  }

  const { fromAddress } = getMailConfig();

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `Your EvidenceLoop Password Reset Code: ${otp}`,
    text: `Hello ${name || 'User'},\n\nA password reset request was initiated for ${email}.\nYour 6-digit password reset code is: ${otp}\nValid for 10 minutes.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #CCFBF1; border-radius: 14px; background-color: #FFFFFF;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0F766E; margin: 0 0 6px 0; font-size: 24px; font-weight: 700;">EvidenceLoop</h2>
          <p style="color: #64748B; font-size: 13.5px; margin: 0;">Password Recovery Assistance</p>
        </div>
        <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 10px; padding: 22px; text-align: center; margin-bottom: 22px;">
          <p style="color: #92400E; font-size: 13.5px; font-weight: 600; margin: 0 0 10px 0;">YOUR PASSWORD RESET CODE</p>
          <div style="font-family: monospace; font-size: 36px; font-weight: 800; color: #B45309; letter-spacing: 8px; margin: 8px 0;">
            ${otp}
          </div>
          <p style="color: #B45309; font-size: 12px; margin: 8px 0 0 0;">Expires in 10 minutes &bull; Single-use token</p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 14px 0;">
          Hello <strong>${name || 'User'}</strong>,<br/>
          We received a request to reset your EvidenceLoop account password. Enter the 6-digit code above along with your new password to complete the reset.
        </p>
        <p style="color: #94A3B8; font-size: 11.5px; border-top: 1px solid #F1F5F9; padding-top: 14px; margin: 20px 0 0 0; text-align: center;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Password Reset] Email successfully sent to ${email} (Message ID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`[Password Reset Error] Live SMTP delivery failed for recipient (${email}): ${err.message}`);
    throw new Error(`Password reset email delivery failed: ${err.message}`);
  }
}

/**
 * Generate a 6-digit cryptographic OTP and create an MFA session in persistent shared storage.
 * Safe delivery: Email is dispatched FIRST. If delivery fails, error propagates and no session is created.
 */
export async function createOtpSession(user) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpSessionToken = crypto.randomBytes(32).toString('hex');
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

  // Await delivery before saving session. If dispatch fails, function throws and no session is created.
  await dispatchOtpToAccount(user.email, otp, user.name);

  if (isDbConnected()) {
    // Shared persistent storage with automatic TTL expiry
    await OtpSession.create({
      token: otpSessionToken,
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role === 'Auditor' ? 'Auditor' : 'Viewer',
      org: user.org,
      userId: String(user._id || user.id),
      otpHash,
      purpose: 'mfa',
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });
  } else {
    if (isProduction()) {
      throw new Error('Database connection unavailable. MongoDB Atlas is mandatory in production.');
    }
    fallbackOtpSessions.set(otpSessionToken, {
      userId: String(user._id || user.id),
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role === 'Auditor' ? 'Auditor' : 'Viewer',
      org: user.org,
      otpHash,
      purpose: 'mfa',
      expiresAt: expiresAt.getTime(),
      attempts: 0,
      maxAttempts: 5,
    });
  }

  return {
    otpSessionToken,
    expiresInSeconds: 600,
  };
}

/**
 * Verify submitted OTP against persistent shared session
 */
export async function verifyOtp(otpSessionToken, submittedOtp) {
  if (!otpSessionToken || !submittedOtp) {
    return { valid: false, message: 'OTP session token and 6-digit verification code are required' };
  }

  const candidateHash = hashOtp(submittedOtp);

  if (isDbConnected()) {
    const session = await OtpSession.findOne({ token: otpSessionToken, purpose: 'mfa' });
    if (!session) {
      return { valid: false, message: 'Invalid or expired MFA session. Please request a new code.' };
    }

    if (new Date() > session.expiresAt) {
      await OtpSession.deleteOne({ _id: session._id });
      return { valid: false, message: 'Verification code has expired. Please request a new code.' };
    }

    session.attempts += 1;
    if (session.attempts > session.maxAttempts) {
      await OtpSession.deleteOne({ _id: session._id });
      return {
        valid: false,
        message: 'Maximum verification attempts exceeded. Please log in again to generate a new code.',
      };
    }

    if (session.otpHash !== candidateHash) {
      await session.save();
      const remaining = session.maxAttempts - session.attempts;
      return {
        valid: false,
        message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    // OTP verified successfully; consume session from persistent storage
    await OtpSession.deleteOne({ _id: session._id });

    return {
      valid: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role === 'Auditor' ? 'Auditor' : 'Viewer',
        org: session.org,
      },
    };
  }

  if (isProduction()) {
    return { valid: false, message: 'Database connection unavailable. MongoDB Atlas is mandatory in production.' };
  }

  // Fallback in-memory verification (strictly local dev)
  const session = fallbackOtpSessions.get(otpSessionToken);
  if (!session || session.purpose !== 'mfa') {
    return { valid: false, message: 'Invalid or expired MFA session. Please request a new code.' };
  }

  if (Date.now() > session.expiresAt) {
    fallbackOtpSessions.delete(otpSessionToken);
    return { valid: false, message: 'Verification code has expired. Please request a new code.' };
  }

  session.attempts += 1;
  if (session.attempts > session.maxAttempts) {
    fallbackOtpSessions.delete(otpSessionToken);
    return {
      valid: false,
      message: 'Maximum verification attempts exceeded. Please log in again to generate a new code.',
    };
  }

  if (session.otpHash !== candidateHash) {
    const remaining = session.maxAttempts - session.attempts;
    return {
      valid: false,
      message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  fallbackOtpSessions.delete(otpSessionToken);

  return {
    valid: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role === 'Auditor' ? 'Auditor' : 'Viewer',
      org: session.org,
    },
  };
}

/**
 * Resend OTP for an existing session
 * Safe delivery: Email is dispatched FIRST before updating session timestamp.
 */
export async function resendOtp(otpSessionToken) {
  const newOtp = crypto.randomInt(100000, 999999).toString();
  const newHash = hashOtp(newOtp);
  const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (isDbConnected()) {
    const session = await OtpSession.findOne({ token: otpSessionToken, purpose: 'mfa' });
    if (!session) {
      return { success: false, message: 'Session expired or invalid. Please log in again.' };
    }

    // Await delivery first
    await dispatchOtpToAccount(session.email, newOtp, session.name);

    session.otpHash = newHash;
    session.expiresAt = newExpiresAt;
    session.attempts = 0;
    await session.save();

    return {
      success: true,
      message: `A new real-time verification code has been dispatched to ${session.email}`,
    };
  }

  if (isProduction()) {
    throw new Error('Database connection unavailable. MongoDB Atlas is mandatory in production.');
  }

  const session = fallbackOtpSessions.get(otpSessionToken);
  if (!session || session.purpose !== 'mfa') {
    return { success: false, message: 'Session expired or invalid. Please log in again.' };
  }

  await dispatchOtpToAccount(session.email, newOtp, session.name);

  session.otpHash = newHash;
  session.expiresAt = newExpiresAt.getTime();
  session.attempts = 0;

  return {
    success: true,
    message: `A new real-time verification code has been dispatched to ${session.email}`,
  };
}

/**
 * Create Password Reset Session
 * Safe delivery: Email is dispatched FIRST before creating session in DB.
 */
export async function createPasswordResetSession(user) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const resetSessionToken = crypto.randomBytes(32).toString('hex');
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Await delivery before saving session. If dispatch fails, function throws and no session is created.
  await dispatchPasswordResetToAccount(user.email, otp, user.name);

  if (isDbConnected()) {
    await OtpSession.create({
      token: resetSessionToken,
      email: user.email.toLowerCase(),
      name: user.name,
      userId: String(user._id || user.id),
      otpHash,
      purpose: 'password_reset',
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });
  } else {
    if (isProduction()) {
      throw new Error('Database connection unavailable. MongoDB Atlas is mandatory in production.');
    }
    fallbackOtpSessions.set(resetSessionToken, {
      userId: String(user._id || user.id),
      email: user.email.toLowerCase(),
      name: user.name,
      otpHash,
      purpose: 'password_reset',
      expiresAt: expiresAt.getTime(),
      attempts: 0,
      maxAttempts: 5,
    });
  }

  return {
    resetSessionToken,
    expiresInSeconds: 600,
  };
}

/**
 * Verify Password Reset OTP
 */
export async function verifyPasswordResetOtp(resetSessionToken, submittedOtp) {
  if (!resetSessionToken || !submittedOtp) {
    return { valid: false, message: 'Reset session token and reset code are required' };
  }

  const candidateHash = hashOtp(submittedOtp);

  if (isDbConnected()) {
    const session = await OtpSession.findOne({ token: resetSessionToken, purpose: 'password_reset' });
    if (!session) {
      return { valid: false, message: 'Invalid or expired password reset session. Please request a new code.' };
    }

    if (new Date() > session.expiresAt) {
      await OtpSession.deleteOne({ _id: session._id });
      return { valid: false, message: 'Reset code has expired. Please request a new code.' };
    }

    session.attempts += 1;
    if (session.attempts > session.maxAttempts) {
      await OtpSession.deleteOne({ _id: session._id });
      return { valid: false, message: 'Maximum attempts exceeded. Please request a new code.' };
    }

    if (session.otpHash !== candidateHash) {
      await session.save();
      const remaining = session.maxAttempts - session.attempts;
      return { valid: false, message: `Incorrect reset code. ${remaining} attempt(s) remaining.` };
    }

    const email = session.email;
    await OtpSession.deleteOne({ _id: session._id });
    return { valid: true, email };
  }

  if (isProduction()) {
    return { valid: false, message: 'Database connection unavailable. MongoDB Atlas is mandatory in production.' };
  }

  const session = fallbackOtpSessions.get(resetSessionToken);
  if (!session || session.purpose !== 'password_reset') {
    return { valid: false, message: 'Invalid or expired password reset session. Please request a new code.' };
  }

  if (Date.now() > session.expiresAt) {
    fallbackOtpSessions.delete(resetSessionToken);
    return { valid: false, message: 'Reset code has expired. Please request a new code.' };
  }

  session.attempts += 1;
  if (session.attempts > session.maxAttempts) {
    fallbackOtpSessions.delete(resetSessionToken);
    return { valid: false, message: 'Maximum attempts exceeded. Please request a new code.' };
  }

  if (session.otpHash !== candidateHash) {
    const remaining = session.maxAttempts - session.attempts;
    return { valid: false, message: `Incorrect reset code. ${remaining} attempt(s) remaining.` };
  }

  const email = session.email;
  fallbackOtpSessions.delete(resetSessionToken);
  return { valid: true, email };
}

export default {
  createOtpSession,
  verifyOtp,
  resendOtp,
  dispatchOtpToAccount,
  createPasswordResetSession,
  verifyPasswordResetOtp,
  getMailTransporter,
  getMailConfig,
};
