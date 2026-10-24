import crypto from 'crypto';
import nodemailer from 'nodemailer';

// In-memory active OTP verification sessions
// Key: otpSessionToken -> { userId, email, otp, expiresAt, attempts, org, role }
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

let mailTransporter = null;

function getMailTransporter() {
  if (mailTransporter) return mailTransporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (smtpUser && smtpPass) {
    if (smtpHost) {
      mailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Default to Gmail service
      mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  return mailTransporter;
}

/**
 * Dispatch OTP to account in real-time
 * 1. Sends real email via Nodemailer if SMTP/Gmail credentials configured
 * 2. Emits real-time visual dispatch in server logs
 */
export async function dispatchOtpToAccount(email, otp, name) {
  const timestamp = new Date().toISOString();
  console.log('\n========================================================');
  console.log(` [REAL-TIME MFA OTP DISPATCH] [${timestamp}]`);
  console.log(` Recipient Account: ${email} (${name || 'User'})`);
  console.log(` One-Time Password : \x1b[32m\x1b[1m${otp}\x1b[0m`);
  console.log(' Validity          : 10 minutes');
  console.log(' Channel           : Instant Security Delivery');
  console.log('========================================================\n');

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      const fromAddress = process.env.EMAIL_FROM || `"EvidenceLoop Security" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'security@evidenceloop.com'}>`;
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

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Real-Time MFA] Sent email to ${email}. Message ID: ${info.messageId}`);
    } catch (err) {
      console.warn(`[Real-Time MFA Email Notice] Could not send email: ${err.message}. Code remains available in console and live preview.`);
    }
  }
}

/**
 * Generate a 6-digit cryptographic OTP and create an MFA session
 */
export function createOtpSession(user) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpSessionToken = crypto.randomBytes(32).toString('hex');

  const session = {
    userId: String(user._id || user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    org: user.org,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes validity
    attempts: 0,
    maxAttempts: 5,
  };

  activeOtpSessions.set(otpSessionToken, session);

  // Dispatch OTP in real-time
  dispatchOtpToAccount(user.email, otp, user.name);

  return {
    otpSessionToken,
    expiresInSeconds: 600,
    previewOtp: otp,
  };
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
      org: session.org,
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
    message: `A new real-time verification code has been dispatched to ${session.email}`,
    previewOtp: newOtp,
  };
}

export default {
  createOtpSession,
  verifyOtp,
  resendOtp,
  dispatchOtpToAccount,
};
