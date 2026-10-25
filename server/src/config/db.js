import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_DIR = path.resolve(__dirname, '../../data');
export const DATA_FILE = path.join(DATA_DIR, 'obligations.json');

let isConnecting = false;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[Database Notice] No MONGODB_URI configured. Operating with file/memory storage.');
    return null;
  }

  if (isConnecting) {
    // Wait at most 2 seconds for in-progress connection to avoid hanging requests
    const start = Date.now();
    while (mongoose.connection.readyState === 2 && Date.now() - start < 2000) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    return null;
  }

  isConnecting = true;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB: ${error.message}`);
    console.warn(`[Database Notice] Falling back to file/memory storage.`);
    return null;
  } finally {
    isConnecting = false;
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
    console.error(`[Database Error] Failed to persist fallback records to file: ${error.message}`);
    return false;
  }
}

export default connectDB;
