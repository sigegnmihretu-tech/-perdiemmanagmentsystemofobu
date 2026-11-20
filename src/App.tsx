/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, BOOTSTRAPPED_ADMIN_EMAIL } from './firebase';
import {
  AccountInvitation,
  AuthPortalRole,
  PaymentDetails,
  StaffTier,
  StoredUserRecord,
  TravelRequest,
  User,
} from './types/perdiem';
import {
  clearAuthenticatedSession,
  hashPassword,
  loadSavedSessionUserId,
  sanitizeUser,
  saveAuthenticatedSession,
} from './utils/authSecurity';
import {
  authorizeCloudEmployee,
  claimInvitationIfExists,
  ensureBootstrappedAdminProfile,
  getStaffAccountByUid,
  processCloudPayment,
  provisionCloudInvitation,
  registerCloudEmployee,
  reviewCloudTravelRequest,
  subscribeAllInvitations,
  subscribeAllStaffAccounts,
  subscribeMyStaffAccount,
  subscribeTravelRequests,
  submitCloudTravelRequest,
  updateCloudPasswordHash,
} from './services/firestoreService';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';
import { CloudLoginResult, LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { Header } from './components/Header';
import { EmployeePortal } from './components/EmployeePortal';
import { AdminPortal } from './components/AdminPortal';
import { FinancePortal } from './components/FinancePortal';
import { ReportVoucherView } from './components/ReportVoucherView';
import { CheckCircle } from 'lucide-react';

type UnauthenticatedRoute = 'welcome' | 'login' | 'register';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [userRecords, setUserRecords] = useState<StoredUserRecord[]>([]);
  const [invitations, setInvitations] = useState<AccountInvitation[]>([]);
  const [requests, setRequests] = useState<TravelRequest[]>([]);

  const [authRoute, setAuthRoute] = useState<UnauthenticatedRoute>('welcome');
  const [preferredLoginRole, setPreferredLoginRole] = useState<AuthPortalRole>('EMPLOYEE');

  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'voucher'>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Watch Firebase Auth state and restore active verified cloud session when applicable
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser || !fbUser.emailVerified) {
        setCurrentUser(null);
        setUserRecords([]);
        setInvitations([]);
        setRequests([]);
        setIsAuthReady(true);
        return;
      }

      const savedUid = loadSavedSessionUserId();
      if (savedUid && savedUid === fbUser.uid) {
        try {
          let record = await getStaffAccountByUid(fbUser.uid);
          if (!record && fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
            record = await ensureBootstrappedAdminProfile(fbUser);
          }
          if (!record) {
            record = await claimInvitationIfExists(fbUser);
          }
          if (record && record.accountStatus === 'ACTIVE') {
            setCurrentUser(sanitizeUser(record));
          } else {
            clearAuthenticatedSession();
            setCurrentUser(null);
          }
        } catch {
          clearAuthenticatedSession();
          setCurrentUser(null);
        }
      }

      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time Firestore collections ONLY when user is authenticated & active
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified || !currentUser) {
      return;
    }

    const uid = firebaseUser.uid;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribeMyStaffAccount(uid, (updatedRecord) => {
        if (!updatedRecord || updatedRecord.accountStatus !== 'ACTIVE') {
          clearAuthenticatedSession();
          setCurrentUser(null);
          return;
        }
        setCurrentUser(sanitizeUser(updatedRecord));
      })
    );

    unsubs.push(
      subscribeTravelRequests(currentUser.role, uid, (cloudRequests) => {
        setRequests(cloudRequests);
        setSelectedRequest((prev) => {
          if (prev) {
            const refreshed = cloudRequests.find((r) => r.id === prev.id);
            if (refreshed) return refreshed;
          }
          return cloudRequests[0] || null;
        });
      })
    );

    if (currentUser.role === 'ADMINISTRATOR') {
      unsubs.push(
        subscribeAllStaffAccounts((allAccounts) => {
          setUserRecords(allAccounts);
        })
      );
      unsubs.push(
        subscribeAllInvitations((allInvites) => {
          setInvitations(allInvites);
        })
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [firebaseUser, currentUser?.uid, currentUser?.role]);

  // Resolve Google Login against Firestore role, approval status, and invitations
  const resolveCloudPortalSignIn = async (
    fbUser: FirebaseUser,
    selectedPortal: AuthPortalRole,
    rememberMe: boolean,
    credentialCheck?: { identifier: string; password: string }
  ): Promise<CloudLoginResult> => {
    const email = (fbUser.email || '').trim().toLowerCase();
    if (!fbUser.emailVerified || !email) {
      return {
        ok: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Your Google account email must be verified before signing in.',
      };
    }

    let record: StoredUserRecord | null = null;
    if (email === BOOTSTRAPPED_ADMIN_EMAIL && selectedPortal === 'ADMINISTRATOR') {
      record = await ensureBootstrappedAdminProfile(fbUser);
    } else {
      record = await getStaffAccountByUid(fbUser.uid);
      if (!record) {
        record = await claimInvitationIfExists(fbUser);
      }
    }

    if (!record) {
      if (selectedPortal === 'EMPLOYEE') {
        return {
          ok: false,
          errorCode: 'NOT_FOUND',
          message: `No employee account found for ${email}. Please click "Create Employee Account" below to register.`,
        };
      }
      return {
        ok: false,
        errorCode: 'NOT_FOUND',
        message: `No ${selectedPortal === 'ADMINISTRATOR' ? 'Administrator' : 'Finance Officer'} authorization exists for ${email}. System Administrators must authorize this email first.`,
      };
    }

    if (credentialCheck) {
      const cleanId = credentialCheck.identifier.trim().toLowerCase();
      const matchesIdentity =
        record.email.toLowerCase() === cleanId ||
        record.employeeId.toLowerCase() === cleanId;
      if (!matchesIdentity) {
        return {
          ok: false,
          errorCode: 'INVALID_CREDENTIALS',
          message: `Verified Google account (${record.email}) does not match University ID or Email "${credentialCheck.identifier}".`,
        };
      }

      if (record.passwordHash) {
        const candidateHash = await hashPassword(credentialCheck.password);
        if (candidateHash !== record.passwordHash) {
          return {
            ok: false,
            errorCode: 'INVALID_CREDENTIALS',
            message: 'Invalid portal password for this account. Access denied.',
          };
        }
      }
    }

    if (record.accountStatus === 'PENDING_APPROVAL') {
      return {
        ok: false,
        errorCode: 'PENDING_APPROVAL',
        message: `Account (${record.employeeId}) is Pending Approval. An Oda Bultum University System Administrator must authorize your registration before sign-in.`,
      };
    }

    if (record.accountStatus === 'REJECTED') {
      return {
        ok: false,
        errorCode: 'REJECTED',
        message:
          'This employee registration was declined by the System Administrator. Please contact Human Resources or ICT Directorate.',
      };
    }

    if (record.role !== selectedPortal) {
      const portalLabel =
        selectedPortal === 'ADMINISTRATOR'
          ? 'Administrator'
          : selectedPortal === 'FINANCE'
          ? 'Finance'
          : 'Employee';
      const actualLabel =
        record.role === 'ADMINISTRATOR'
          ? 'Administrator'
          : record.role === 'FINANCE'
          ? 'Finance'
          : 'Employee';
      return {
        ok: false,
        errorCode: 'ROLE_MISMATCH',
        message: `Access Denied: Your verified account (${record.employeeId}) holds ${actualLabel} privileges and cannot sign into the ${portalLabel} Portal. Switch to the ${actualLabel} tab.`,
      };
    }

    const safeUser = sanitizeUser(record);
    saveAuthenticatedSession(safeUser, rememberMe);
    setFirebaseUser(fbUser);
    setCurrentUser(safeUser);
    setActiveTab('dashboard');
    showToast(`Welcome, ${safeUser.name}. Authenticated to ${safeUser.role} Portal.`);
    return { ok: true };
  };

  const handleGooglePortalSignIn = (
    fbUser: FirebaseUser,
    selectedPortal: AuthPortalRole,
    rememberMe: boolean
  ) => resolveCloudPortalSignIn(fbUser, selectedPortal, rememberMe);

  const handleCredentialPortalSignIn = (
    fbUser: FirebaseUser,
    identifier: string,
    password: string,
    selectedPortal: AuthPortalRole,
    rememberMe: boolean
  ) =>
    resolveCloudPortalSignIn(fbUser, selectedPortal, rememberMe, {
      identifier,
      password,
    });

  const handleCloudResetPassword = async (
    fbUser: FirebaseUser,
    emailInput: string,
    employeeIdInput: string,
    newPlainPassword: string
  ): Promise<{ ok: boolean; message: string }> => {
    const existing = await getStaffAccountByUid(fbUser.uid);
    if (!existing) {
      return {
        ok: false,
        message: `No registered cloud profile matches ${fbUser.email || 'this Google account'}.`,
      };
    }

    if (
      existing.email.toLowerCase() !== emailInput.trim().toLowerCase() ||
      existing.employeeId.toUpperCase() !== employeeIdInput.trim().toUpperCase()
    ) {
      return {
        ok: false,
        message:
          'Entered Email Address and Employee ID do not match your verified cloud profile.',
      };
    }

    const newHash = await hashPassword(newPlainPassword);
    await updateCloudPasswordHash(fbUser.uid, newHash);
    return {
      ok: true,
      message: `Password updated securely in cloud for ${existing.name} (${existing.employeeId}). You may now sign in.`,
    };
  };

  const handleCloudRegister = async (
    fbUser: FirebaseUser,
    input: {
      fullName: string;
      employeeId: string;
      phone: string;
      department: string;
      jobPosition: string;
      staffTier: StaffTier;
      password: string;
    }
  ) => {
    const passwordHash = await hashPassword(input.password);
    const res = await registerCloudEmployee(fbUser, {
      fullName: input.fullName,
      employeeId: input.employeeId,
      phone: input.phone,
      department: input.department,
      jobPosition: input.jobPosition,
      staffTier: input.staffTier,
      passwordHash,
    });

    if (res.ok && res.record) {
      showToast(
        `Registration saved for ${res.record.name}. Pending Administrator authorization.`
      );
    }
    return res;
  };

  const handleLogout = async () => {
    clearAuthenticatedSession();
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut failure
    }
    setCurrentUser(null);
    setUserRecords([]);
    setInvitations([]);
    setRequests([]);
    setSelectedRequest(null);
    setIsCreateModalOpen(false);
    setAuthRoute('login');
    showToast('You have been securely logged out.');
  };

  // Admin Account Authorizations (Pending Employees + Admin/Finance Provisioning)
  const handleAuthorizeEmployee = async (userId: string, decision: 'ACTIVE' | 'REJECTED') => {
    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') return;
    await authorizeCloudEmployee(userId, decision, currentUser);
    const target = userRecords.find((u) => u.id === userId);
    showToast(
      decision === 'ACTIVE'
        ? `Employee account ${target?.name || ''} (${target?.employeeId || ''}) authorized for portal access.`
        : `Employee registration ${target?.name || ''} was declined.`
    );
  };

  const handleProvisionPrivilegedUser = async (input: {
    fullName: string;
    employeeId: string;
    email: string;
    phone: string;
    department: string;
    jobPosition: string;
    role: 'ADMINISTRATOR' | 'FINANCE';
    password: string;
  }) => {
    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') {
      return { ok: false, message: 'Unauthorized action.' };
    }
    const passwordHash = await hashPassword(input.password);
    const res = await provisionCloudInvitation(currentUser, {
      ...input,
      passwordHash,
    });
    if (res.ok) {
      showToast(res.message);
    }
    return res;
  };

  // Submit Travel Request -> Firestore
  const handleSubmitRequest = async (newReqData: Partial<TravelRequest>) => {
    if (!currentUser || currentUser.role !== 'EMPLOYEE' || !firebaseUser) return;
    const created = await submitCloudTravelRequest(firebaseUser, currentUser, newReqData);
    setSelectedRequest(created);
    showToast(
      `Claim ${created.trackingCode} submitted for Administrator Review! (Per Diem: ${created.breakdown.totalPerDiem.toLocaleString()} ETB)`
    );
  };

  // Administrator Review -> Approve or Reject
  const handleApproveRequest = async (requestId: string, remarks: string) => {
    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') return;
    await reviewCloudTravelRequest(requestId, 'APPROVED', currentUser, remarks);
    showToast('Request approved! Forwarded downstream to Finance Directorate for payment.');
  };

  const handleRejectRequest = async (requestId: string, remarks: string) => {
    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') return;
    await reviewCloudTravelRequest(requestId, 'REJECTED', currentUser, remarks);
    showToast('Request rejected. Returned back to Employee with feedback.');
  };

  // Finance -> Process Payment
  const handleProcessPayment = async (
    requestId: string,
    paymentData: Partial<PaymentDetails>
  ) => {
    if (!currentUser || currentUser.role !== 'FINANCE') return;
    const targetReq = requests.find((r) => r.id === requestId);
    const voucherNo = await processCloudPayment(
      requestId,
      currentUser,
      paymentData,
      targetReq?.breakdown.totalPerDiem || 0
    );
    showToast(`Payment processed! Official Voucher ${voucherNo} created.`);
  };

  const handleViewVoucher = (req: TravelRequest) => {
    setSelectedRequest(req);
    setActiveTab('voucher');
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#101B35] flex items-center justify-center text-white text-sm">
        Initializing Oda Bultum University Cloud Portal...
      </div>
    );
  }

  // Protected Route Gate: Unauthenticated visitors only see Welcome, Login, or Employee Registration
  if (!currentUser) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#101B35] text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#D4AF37]/50 flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {authRoute === 'welcome' && (
          <WelcomeLandingPage
            onNavigateLogin={(role) => {
              setPreferredLoginRole(role || 'EMPLOYEE');
              setAuthRoute('login');
            }}
            onNavigateRegister={() => setAuthRoute('register')}
          />
        )}

        {authRoute === 'login' && (
          <LoginPage
            initialPortalRole={preferredLoginRole}
            onGooglePortalSignIn={handleGooglePortalSignIn}
            onCredentialPortalSignIn={handleCredentialPortalSignIn}
            onCloudResetPassword={handleCloudResetPassword}
            onNavigateRegister={() => setAuthRoute('register')}
            onNavigateWelcome={() => setAuthRoute('welcome')}
          />
        )}

        {authRoute === 'register' && (
          <RegisterPage
            onCloudRegister={handleCloudRegister}
            onNavigateLogin={() => {
              setPreferredLoginRole('EMPLOYEE');
              setAuthRoute('login');
            }}
            onNavigateWelcome={() => setAuthRoute('welcome')}
          />
        )}
      </>
    );
  }

  // Authenticated Dashboard State (Role-Protected)
  const pendingAdminCount = requests.filter(
    (r) => r.status === 'SUBMITTED_FOR_APPROVAL'
  ).length;
  const pendingRegistrationCount = userRecords.filter(
    (u) => u.accountStatus === 'PENDING_APPROVAL'
  ).length;
  const pendingFinanceCount = requests.filter(
    (r) => r.status === 'APPROVED_BY_ADMIN'
  ).length;

  const scopedRequests =
    currentUser.role === 'EMPLOYEE'
      ? requests.filter(
          (r) =>
            (currentUser.uid && r.employeeUid === currentUser.uid) ||
            r.employeeId === currentUser.id ||
            r.employeeId === currentUser.employeeId
        )
      : requests;

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#101B35] flex flex-col">
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingAdminCount={pendingAdminCount}
        pendingRegistrationCount={pendingRegistrationCount}
        pendingFinanceCount={pendingFinanceCount}
        onLogout={handleLogout}
      />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#101B35] text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#D4AF37]/50 flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Protected Dashboard Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <div>
            {currentUser.role === 'EMPLOYEE' && (
              <EmployeePortal
                currentUser={currentUser}
                requests={requests}
                onSubmitRequest={handleSubmitRequest}
                onViewVoucher={handleViewVoucher}
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
              />
            )}
            {currentUser.role === 'ADMINISTRATOR' && (
              <AdminPortal
                currentUser={currentUser}
                requests={requests}
                userRecords={userRecords}
                invitations={invitations}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                onViewVoucher={handleViewVoucher}
                onAuthorizeEmployee={handleAuthorizeEmployee}
                onProvisionPrivilegedUser={handleProvisionPrivilegedUser}
              />
            )}
            {currentUser.role === 'FINANCE' && (
              <FinancePortal
                currentUser={currentUser}
                requests={requests}
                onProcessPayment={handleProcessPayment}
                onViewVoucher={handleViewVoucher}
              />
            )}
          </div>
        )}

        {activeTab === 'voucher' && (
          <ReportVoucherView
            requests={scopedRequests.length > 0 ? scopedRequests : requests}
            selectedRequest={selectedRequest}
            onSelectRequest={setSelectedRequest}
            onBackToWorkflow={() => setActiveTab('dashboard')}
          />
        )}
      </main>

      <footer className="bg-[#101B35] border-t border-[#D4AF37]/25 text-slate-300 py-6 px-4 text-xs mt-12 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-bold text-white">Oda Bultum University</span>
            <span className="mx-2 text-[#D4AF37]">&middot;</span>
            <span className="italic text-[#D4AF37]">Productive Mind for Development</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Chiro, West Hararghe, Oromia &middot; Official Per Diem Management System &middot; {currentUser.name} ({currentUser.role})
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-slate-200 hover:underline cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('voucher')}
              className="text-slate-200 hover:underline cursor-pointer"
            >
              Vouchers &amp; Reports
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-300 hover:text-white hover:underline cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
