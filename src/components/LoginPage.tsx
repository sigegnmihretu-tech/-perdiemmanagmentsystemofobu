import React, { useEffect, useState } from 'react';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { AuthPortalRole } from '../types/perdiem';
import {
  loadRememberedIdentifier,
  setRememberedIdentifier,
} from '../utils/authSecurity';
import { ObuCrest } from './ObuCrest';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  UserCheck,
  UserPlus,
  Wallet,
} from 'lucide-react';

export interface CloudLoginResult {
  ok: boolean;
  errorCode?: 'INVALID_CREDENTIALS' | 'PENDING_APPROVAL' | 'REJECTED' | 'ROLE_MISMATCH' | 'NOT_FOUND';
  message?: string;
}

interface LoginPageProps {
  initialPortalRole?: AuthPortalRole;
  onGooglePortalSignIn: (
    firebaseUser: FirebaseUser,
    selectedPortal: AuthPortalRole,
    rememberMe: boolean
  ) => Promise<CloudLoginResult>;
  onCredentialPortalSignIn: (
    firebaseUser: FirebaseUser,
    identifier: string,
    password: string,
    selectedPortal: AuthPortalRole,
    rememberMe: boolean
  ) => Promise<CloudLoginResult>;
  onCloudResetPassword: (
    firebaseUser: FirebaseUser,
    email: string,
    employeeId: string,
    newPlainPassword: string
  ) => Promise<{ ok: boolean; message: string }>;
  onNavigateRegister: () => void;
  onNavigateWelcome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialPortalRole = 'EMPLOYEE',
  onGooglePortalSignIn,
  onCredentialPortalSignIn,
  onCloudResetPassword,
  onNavigateRegister,
  onNavigateWelcome,
}) => {
  const [selectedPortal, setSelectedPortal] = useState<AuthPortalRole>(initialPortalRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'error' | 'pending'>('error');

  // Forgot Password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryEmpId, setRecoveryEmpId] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    setSelectedPortal(initialPortalRole);
  }, [initialPortalRole]);

  useEffect(() => {
    const saved = loadRememberedIdentifier();
    if (saved) {
      setIdentifier(saved);
      setRememberMe(true);
    }
  }, []);

  const handlePortalSwitch = (role: AuthPortalRole) => {
    setSelectedPortal(role);
    setErrorMessage(null);
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (!cred.user.emailVerified || !cred.user.email) {
        setErrorType('error');
        setErrorMessage('A verified Google email account is required to access the cloud portal.');
        return;
      }

      const result = await onGooglePortalSignIn(cred.user, selectedPortal, rememberMe);
      if (!result.ok) {
        setErrorType(result.errorCode === 'PENDING_APPROVAL' ? 'pending' : 'error');
        setErrorMessage(result.message || 'Authentication failed.');
        return;
      }

      setRememberedIdentifier(cred.user.email, rememberMe);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      setErrorType('error');
      setErrorMessage(
        msg.includes('popup-closed')
          ? 'Google sign-in popup was closed before sign-in finished.'
          : msg
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorType('error');
      setErrorMessage('Please enter both your University ID or Email Address and your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      let firebaseUser =
        auth.currentUser && auth.currentUser.emailVerified ? auth.currentUser : null;

      if (!firebaseUser) {
        const cred = await signInWithPopup(auth, googleProvider);
        if (!cred.user.emailVerified || !cred.user.email) {
          setErrorType('error');
          setErrorMessage('Google verification is required to verify your cloud profile.');
          return;
        }
        firebaseUser = cred.user;
      }

      const result = await onCredentialPortalSignIn(
        firebaseUser,
        identifier,
        password,
        selectedPortal,
        rememberMe
      );

      if (!result.ok) {
        setErrorType(result.errorCode === 'PENDING_APPROVAL' ? 'pending' : 'error');
        setErrorMessage(result.message || 'Authentication failed.');
        return;
      }

      setRememberedIdentifier(identifier, rememberMe);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorType('error');
      setErrorMessage(
        msg.includes('popup-closed')
          ? 'Google verification popup was closed before verifying your account.'
          : msg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    if (newResetPassword.length < 8) {
      setRecoveryError('New password must be at least 8 characters long.');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setRecoveryError('New password and confirmation do not match.');
      return;
    }

    setIsRecovering(true);
    try {
      let firebaseUser =
        auth.currentUser && auth.currentUser.emailVerified ? auth.currentUser : null;

      if (!firebaseUser) {
        const cred = await signInWithPopup(auth, googleProvider);
        firebaseUser = cred.user;
      }

      const res = await onCloudResetPassword(
        firebaseUser,
        recoveryEmail,
        recoveryEmpId,
        newResetPassword
      );
      if (!res.ok) {
        setRecoveryError(res.message);
        return;
      }

      setRecoverySuccess(res.message);
      setIdentifier(firebaseUser.email || recoveryEmail);
      setPassword('');
      setNewResetPassword('');
      setConfirmResetPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reset password.';
      setRecoveryError(msg);
    } finally {
      setIsRecovering(false);
    }
  };

  const portalMeta: Record<
    AuthPortalRole,
    { title: string; subtitle: string; icon: React.ReactNode; notice: string }
  > = {
    EMPLOYEE: {
      title: 'Employee Portal Sign-In',
      subtitle: 'Academic staff, researchers, and university personnel',
      icon: <UserCheck className="w-4 h-4" />,
      notice:
        'Newly registered employee accounts require Administrator authorization before sign-in.',
    },
    ADMINISTRATOR: {
      title: 'Administrator Console Sign-In',
      subtitle: 'Deans, Academic Vice Presidents, and System Administrators',
      icon: <Shield className="w-4 h-4" />,
      notice:
        'Restricted portal. Administrator privileges are verified directly from your authorized OBU cloud account.',
    },
    FINANCE: {
      title: 'Finance Directorate Sign-In',
      subtitle: 'Disbursement officers and university treasury staff',
      icon: <Wallet className="w-4 h-4" />,
      notice:
        'Restricted portal. Finance accounts are provisioned and authorized exclusively by System Administration.',
    },
  };

  const activeMeta = portalMeta[selectedPortal];

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#101B35] flex flex-col lg:grid lg:grid-cols-12">
      {/* Left Institutional Navy Brand Panel (Desktop) / Top Compact Banner (Mobile) */}
      <aside className="lg:col-span-5 bg-[#101B35] text-white px-6 py-8 sm:px-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div>
          <button
            onClick={onNavigateWelcome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#D4AF37] transition-colors cursor-pointer min-h-[36px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to University Welcome Page</span>
          </button>

          <div className="mt-8 lg:mt-10 flex items-center gap-4">
            <ObuCrest size={60} className="shrink-0" />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#D4AF37]">
                Oda Bultum University
              </p>
              <p className="font-serif italic text-xs text-slate-200 mt-0.5">
                &ldquo;Productive Mind for Development&rdquo;
              </p>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug mt-1">
                Official Per Diem Management System
              </h1>
            </div>
          </div>

          <p className="hidden lg:block text-sm text-slate-300 leading-relaxed mt-5 max-w-md">
            Sign in with your verified Google account or University Employee ID. Access levels are
            verified directly from your authorized cloud profile.
          </p>

          {/* Authentic Campus Photograph Frame (Desktop) */}
          <div className="hidden lg:block mt-6 rounded-xl overflow-hidden border border-[#D4AF37]/30 relative aspect-[16/9] max-w-md">
            <img
              src="/assets/obu/campus-4.jpg"
              alt="Oda Bultum University Chiro Main Campus"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101B35]/90 to-transparent px-4 py-2.5">
              <p className="text-[11px] font-semibold text-[#D4AF37]">
                Chiro Main Campus &middot; West Hararghe, Oromia
              </p>
            </div>
          </div>

          {/* Security assurances (Desktop) */}
          <div className="hidden lg:block mt-6 pt-6 border-t border-white/15 space-y-3.5 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Verified Cloud Authentication</p>
                <p className="text-slate-400 mt-0.5">
                  Staff registrations, approvals, claims, and payment vouchers synchronize across
                  all devices in real time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Strict Role-Based Routing</p>
                <p className="text-slate-400 mt-0.5">
                  Authenticated accounts are validated against their assigned Employee, Administrator,
                  or Finance privileges before entering any dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between pt-6 border-t border-white/15 text-xs text-slate-400">
          <span>obu.edu.et &middot; +251 25 651 0040</span>
          <span>OBU Finance Directorate</span>
        </div>
      </aside>

      {/* Right Authentication Form Panel */}
      <main className="lg:col-span-7 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#101B35]">
              {activeMeta.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">{activeMeta.subtitle}</p>
          </div>

          {/* 3 Role-Based Login Access Tabs */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select Access Portal
            </label>
            <div
              className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4F6FA] rounded-xl border border-slate-200"
              role="tablist"
              aria-label="Role login options"
            >
              {(
                [
                  { id: 'EMPLOYEE', label: 'Employee', icon: UserCheck },
                  { id: 'ADMINISTRATOR', label: 'Administrator', icon: Shield },
                  { id: 'FINANCE', label: 'Finance', icon: Wallet },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedPortal === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handlePortalSwitch(tab.id)}
                    className={`min-h-[42px] px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#101B35] text-white shadow-sm'
                        : 'text-slate-600 hover:text-[#101B35] hover:bg-white/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{activeMeta.notice}</p>
          </div>

          {/* Error / Pending Status Banner */}
          {errorMessage && (
            <div
              role="alert"
              className={`mb-5 p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                errorType === 'pending'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  errorType === 'pending' ? 'text-amber-700' : 'text-rose-700'
                }`}
              />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Primary Google Cloud Sign-In CTA */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full min-h-[48px] py-3 px-5 rounded-lg bg-[#101B35] hover:bg-[#1A2B52] disabled:opacity-60 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.76 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.3 9.14 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-2 3.71-4.94 3.71-8.7z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.71-2.88c-.98.66-2.23 1.06-3.57 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
            </svg>
            <span>
              {isGoogleLoading
                ? 'Authenticating with Google...'
                : `Continue with Google (${
                    selectedPortal === 'ADMINISTRATOR'
                      ? 'Administrator'
                      : selectedPortal === 'FINANCE'
                      ? 'Finance'
                      : 'Employee'
                  })`}
            </span>
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <div className="h-px flex-1 bg-slate-200" />
            <span>Or verify with University ID &amp; Password</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-bold text-[#101B35] mb-1.5"
              >
                University ID or Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="OBU-ACAD-2041 or name@gmail.com"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-sm bg-[#F4F6FA] border border-slate-300 rounded-lg text-[#101B35] placeholder:text-slate-400 focus:bg-white focus:border-[#101B35] focus:ring-2 focus:ring-[#D4AF37]/40 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-[#101B35] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full min-h-[46px] pl-10 pr-12 py-2.5 text-sm bg-[#F4F6FA] border border-slate-300 rounded-lg text-[#101B35] placeholder:text-slate-400 focus:bg-white focus:border-[#101B35] focus:ring-2 focus:ring-[#D4AF37]/40 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-[#101B35] rounded-md cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-700 cursor-pointer select-none min-h-[36px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#101B35] focus:ring-[#D4AF37]"
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setRecoveryError(null);
                  setRecoverySuccess(null);
                  setIsForgotOpen(true);
                }}
                className="text-xs sm:text-sm font-semibold text-[#101B35] hover:text-[#B59024] underline underline-offset-4 cursor-pointer min-h-[36px]"
              >
                Forgot Password?
              </button>
            </div>

            {/* Secondary Credentials Login Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full min-h-[46px] py-2.5 px-5 rounded-lg border-2 border-[#101B35] hover:bg-[#101B35] hover:text-white disabled:opacity-60 text-[#101B35] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#B59024]" />
              <span>{isSubmitting ? 'Verifying Credentials...' : 'Login with Credentials'}</span>
            </button>
          </form>

          {/* Employee Registration CTA */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="text-slate-600">New Oda Bultum University employee?</span>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="inline-flex items-center gap-1.5 font-bold text-[#101B35] hover:text-[#B59024] transition-colors cursor-pointer min-h-[36px]"
            >
              <UserPlus className="w-4 h-4 text-[#D4AF37]" />
              <span>Create Employee Account</span>
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101B35]/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#101B35] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                  Account Recovery
                </p>
                <h3 className="font-serif text-lg font-bold">Reset University Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="text-slate-300 hover:text-white px-2 py-1 cursor-pointer"
                aria-label="Close recovery modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Verify your institutional Employee ID and registered Email Address to securely update
                your cloud portal password.
              </p>

              {recoveryError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {recoveryError}
                </div>
              )}
              {recoverySuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{recoverySuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#101B35] mb-1">
                  Account Email Address
                </label>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B35] mb-1">
                  University Employee ID
                </label>
                <input
                  type="text"
                  required
                  value={recoveryEmpId}
                  onChange={(e) => setRecoveryEmpId(e.target.value)}
                  placeholder="OBU-ACAD-2041"
                  className="w-full min-h-[42px] px-3 py-2 text-sm font-mono bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B35] mb-1">
                  New Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B35] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isRecovering}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg cursor-pointer disabled:opacity-60"
                >
                  {isRecovering ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
