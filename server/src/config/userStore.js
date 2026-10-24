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
 * - Anyone with '@vitap' in their email is ALWAYS Auditor
 * - Remaining accounts are Viewers
 */
export function determineRoleByEmail(email) {
  if (!email || typeof email !== 'string') return 'Viewer';
  const clean = email.trim().toLowerCase();
  if (clean === 'hemasrichowdary@gmail.com') {
    return 'Admin';
  }
  if (clean.includes('@vitap') || clean.includes('.vitap.')) {
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
  if (clean === 'hemasrichowdary@gmail.com') {
    return 'VIT-AP University / EvidenceLoop Principal';
  }
  if (clean.includes('@vitap') || clean.includes('.vitap.')) {
    return 'VIT-AP University';
  }
  return 'Compliance Observer Organization';
}

// Initial seed users with their default credentials and role enforcement
export const DEFAULT_USERS = [
  {
    _id: 'usr_admin_hema',
    name: 'Hema Sri Chowdary',
    email: 'hemasrichowdary@gmail.com',
    passwordRaw: 'AdminPassword123!',
    role: 'Admin',
    org: 'VIT-AP University / EvidenceLoop Principal',
    mfaEnabled: true,
  },
  {
    _id: 'usr_auditor_vitap',
    name: 'Lead Internal Auditor (VIT-AP)',
    email: 'auditor@vitap.ac.in',
    passwordRaw: 'AuditorPassword123!',
    role: 'Auditor',
    org: 'VIT-AP University',
    mfaEnabled: true,
  },
  {
    _id: 'usr_viewer_003',
    name: 'Elena Rostova (Compliance Observer)',
    email: 'viewer@evidenceloop.com',
    passwordRaw: 'ViewerPassword123!',
    role: 'Viewer',
    org: 'Global Compliance Institute',
    mfaEnabled: true,
  },
  {
    _id: 'usr_admin_legacy',
    name: 'Sarah Jenkins (Chief Compliance Officer)',
    email: 'admin@evidenceloop.com',
    passwordRaw: 'AdminPassword123!',
    role: 'Admin',
    org: 'EvidenceLoop Enterprise Audit',
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

    // Ensure default seeded accounts (like hemasrichowdary@gmail.com) exist in fallback
    let needsSave = false;
    for (const def of DEFAULT_USERS) {
      const exists = fallbackUsers.find((u) => u.email === def.email.toLowerCase());
      if (!exists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(def.passwordRaw, salt);
        fallbackUsers.push({
          _id: def._id,
          name: def.name,
          email: def.email.toLowerCase(),
          password: hashedPassword,
          role: def.role,
          org: def.org,
          mfaEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        needsSave = true;
      }
    }

    // Enforce email-to-role policy on existing users
    for (const u of fallbackUsers) {
      const properRole = determineRoleByEmail(u.email);
      if (u.email === 'admin@evidenceloop.com') {
        // preserve legacy admin
      } else if (u.role !== properRole) {
        u.role = properRole;
        needsSave = true;
      }
      if (!u.org) {
        u.org = determineOrgByEmail(u.email);
        needsSave = true;
      }
    }

    if (needsSave) {
      saveUsersFile(fallbackUsers);
    }
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
        org: u.org || determineOrgByEmail(u.email),
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
      } else {
        // Enforce role rule
        const properRole = determineRoleByEmail(cleanEmail);
        if (cleanEmail !== 'admin@evidenceloop.com' && existing.role !== properRole) {
          existing.role = properRole;
          await existing.save();
        }
      }
    }
    console.log('[Database] Verified compliance users in MongoDB.');
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

// Immediately initialize fallback store in background
initUserStore();
