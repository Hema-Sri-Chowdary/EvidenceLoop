import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In serverless environments (Vercel, AWS Lambda), /var/task is read-only; use os.tmpdir() (/tmp)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
export const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'evidenceloop-data')
  : path.resolve(__dirname, '../../data');
export const DATA_FILE = path.join(DATA_DIR, 'obligations.json');

const ATLAS_PRODUCTION_URI =
  'mongodb+srv://hemasrichowdarykilaru_db_user:yuw40UOtNzFmaptG@cluster0.sj3hpus.mongodb.net/evidenceloop?retryWrites=true&w=majority';

let cachedPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
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
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
      socketTimeoutMS: 15000,
      bufferCommands: false,
    });
    const conn = await cachedPromise;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cachedPromise = null;
    console.warn(`[Database Warning] Could not connect to MongoDB: ${error.message}`);
    console.warn(`[Database Notice] Operating in resilient memory/file fallback mode.`);
    return null;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export function getStorageEngine() {
  return isDbConnected() ? 'mongodb' : 'file';
}

/**
 * Load fallback records from disk.
 * Returns null if file doesn't exist or is invalid.
 */
export function loadFallbackData() {
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
 */
export function saveFallbackData(records) {
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
