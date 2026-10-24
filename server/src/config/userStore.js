import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isDbConnected, DATA_DIR } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * Enforce role assignment rules:
 * - 'hemasrichowdary@gmail.com' is ALWAYS Admin
 * - Anyone with '@vit' or '@vcomply' in their email domain is ALWAYS Auditor
 * - Remaining accounts are Viewers
 */
export function determineRoleByEmail(email) {
  if (!email || typeof email !== 'string') return 'Viewer';
  const clean = email.trim().toLowerCase();
  if (clean === 'hemasrichowdary@gmail.com' || clean === 'hemasrichowdarykilaru@gmail.com') {
    return 'Admin';
  }
  if (
    clean.includes('@vit') ||
    clean.includes('.vit.') ||
    clean.includes('@vcomply') ||
    clean.includes('.vcomply.')
  ) {
    return 'Auditor';
  }
  return 'Viewer';
}

/**
 * Determine default organization if none explicitly supplied
 */
export function determineOrgByEmail(email, customOrg) {
  if (customOrg && typeof customOrg === 'string' && customOrg.trim()) {
    return customOrg.trim();
  }
  const clean = (email || '').trim().toLowerCase();
  if (clean === 'hemasrichowdary@gmail.com' || clean === 'hemasrichowdarykilaru@gmail.com') {
    return 'VIT-AP University / EvidenceLoop Principal';
  }
  if (clean.includes('@vcomply') || clean.includes('.vcomply.')) {
    return 'VComply';
  }
  if (clean.includes('@vit') || clean.includes('.vit.')) {
    return 'VIT University';
  }
  return 'Compliance Observer Organization';
}

// Registered accounts list (cleared so user can register fresh accounts)
export const DEFAULT_USERS = [];

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

let isStoreInitialized = false;

export async function initUserStore() {
  if (isStoreInitialized) return;
  isStoreInitialized = true;

  const loaded = loadUsersFile();
  if (Array.isArray(loaded)) {
    fallbackUsers = loaded;
    return;
  }

  // If no file exists, initialize empty list
  fallbackUsers = [];
  saveUsersFile(fallbackUsers);
}

// Seed MongoDB if connected and empty
export async function seedMongoUsersIfEmpty() {
  if (!isDbConnected()) return;
  if (!Array.isArray(DEFAULT_USERS) || DEFAULT_USERS.length === 0) return;
  try {
    for (const u of DEFAULT_USERS) {
      const cleanEmail = u.email.toLowerCase();
      const existing = await User.findOne({ email: cleanEmail });
      if (!existing) {
        await User.create({
          name: u.name,
          email: cleanEmail,
          password: u.passwordRaw,
          role: u.role,
          org: u.org || determineOrgByEmail(cleanEmail),
          mfaEnabled: u.mfaEnabled,
        });
      }
    }
  } catch (err) {
    console.warn('[Database] User seeding check skipped:', err.message);
  }
}


export async function findUserByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (isDbConnected()) {
    const user = await User.findOne({ email: cleanEmail });
    if (user) {
      const properRole = determineRoleByEmail(cleanEmail);
      if (cleanEmail !== 'admin@evidenceloop.com' && user.role !== properRole) {
        user.role = properRole;
        await user.save();
      }
    }
    return user;
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const found = fallbackUsers.find((u) => u.email === cleanEmail);
  if (!found) return null;

  // Enforce role
  const properRole = determineRoleByEmail(cleanEmail);
  if (cleanEmail !== 'admin@evidenceloop.com' && found.role !== properRole) {
    found.role = properRole;
    saveUsersFile(fallbackUsers);
  }

  return {
    ...found,
    comparePassword: async (candidate) => bcrypt.compare(candidate, found.password),
  };
}

export async function findUserById(id) {
  if (isDbConnected()) {
    const user = await User.findById(id).select('-password');
    if (user) {
      const properRole = determineRoleByEmail(user.email);
      if (user.email !== 'admin@evidenceloop.com' && user.role !== properRole) {
        user.role = properRole;
        await user.save();
      }
    }
    return user;
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const found = fallbackUsers.find((u) => String(u._id) === String(id));
  if (!found) return null;

  const properRole = determineRoleByEmail(found.email);
  if (found.email !== 'admin@evidenceloop.com' && found.role !== properRole) {
    found.role = properRole;
    saveUsersFile(fallbackUsers);
  }

  const { password, ...safeUser } = found;
  return safeUser;
}

export async function createUser({ name, email, password, org }) {
  const cleanEmail = email.trim().toLowerCase();
  const enforcedRole = determineRoleByEmail(cleanEmail);
  const resolvedOrg = determineOrgByEmail(cleanEmail, org);

  if (isDbConnected()) {
    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: enforcedRole,
      org: resolvedOrg,
      mfaEnabled: true,
    });
    await user.save();
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      org: user.org,
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
    role: enforcedRole,
    org: resolvedOrg,
    mfaEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  fallbackUsers.push(newUser);
  saveUsersFile(fallbackUsers);

  const { password: _, ...safeUser } = newUser;
  return safeUser;
}

export async function updateUserProfile(id, { name, org }) {
  if (isDbConnected()) {
    const user = await User.findById(id);
    if (!user) return null;
    if (name && name.trim()) user.name = name.trim();
    if (org !== undefined) user.org = org.trim();
    await user.save();
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      org: user.org,
    };
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const user = fallbackUsers.find((u) => String(u._id) === String(id));
  if (!user) return null;

  if (name && name.trim()) user.name = name.trim();
  if (org !== undefined) user.org = org.trim();
  user.updatedAt = new Date().toISOString();

  saveUsersFile(fallbackUsers);

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    org: user.org,
  };
}

export async function deleteUserById(id) {
  if (isDbConnected()) {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const initialCount = fallbackUsers.length;
  fallbackUsers = fallbackUsers.filter((u) => String(u._id) !== String(id));
  if (fallbackUsers.length !== initialCount) {
    saveUsersFile(fallbackUsers);
    return true;
  }
  return false;
}

export async function updateUserPassword(email, newHashedPassword) {
  const cleanEmail = email.trim().toLowerCase();
  if (isDbConnected()) {
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return false;
    user.password = newHashedPassword;
    await user.save();
    return true;
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const user = fallbackUsers.find((u) => u.email === cleanEmail);
  if (!user) return false;

  user.password = newHashedPassword;
  user.updatedAt = new Date().toISOString();
  saveUsersFile(fallbackUsers);
  return true;
}

// Immediately initialize fallback store in background
initUserStore();
