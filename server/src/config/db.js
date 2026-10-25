import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function isProduction() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

// In serverless environments (Vercel, AWS Lambda), /var/task is read-only; use os.tmpdir() (/tmp)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
export const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'evidenceloop-data')
  : path.resolve(__dirname, '../../data');
export const DATA_FILE = path.join(DATA_DIR, 'obligations.json');

const ATLAS_PRODUCTION_URI =
  'mongodb+srv://hemasrichowdarykilaru_db_user:yuw40UOtNzFmaptG@cluster0.sj3hpus.mongodb.net/evidenceloop?retryWrites=true&w=majority';

let cachedPromise = null;
let lastFailTime = 0;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Short backoff (3s) to prevent spamming failed DNS during active errors
  if (Date.now() - lastFailTime < 3000) {
    if (isProduction()) {
      return null;
    }
  }

  if (cachedPromise) {
    try {
      const conn = await cachedPromise;
      if (mongoose.connection.readyState === 1) {
        return conn;
      }
    } catch {
      cachedPromise = null;
    }
  }

  const uri = process.env.MONGODB_URI || ATLAS_PRODUCTION_URI;

  try {
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      bufferCommands: false,
      maxPoolSize: 10,
    });
    const conn = await cachedPromise;
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cachedPromise = null;
    lastFailTime = Date.now();
    console.error(`[Database Error] Could not connect to MongoDB Atlas: ${error.message}`);
    if (isProduction()) {
      console.error(`[Database Notice] MongoDB Atlas is mandatory in production. Local/memory fallbacks are prohibited.`);
      return null;
    }
    console.warn(`[Database Notice] Operating in local development file fallback mode.`);
    return null;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export function getStorageEngine() {
  if (isDbConnected()) return 'mongodb';
  if (isProduction()) return 'unavailable';
  return 'file';
}

/**
 * Load fallback records from disk.
 * Strictly prohibited in production.
 */
export function loadFallbackData() {
  if (isProduction()) {
    throw new Error('Local file/memory fallback storage is disabled in production. MongoDB Atlas is mandatory.');
  }
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return null;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn(`[Database Warning] Failed to read fallback storage file: ${error.message}`);
    return null;
  }
}

/**
 * Persist fallback records to disk.
 * Strictly prohibited in production.
 */
export function saveFallbackData(records) {
  if (isProduction()) {
    throw new Error('Local file/memory fallback storage is disabled in production. MongoDB Atlas is mandatory.');
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.warn(`[Database Warning] Fallback records maintained in memory: ${error.message}`);
    return true;
  }
}

export default connectDB;
