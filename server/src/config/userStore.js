import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isDbConnected, DATA_DIR } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Initial seed users with their default credentials
export const DEFAULT_USERS = [
  {
    _id: 'usr_admin_001',
    name: 'Sarah Jenkins (Chief Compliance Officer)',
    email: 'admin@evidenceloop.com',
    passwordRaw: 'AdminPassword123!',
    role: 'Admin',
    mfaEnabled: true,
  },
  {
    _id: 'usr_auditor_002',
    name: 'Marcus Vance (Lead Internal Auditor)',
    email: 'auditor@evidenceloop.com',
    passwordRaw: 'AuditorPassword123!',
    role: 'Auditor',
    mfaEnabled: true,
  },
  {
    _id: 'usr_viewer_003',
    name: 'Elena Rostova (Compliance Observer)',
    email: 'viewer@evidenceloop.com',
    passwordRaw: 'ViewerPassword123!',
    role: 'Viewer',
    mfaEnabled: true,
  },
];

let fallbackUsers = [];

function loadUsersFile() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return null;
    }
    const content = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn(`[UserStore Warning] Failed to read ${USERS_FILE}:`, err.message);
    return null;
  }
}

function saveUsersFile(users) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`[UserStore Error] Failed to persist ${USERS_FILE}:`, err.message);
    return false;
  }
}

export async function initUserStore() {
  const loaded = loadUsersFile();
  if (loaded && loaded.length > 0) {
    fallbackUsers = loaded;
    return;
  }

  // Generate initial hashed seed users
  fallbackUsers = await Promise.all(
    DEFAULT_USERS.map(async (u) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.passwordRaw, salt);
      return {
        _id: u._id,
        name: u.name,
        email: u.email.toLowerCase(),
        password: hashedPassword,
        role: u.role,
        mfaEnabled: u.mfaEnabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    })
  );

  saveUsersFile(fallbackUsers);
}

// Seed MongoDB if connected and empty
export async function seedMongoUsersIfEmpty() {
  if (!isDbConnected()) return;
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      for (const u of DEFAULT_USERS) {
        await User.create({
          name: u.name,
          email: u.email,
          password: u.passwordRaw, // Mongoose pre-save hook will hash this
          role: u.role,
          mfaEnabled: u.mfaEnabled,
        });
      }
      console.log('[Database] Seeded initial compliance users in MongoDB.');
    }
  } catch (err) {
    console.warn('[Database] User seeding check skipped:', err.message);
  }
}

export async function findUserByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (isDbConnected()) {
    return User.findOne({ email: cleanEmail });
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const found = fallbackUsers.find((u) => u.email === cleanEmail);
  if (!found) return null;

  return {
    ...found,
    comparePassword: async (candidate) => bcrypt.compare(candidate, found.password),
  };
}

export async function findUserById(id) {
  if (isDbConnected()) {
    return User.findById(id).select('-password');
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const found = fallbackUsers.find((u) => String(u._id) === String(id));
  if (!found) return null;

  const { password, ...safeUser } = found;
  return safeUser;
}

export async function createUser({ name, email, password, role = 'Auditor' }) {
  const cleanEmail = email.trim().toLowerCase();

  if (isDbConnected()) {
    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      role,
      mfaEnabled: true,
    });
    await user.save();
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
    };
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    _id: `usr_${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    role,
    mfaEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  fallbackUsers.push(newUser);
  saveUsersFile(fallbackUsers);

  const { password: _, ...safeUser } = newUser;
  return safeUser;
}

// Immediately initialize fallback store in background
initUserStore();
