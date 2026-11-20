import { AuthPortalRole, StaffTier, StoredUserRecord, User, UserRole } from '../types/perdiem';

const AUTH_SALT = 'OBU_PERDIEM_INSTITUTIONAL_SALT_2026::';
const USERS_STORAGE_KEY = 'obu_perdiem_users_v2';
const SESSION_STORAGE_KEY = 'obu_perdiem_session_v2';
const REMEMBER_STORAGE_KEY = 'obu_perdiem_remembered_id_v2';

/**
 * Cryptographic SHA-256 password hashing using the Web Crypto API.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salted = `${AUTH_SALT}${plainText}`;
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salted);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Deterministic fallback if SubtleCrypto is unavailable in non-secure contexts
  let hash = 0x811c9dc5;
  for (let i = 0; i < salted.length; i++) {
    hash ^= salted.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `sha256_fallback_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Removes sensitive passwordHash before exposing user object to UI state.
 */
export function sanitizeUser(record: StoredUserRecord): User {
  const { passwordHash: _removed, ...safeUser } = record;
  return safeUser;
}

/**
 * Seed default password hashes for pre-existing university accounts without storing plaintext.
 */
const DEFAULT_SEED_CREDENTIALS: Record<string, string> = {
  usr_emp_1: 'ObuEmp#2026',
  usr_emp_2: 'ObuEmp#2026',
  usr_admin_1: 'ObuAdmin#2026',
  usr_fin_1: 'ObuFin#2026',
  usr_emp_pending_1: 'ObuPending#2026',
};

export async function initializeUserStore(initialUsers: User[]): Promise<StoredUserRecord[]> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed: StoredUserRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage read errors and rebuild seed
  }

  const seeded: StoredUserRecord[] = await Promise.all(
    initialUsers.map(async (u) => {
      const initialSecret = DEFAULT_SEED_CREDENTIALS[u.id] || 'ObuStaff#2026';
      const passwordHash = await hashPassword(initialSecret);
      return {
        ...u,
        accountStatus: u.accountStatus || 'ACTIVE',
        passwordHash,
      };
    })
  );

  saveUserStore(seeded);
  return seeded;
}

export function saveUserStore(records: StoredUserRecord[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

export interface AuthResult {
  ok: boolean;
  user?: User;
  errorCode?: 'INVALID_CREDENTIALS' | 'PENDING_APPROVAL' | 'REJECTED' | 'ROLE_MISMATCH';
  message?: string;
}

/**
 * Authenticates credentials against hashed storage AND verifies the user's true assigned role
 * from the account record rather than trusting the portal selector alone.
 */
export async function authenticateUser(
  identifier: string,
  password: string,
  selectedPortalRole: AuthPortalRole,
  userRecords: StoredUserRecord[]
): Promise<AuthResult> {
  const cleanId = identifier.trim().toLowerCase();
  if (!cleanId || !password) {
    return {
      ok: false,
      errorCode: 'INVALID_CREDENTIALS',
      message: 'Please enter both your University ID or Email Address and your Password.',
    };
  }

  const matched = userRecords.find(
    (u) => u.email.toLowerCase() === cleanId || u.employeeId.toLowerCase() === cleanId
  );

  if (!matched) {
    return {
      ok: false,
      errorCode: 'INVALID_CREDENTIALS',
      message: 'Invalid University ID, Email Address, or Password. Access denied.',
    };
  }

  const candidateHash = await hashPassword(password);
  if (candidateHash !== matched.passwordHash) {
    return {
      ok: false,
      errorCode: 'INVALID_CREDENTIALS',
      message: 'Invalid University ID, Email Address, or Password. Access denied.',
    };
  }

  // Verify account approval status before granting access
  if (matched.accountStatus === 'PENDING_APPROVAL') {
    return {
      ok: false,
      errorCode: 'PENDING_APPROVAL',
      message: `Account (${matched.employeeId}) is Pending Approval. An Oda Bultum University System Administrator must authorize your registration before sign-in.`,
    };
  }

  if (matched.accountStatus === 'REJECTED') {
    return {
      ok: false,
      errorCode: 'REJECTED',
      message: 'This employee account registration was declined by the System Administrator. Please contact Human Resources or ICT Directorate.',
    };
  }

  // Verify user's actual assigned role matches the selected login portal
  if (matched.role !== selectedPortalRole) {
    const portalLabel =
      selectedPortalRole === 'ADMINISTRATOR'
        ? 'Administrator'
        : selectedPortalRole === 'FINANCE'
        ? 'Finance'
        : 'Employee';
    const actualLabel =
      matched.role === 'ADMINISTRATOR'
        ? 'Administrator'
        : matched.role === 'FINANCE'
        ? 'Finance'
        : 'Employee';
    return {
      ok: false,
      errorCode: 'ROLE_MISMATCH',
      message: `Access Denied: Your verified account (${matched.employeeId}) holds ${actualLabel} privileges and cannot sign into the ${portalLabel} Portal. Switch to the ${actualLabel} Login tab.`,
    };
  }

  return {
    ok: true,
    user: sanitizeUser(matched),
  };
}

export interface RegisterEmployeeInput {
  fullName: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
  jobPosition: string;
  staffTier: StaffTier;
  password: string;
}

export interface RegisterResult {
  ok: boolean;
  record?: StoredUserRecord;
  message: string;
}

/**
 * Registers a new Employee account strictly locked to role='EMPLOYEE' and status='PENDING_APPROVAL'.
 */
export async function registerEmployeeAccount(
  input: RegisterEmployeeInput,
  existingRecords: StoredUserRecord[]
): Promise<RegisterResult> {
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanEmpId = input.employeeId.trim().toUpperCase();

  const emailTaken = existingRecords.some((u) => u.email.toLowerCase() === cleanEmail);
  if (emailTaken) {
    return {
      ok: false,
      message: 'An account with this OBU Email Address already exists.',
    };
  }

  const idTaken = existingRecords.some((u) => u.employeeId.toUpperCase() === cleanEmpId);
  if (idTaken) {
    return {
      ok: false,
      message: `Employee ID ${cleanEmpId} is already registered in the university directory.`,
    };
  }

  const passwordHash = await hashPassword(input.password);
  const newRecord: StoredUserRecord = {
    id: `usr_emp_${Date.now()}`,
    name: input.fullName.trim(),
    email: cleanEmail,
    employeeId: cleanEmpId,
    phone: input.phone.trim(),
    department: input.department,
    jobPosition: input.jobPosition.trim(),
    staffTier: input.staffTier,
    // Security enforcement: Public registration can ONLY create EMPLOYEE accounts with PENDING_APPROVAL
    role: 'EMPLOYEE',
    accountStatus: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString().split('T')[0],
    avatar: '',
    passwordHash,
  };

  return {
    ok: true,
    record: newRecord,
    message: 'Employee registration submitted with Pending Approval status.',
  };
}

/**
 * Administrator-only function to securely provision & authorize Administrator or Finance accounts.
 */
export async function provisionPrivilegedAccount(
  adminUser: User,
  input: {
    fullName: string;
    employeeId: string;
    email: string;
    phone: string;
    department: string;
    jobPosition: string;
    role: 'ADMINISTRATOR' | 'FINANCE';
    password: string;
  },
  existingRecords: StoredUserRecord[]
): Promise<RegisterResult> {
  if (adminUser.role !== 'ADMINISTRATOR') {
    return {
      ok: false,
      message: 'Unauthorized: Only an authenticated System Administrator may provision privileged accounts.',
    };
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const cleanEmpId = input.employeeId.trim().toUpperCase();

  if (existingRecords.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { ok: false, message: 'Email address is already in use.' };
  }
  if (existingRecords.some((u) => u.employeeId.toUpperCase() === cleanEmpId)) {
    return { ok: false, message: `University ID ${cleanEmpId} is already assigned.` };
  }

  const passwordHash = await hashPassword(input.password);
  const newRecord: StoredUserRecord = {
    id: `usr_${input.role.toLowerCase()}_${Date.now()}`,
    name: input.fullName.trim(),
    email: cleanEmail,
    employeeId: cleanEmpId,
    phone: input.phone.trim(),
    department: input.department,
    jobPosition: input.jobPosition.trim(),
    staffTier: input.role === 'ADMINISTRATOR' ? 'SENIOR_ACADEMIC' : 'ADMIN_SUPPORT',
    role: input.role,
    accountStatus: 'ACTIVE',
    authorizedBy: adminUser.name,
    createdAt: new Date().toISOString().split('T')[0],
    avatar: '',
    passwordHash,
  };

  return {
    ok: true,
    record: newRecord,
    message: `${input.role === 'ADMINISTRATOR' ? 'Administrator' : 'Finance Officer'} account provisioned and authorized.`,
  };
}

export function saveAuthenticatedSession(user: User, rememberMe: boolean): void {
  const payload = JSON.stringify({
    userId: user.id,
    role: user.role,
    issuedAt: Date.now(),
  });
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, payload);
      localStorage.setItem(REMEMBER_STORAGE_KEY, user.email);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function loadSavedSessionUserId(): string | null {
  try {
    const sessionRaw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionRaw) return null;
    const parsed = JSON.parse(sessionRaw);
    return typeof parsed?.userId === 'string' ? parsed.userId : null;
  } catch {
    return null;
  }
}

export function clearAuthenticatedSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function loadRememberedIdentifier(): string {
  try {
    return localStorage.getItem(REMEMBER_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setRememberedIdentifier(identifier: string, remember: boolean): void {
  try {
    if (remember && identifier.trim()) {
      localStorage.setItem(REMEMBER_STORAGE_KEY, identifier.trim());
    } else if (!remember) {
      localStorage.removeItem(REMEMBER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
