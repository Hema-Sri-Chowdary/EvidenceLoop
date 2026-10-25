import mongoose from 'mongoose';

/**
 * OtpSession Schema
 * Provides shared, persistent OTP storage across serverless instances and multiple server nodes.
 * Automatic TTL index purges expired documents without requiring manual cron cleanup.
 */
const OtpSessionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['Auditor', 'Viewer'],
      default: 'Viewer',
    },
    org: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['mfa', 'password_reset'],
      default: 'mfa',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index: document automatically expires when expiresAt <= current time
    },
  },
  {
    timestamps: true,
  }
);

export const OtpSession = mongoose.model('OtpSession', OtpSessionSchema);
export default OtpSession;
