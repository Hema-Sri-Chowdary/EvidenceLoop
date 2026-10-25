import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { isDbConnected, isProduction, DATA_DIR } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * Server-Enforced Role Assignment Rules:
 * - Strictly two roles: 'Auditor' and 'Viewer' (Admin role removed entirely)
 * - Users with '@vit' or '@vcomply' domains are assigned 'Auditor'
 * - All other accounts are assigned 'Viewer'
 * - Roles sent by the browser are strictly ignored
 */
export function determineRoleByEmail(email) {
  if (!email || typeof email !== 'string') return 'Viewer';
  const clean = email.trim().toLowerCase();
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
 * Trusted Organization Identifier Determination:
 * - Domain-verified emails are assigned their trusted organization
 * - External/unverified domains cannot spoof reserved institutional organizations
 */
export function determineOrgByEmail(email, customOrg) {
  const clean = (email || '').trim().toLowerCase();
  if (clean.includes('@vcomply') || clean.includes('.vcomply.')) {
    return 'VComply';
  }
  if (clean.includes('@vit') || clean.includes('.vit.')) {
    return 'VIT-AP University';
  }
  if (customOrg && typeof customOrg === 'string' && customOrg.trim()) {
    const cleanCustom = customOrg.trim();
    // Prevent spoofing of institutional domains
    if (/vcomply/i.test(cleanCustom) || /vit/i.test(cleanCustom)) {
      return 'Compliance Observer Organization';
    }
    return cleanCustom;
  }
  return 'Compliance Observer Organization';
}

// Registered accounts list (fresh accounts register dynamically)
export const DEFAULT_USERS = [];

let fallbackUsers = [];

function loadUsersFile() {
  if (isProduction()) return null;
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
  if (isProduction()) return false;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn(`[UserStore Notice] Fallback users safely maintained in memory (${err.message})`);
    return true;
  }
}

let isStoreInitialized = false;

export async function initUserStore() {
  if (isProduction()) return;
  if (isStoreInitialized) return;
  isStoreInitialized = true;

  const loaded = loadUsersFile();
  if (Array.isArray(loaded)) {
    fallbackUsers = loaded;
    return;
  }

  fallbackUsers = [];
}

// Seed MongoDB if empty
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
          role: determineRoleByEmail(cleanEmail),
          org: determineOrgByEmail(cleanEmail, u.org),
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
  const properRole = determineRoleByEmail(cleanEmail);

  if (isDbConnected()) {
    const user = await User.findOne({ email: cleanEmail });
    if (user) {
      if (user.role !== properRole) {
        user.role = properRole;
        await user.save();
      }
    }
    return user;
  }

  if (isProduction()) {
    throw new Error('Database connection unavailable. MongoDB Atlas is mandatory in production.');
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const found = fallbackUsers.find((u) => u.email === cleanEmail);
  if (!found) return null;

  // Enforce role
  if (found.role !== properRole) {
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
    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id).select('-password');
    }
    if (!user) {
      user = await User.findOne({ _id: id }).select('-password').catch(() => null);
    }
    if (user) {
      const properRole = determineRoleByEmail(user.email);
      if (user.role !== properRole) {
        user.role = properRole;
        await user.save();
      }
      return user;
    }
    if (isProduction()) {
      return null;
    }
  }

  if (isProduction()) {
    return null;
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const found = fallbackUsers.find((u) => String(u._id) === String(id));
  if (!found) return null;

  const properRole = determineRoleByEmail(found.email);
  if (found.role !== properRole) {
    found.role = properRole;
    saveUsersFile(fallbackUsers);
  }

  const { password, ...safeUser } = found;
  return safeUser;
}

export async function createUser({ name, email, password, org }) {
  const cleanEmail = email.trim().toLowerCase();
  // Server strictly enforces role and trusted organization, ignoring client payloads
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

  if (isProduction()) {
    throw new Error('Database connection unavailable. MongoDB Atlas is mandatory in production.');
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
    const user = mongoose.Types.ObjectId.isValid(id)
      ? await User.findById(id)
      : await User.findOne({ _id: id }).catch(() => null);
    if (!user) return null;
    if (name && name.trim()) user.name = name.trim();
    if (org !== undefined) {
      user.org = determineOrgByEmail(user.email, org);
    }
    // Enforce role strictly
    user.role = determineRoleByEmail(user.email);
    await user.save();
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      org: user.org,
    };
  }

  if (isProduction()) {
    throw new Error('Database connection unavailable. MongoDB Atlas is mandatory in production.');
  }

  if (fallbackUsers.length === 0) {
    await initUserStore();
  }

  const user = fallbackUsers.find((u) => String(u._id) === String(id));
  if (!user) return null;

  if (name && name.trim()) user.name = name.trim();
  if (org !== undefined) {
    user.org = determineOrgByEmail(user.email, org);
  }
  user.role = determineRoleByEmail(user.email);
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
    const result = mongoose.Types.ObjectId.isValid(id)
      ? await User.findByIdAndDelete(id)
      : await User.findOneAndDelete({ _id: id }).catch(() => null);
    return !!result;
  }

  if (isProduction()) {
    throw new Error('Database connection unavailable. MongoDB Atlas is mandatory in production.');
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

  if (isProduction()) {
    throw new Error('Database connection unavailable. MongoDB Atlas is mandatory in production.');
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

initUserStore();
