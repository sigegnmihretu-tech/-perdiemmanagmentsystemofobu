import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  AccountInvitation,
  ApprovalAction,
  PaymentDetails,
  PerDiemBreakdown,
  StaffTier,
  StoredUserRecord,
  TravelRequest,
  User,
  UserRole,
} from '../types/perdiem';

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const VALID_EMP_ID_REGEX = /^[a-zA-Z0-9-]+$/;

function trimMax(value: string | undefined | null, maxLen: number): string {
  return (value ?? '').trim().slice(0, maxLen);
}

function normalizeEmployeeId(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '-');
  if (cleaned.length >= 3 && VALID_EMP_ID_REGEX.test(cleaned)) {
    return cleaned.slice(0, 32);
  }
  return `OBU-EMP-${Date.now().toString().slice(-6)}`;
}

function safeAvatarUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return undefined;
  if (trimmed.startsWith('data:')) return undefined;
  return trimmed;
}

function formatFirestoreDate(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    return val;
  }
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timestampMillis(val: unknown): number {
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function mapStaffDocToRecord(docId: string, data: Record<string, unknown>): StoredUserRecord {
  return {
    id: docId,
    uid: typeof data.uid === 'string' ? data.uid : docId,
    name: String(data.name || 'OBU Staff'),
    email: String(data.email || ''),
    employeeId: String(data.employeeId || 'OBU-STAFF'),
    phone: typeof data.phone === 'string' ? data.phone : '',
    department: String(data.department || 'Oda Bultum University'),
    jobPosition: typeof data.jobPosition === 'string' ? data.jobPosition : 'Staff Member',
    staffTier: (data.staffTier as StaffTier) || 'LECTURER_RESEARCHER',
    role: (data.role as UserRole) || 'EMPLOYEE',
    accountStatus: (data.accountStatus as StoredUserRecord['accountStatus']) || 'PENDING_APPROVAL',
    authorizedBy: typeof data.authorizedBy === 'string' ? data.authorizedBy : undefined,
    avatar: typeof data.avatar === 'string' ? data.avatar : '',
    passwordHash: typeof data.passwordHash === 'string' ? data.passwordHash : '',
    createdAt: formatFirestoreDate(data.createdAt),
  };
}

function mapInvitationDoc(docId: string, data: Record<string, unknown>): AccountInvitation {
  return {
    email: String(data.email || docId),
    name: String(data.name || ''),
    employeeId: String(data.employeeId || ''),
    phone: String(data.phone || ''),
    department: String(data.department || ''),
    jobPosition: String(data.jobPosition || ''),
    role: data.role === 'ADMINISTRATOR' ? 'ADMINISTRATOR' : 'FINANCE',
    passwordHash: typeof data.passwordHash === 'string' ? data.passwordHash : '',
    status:
      data.status === 'CLAIMED' || data.status === 'REVOKED' ? data.status : 'ACTIVE',
    authorizedBy: String(data.authorizedBy || 'System Administrator'),
    createdAt: formatFirestoreDate(data.createdAt),
  };
}

function mapTravelDoc(docId: string, data: Record<string, unknown>): TravelRequest {
  return {
    id: typeof data.id === 'string' ? data.id : docId,
    trackingCode: String(data.trackingCode || docId),
    employeeUid: typeof data.employeeUid === 'string' ? data.employeeUid : '',
    employeeId: String(data.employeeId || ''),
    employeeName: String(data.employeeName || ''),
    employeeRole: String(data.employeeRole || ''),
    department: String(data.department || ''),
    destination: String(data.destination || ''),
    destinationTier: (data.destinationTier as TravelRequest['destinationTier']) || 'CAPITAL',
    purpose: String(data.purpose || ''),
    departureDate: String(data.departureDate || ''),
    returnDate: String(data.returnDate || ''),
    daysCount: typeof data.daysCount === 'number' ? data.daysCount : 1,
    transportMode: (data.transportMode as TravelRequest['transportMode']) || 'PUBLIC_TRANSPORT',
    breakdown: data.breakdown as PerDiemBreakdown,
    status: (data.status as TravelRequest['status']) || 'SUBMITTED_FOR_APPROVAL',
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    submittedAt: formatFirestoreDate(data.submittedAt),
    createdAt: formatFirestoreDate(data.createdAt),
    approval: data.approval as ApprovalAction | undefined,
    payment: data.payment as PaymentDetails | undefined,
  };
}

export async function getStaffAccountByUid(uid: string): Promise<StoredUserRecord | null> {
  if (!VALID_ID_REGEX.test(uid)) return null;
  const path = `staff_accounts/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'staff_accounts', uid));
    if (!snap.exists()) return null;
    return mapStaffDocToRecord(snap.id, snap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function ensureBootstrappedAdminProfile(
  firebaseUser: FirebaseUser
): Promise<StoredUserRecord | null> {
  const email = (firebaseUser.email || '').toLowerCase();
  if (!firebaseUser.emailVerified || email !== BOOTSTRAPPED_ADMIN_EMAIL) {
    return null;
  }

  const uid = firebaseUser.uid;
  const staffRef = doc(db, 'staff_accounts', uid);
  const adminRoleRef = doc(db, 'admins', uid);

  try {
    const existingSnap = await getDoc(staffRef);
    const adminGrantSnap = await getDoc(adminRoleRef);

    if (!adminGrantSnap.exists()) {
      await setDoc(adminRoleRef, {
        uid,
        email,
        grantedBy: 'SYSTEM_BOOTSTRAP',
        createdAt: serverTimestamp(),
      });
    }

    if (!existingSnap.exists()) {
      const avatar = safeAvatarUrl(firebaseUser.photoURL);
      const profilePayload: Record<string, unknown> = {
        uid,
        name: trimMax(firebaseUser.displayName || 'OBU System Administrator', 120),
        email: trimMax(email, 160),
        employeeId: 'OBU-EXEC-0001',
        phone: '+251 25 651 0040',
        department: 'Office of Academic & Research Vice President',
        jobPosition: 'System Administrator',
        staffTier: 'SENIOR_ACADEMIC',
        role: 'ADMINISTRATOR',
        accountStatus: 'ACTIVE',
        authorizedBy: 'OBU System Governance',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (avatar) {
        profilePayload.avatar = avatar;
      }
      await setDoc(staffRef, profilePayload);
      const created = await getDoc(staffRef);
      if (created.exists()) {
        return mapStaffDocToRecord(created.id, created.data());
      }
    }

    if (existingSnap.exists()) {
      return mapStaffDocToRecord(existingSnap.id, existingSnap.data());
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `staff_accounts/${uid}`);
  }
}

export async function claimInvitationIfExists(
  firebaseUser: FirebaseUser
): Promise<StoredUserRecord | null> {
  const email = (firebaseUser.email || '').trim().toLowerCase();
  if (!email || !firebaseUser.emailVerified) return null;

  const invitePath = `account_invitations/${email}`;
  try {
    const inviteRef = doc(db, 'account_invitations', email);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) return null;

    const invite = mapInvitationDoc(inviteSnap.id, inviteSnap.data());
    if (invite.status !== 'ACTIVE') return null;

    const uid = firebaseUser.uid;
    const staffRef = doc(db, 'staff_accounts', uid);
    const roleCollection = invite.role === 'ADMINISTRATOR' ? 'admins' : 'finance_officers';
    const roleGrantRef = doc(db, roleCollection, uid);

    const avatar = safeAvatarUrl(firebaseUser.photoURL);
    const staffPayload: Record<string, unknown> = {
      uid,
      name: trimMax(invite.name || firebaseUser.displayName || 'OBU Officer', 120),
      email: trimMax(email, 160),
      employeeId: normalizeEmployeeId(invite.employeeId),
      phone: trimMax(invite.phone || '+251 911 000 000', 32),
      department: trimMax(invite.department || 'Oda Bultum University', 140),
      jobPosition: trimMax(invite.jobPosition || 'Authorized Officer', 120),
      staffTier: invite.role === 'ADMINISTRATOR' ? 'SENIOR_ACADEMIC' : 'ADMIN_SUPPORT',
      role: invite.role,
      accountStatus: 'ACTIVE',
      authorizedBy: trimMax(invite.authorizedBy || 'System Administrator', 120),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (invite.passwordHash) {
      staffPayload.passwordHash = trimMax(invite.passwordHash, 128);
    }
    if (avatar) {
      staffPayload.avatar = avatar;
    }

    const batch = writeBatch(db);
    batch.set(staffRef, staffPayload);
    batch.set(roleGrantRef, {
      uid,
      email: trimMax(email, 160),
      grantedBy: trimMax(invite.authorizedBy || 'System Administrator', 120),
      createdAt: serverTimestamp(),
    });
    batch.update(inviteRef, {
      status: 'CLAIMED',
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    const createdSnap = await getDoc(staffRef);
    return createdSnap.exists() ? mapStaffDocToRecord(createdSnap.id, createdSnap.data()) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, invitePath);
  }
}

export interface CloudEmployeeRegistrationInput {
  fullName: string;
  employeeId: string;
  phone: string;
  department: string;
  jobPosition: string;
  staffTier: StaffTier;
  passwordHash: string;
}

export async function registerCloudEmployee(
  firebaseUser: FirebaseUser,
  input: CloudEmployeeRegistrationInput
): Promise<{ ok: boolean; record?: StoredUserRecord; message: string }> {
  if (!firebaseUser.emailVerified || !firebaseUser.email) {
    return {
      ok: false,
      message: 'A verified Google email address is required for cloud registration.',
    };
  }

  const uid = firebaseUser.uid;
  const email = firebaseUser.email.trim().toLowerCase();
  const path = `staff_accounts/${uid}`;

  try {
    const existingSnap = await getDoc(doc(db, 'staff_accounts', uid));
    if (existingSnap.exists()) {
      const existing = mapStaffDocToRecord(existingSnap.id, existingSnap.data());
      if (existing.accountStatus === 'PENDING_APPROVAL') {
        return {
          ok: true,
          record: existing,
          message: 'Your registration is already recorded and awaiting Administrator approval.',
        };
      }
      if (existing.accountStatus === 'ACTIVE') {
        return {
          ok: false,
          message: `An active account (${existing.employeeId}) is already linked to ${email}. Please return to the Login page.`,
        };
      }
      return {
        ok: false,
        message: 'This Google account registration was previously declined. Contact OBU Administration.',
      };
    }

    const avatar = safeAvatarUrl(firebaseUser.photoURL);
    const payload: Record<string, unknown> = {
      uid,
      name: trimMax(input.fullName, 120),
      email: trimMax(email, 160),
      employeeId: normalizeEmployeeId(input.employeeId),
      phone: trimMax(input.phone, 32),
      department: trimMax(input.department, 140),
      jobPosition: trimMax(input.jobPosition, 120),
      staffTier: input.staffTier,
      role: 'EMPLOYEE',
      accountStatus: 'PENDING_APPROVAL',
      passwordHash: trimMax(input.passwordHash, 128),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (avatar) {
      payload.avatar = avatar;
    }

    await setDoc(doc(db, 'staff_accounts', uid), payload);
    const createdSnap = await getDoc(doc(db, 'staff_accounts', uid));
    const record = createdSnap.exists()
      ? mapStaffDocToRecord(createdSnap.id, createdSnap.data())
      : mapStaffDocToRecord(uid, payload);

    return {
      ok: true,
      record,
      message: 'Employee registration saved to cloud and sent to Administrator Console for approval.',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function authorizeCloudEmployee(
  targetUid: string,
  decision: 'ACTIVE' | 'REJECTED',
  adminUser: User
): Promise<void> {
  const path = `staff_accounts/${targetUid}`;
  try {
    await updateDoc(doc(db, 'staff_accounts', targetUid), {
      accountStatus: decision,
      authorizedBy: trimMax(adminUser.name, 120),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function provisionCloudInvitation(
  adminUser: User,
  input: {
    fullName: string;
    employeeId: string;
    email: string;
    phone: string;
    department: string;
    jobPosition: string;
    role: 'ADMINISTRATOR' | 'FINANCE';
    passwordHash: string;
  }
): Promise<{ ok: boolean; message: string }> {
  const cleanEmail = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, message: 'Please enter a valid institutional or Google email address.' };
  }

  const path = `account_invitations/${cleanEmail}`;
  try {
    await setDoc(doc(db, 'account_invitations', cleanEmail), {
      email: trimMax(cleanEmail, 160),
      name: trimMax(input.fullName, 120),
      employeeId: normalizeEmployeeId(input.employeeId),
      phone: trimMax(input.phone || '+251 911 000 000', 32),
      department: trimMax(input.department || 'Oda Bultum University', 140),
      jobPosition: trimMax(input.jobPosition || 'Authorized Officer', 120),
      role: input.role,
      passwordHash: trimMax(input.passwordHash, 128),
      status: 'ACTIVE',
      authorizedBy: trimMax(adminUser.name, 120),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      ok: true,
      message: `${input.role === 'ADMINISTRATOR' ? 'Administrator' : 'Finance Officer'} authorization issued for ${cleanEmail}. They may now sign in with Google on the ${input.role === 'ADMINISTRATOR' ? 'Administrator' : 'Finance'} Login tab.`,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateCloudPasswordHash(
  uid: string,
  newPasswordHash: string
): Promise<void> {
  const path = `staff_accounts/${uid}`;
  try {
    await updateDoc(doc(db, 'staff_accounts', uid), {
      passwordHash: trimMax(newPasswordHash, 128),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitCloudTravelRequest(
  firebaseUser: FirebaseUser,
  currentUser: User,
  reqData: Partial<TravelRequest>
): Promise<TravelRequest> {
  const reqId = `req_${Date.now()}`;
  const trackingCode = `OBU-TR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const submittedAtStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const payload: Record<string, unknown> = {
    id: reqId,
    trackingCode,
    employeeUid: firebaseUser.uid,
    employeeId: trimMax(currentUser.employeeId || currentUser.id, 40),
    employeeName: trimMax(currentUser.name, 120),
    employeeRole: trimMax(
      currentUser.jobPosition || currentUser.staffTier.replace(/_/g, ' '),
      120
    ),
    department: trimMax(currentUser.department, 140),
    destination: trimMax(reqData.destination || 'Addis Ababa', 200),
    destinationTier: reqData.destinationTier || 'CAPITAL',
    purpose: trimMax(reqData.purpose || 'Official university travel', 600),
    departureDate: trimMax(reqData.departureDate || '2026-11-20', 20),
    returnDate: trimMax(reqData.returnDate || '2026-11-24', 20),
    daysCount: Math.max(1, Math.min(365, Number(reqData.daysCount || 1))),
    transportMode: reqData.transportMode || 'PUBLIC_TRANSPORT',
    breakdown: reqData.breakdown,
    status: 'SUBMITTED_FOR_APPROVAL',
    submittedAt: trimMax(submittedAtStr, 60),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (reqData.notes && reqData.notes.trim().length > 0) {
    payload.notes = trimMax(reqData.notes, 500);
  }

  const path = `travel_requests/${reqId}`;
  try {
    await setDoc(doc(db, 'travel_requests', reqId), payload);
    return {
      ...(payload as unknown as TravelRequest),
      createdAt: submittedAtStr,
      submittedAt: submittedAtStr,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function reviewCloudTravelRequest(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  adminUser: User,
  remarks: string
): Promise<void> {
  const path = `travel_requests/${requestId}`;
  const reviewedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  try {
    await updateDoc(doc(db, 'travel_requests', requestId), {
      status: decision === 'APPROVED' ? 'APPROVED_BY_ADMIN' : 'REJECTED_BY_ADMIN',
      approval: {
        reviewedBy: trimMax(`${adminUser.name} (${adminUser.jobPosition || 'Administrator'})`, 140),
        reviewedAt: trimMax(reviewedAt, 60),
        decision,
        remarks: trimMax(remarks || (decision === 'APPROVED' ? 'Approved.' : 'Returned for revision.'), 600),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function processCloudPayment(
  requestId: string,
  financeUser: User,
  paymentData: Partial<PaymentDetails>,
  defaultAmount: number
): Promise<string> {
  const path = `travel_requests/${requestId}`;
  const voucherNumber = trimMax(
    paymentData.voucherNumber || `OBU-FIN-PV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    60
  );
  const processedAt = trimMax(
    paymentData.processedAt ||
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    60
  );

  try {
    await updateDoc(doc(db, 'travel_requests', requestId), {
      status: 'COMPLETED',
      payment: {
        voucherNumber,
        processedBy: trimMax(
          paymentData.processedBy || `${financeUser.name} (Finance Officer)`,
          140
        ),
        processedAt,
        paymentMethod: paymentData.paymentMethod || 'CBE_BANK_TRANSFER',
        referenceNumber: trimMax(paymentData.referenceNumber || 'CBE-FT-882910', 80),
        disbursedAmount: Number(paymentData.disbursedAmount ?? defaultAmount),
        currency: 'ETB',
        paymentStatus: 'PAID',
      },
      updatedAt: serverTimestamp(),
    });
    return voucherNumber;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeMyStaffAccount(
  uid: string,
  onData: (record: StoredUserRecord | null) => void
): Unsubscribe {
  const path = `staff_accounts/${uid}`;
  return onSnapshot(
    doc(db, 'staff_accounts', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapStaffDocToRecord(snap.id, snap.data()));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeAllStaffAccounts(
  onData: (records: StoredUserRecord[]) => void
): Unsubscribe {
  const path = 'staff_accounts';
  return onSnapshot(
    collection(db, 'staff_accounts'),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({
          record: mapStaffDocToRecord(d.id, d.data()),
          sortTime: timestampMillis(d.data().createdAt),
        }))
        .sort((a, b) => b.sortTime - a.sortTime)
        .map((item) => item.record);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllInvitations(
  onData: (invitations: AccountInvitation[]) => void
): Unsubscribe {
  const path = 'account_invitations';
  return onSnapshot(
    collection(db, 'account_invitations'),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({
          invite: mapInvitationDoc(d.id, d.data()),
          sortTime: timestampMillis(d.data().createdAt),
        }))
        .sort((a, b) => b.sortTime - a.sortTime)
        .map((item) => item.invite);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeTravelRequests(
  role: UserRole,
  uid: string,
  onData: (requests: TravelRequest[]) => void
): Unsubscribe {
  const path = 'travel_requests';
  const targetQuery =
    role === 'EMPLOYEE'
      ? query(collection(db, 'travel_requests'), where('employeeUid', '==', uid))
      : collection(db, 'travel_requests');

  return onSnapshot(
    targetQuery,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({
          req: mapTravelDoc(d.id, d.data()),
          sortTime: timestampMillis(d.data().createdAt),
        }))
        .sort((a, b) => b.sortTime - a.sortTime)
        .map((item) => item.req);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
