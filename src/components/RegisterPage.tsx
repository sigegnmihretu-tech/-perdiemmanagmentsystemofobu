import React, { useEffect, useState } from 'react';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { StaffTier, StoredUserRecord } from '../types/perdiem';
import { ObuCrest } from './ObuCrest';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

interface RegisterPageProps {
  onCloudRegister: (
    firebaseUser: FirebaseUser,
    input: {
      fullName: string;
      employeeId: string;
      phone: string;
      department: string;
      jobPosition: string;
      staffTier: StaffTier;
      password: string;
    }
  ) => Promise<{ ok: boolean; record?: StoredUserRecord; message: string }>;
  onNavigateLogin: () => void;
  onNavigateWelcome: () => void;
}

const OBU_DEPARTMENTS = [
  'Department of Computer Science & IT',
  'Department of Plant Sciences & Agriculture',
  'College of Engineering & Technology',
  'School of Business & Economics',
  'College of Medicine & Health Sciences',
  'College of Natural & Computational Sciences',
  'School of Law',
  'Human Resources & Administration Directorate',
];

const JOB_POSITION_OPTIONS: { label: string; tier: StaffTier }[] = [
  { label: 'Professor / Associate Professor / Dean', tier: 'SENIOR_ACADEMIC' },
  { label: 'Assistant Professor / Lead Researcher', tier: 'SENIOR_ACADEMIC' },
  { label: 'Lecturer / Field Researcher', tier: 'LECTURER_RESEARCHER' },
  { label: 'Graduate Assistant / Lab Instructor', tier: 'LECTURER_RESEARCHER' },
  { label: 'Administrative & Support Officer', tier: 'ADMIN_SUPPORT' },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onCloudRegister,
  onNavigateLogin,
  onNavigateWelcome,
}) => {
  const [verifiedUser, setVerifiedUser] = useState<FirebaseUser | null>(() =>
    auth.currentUser && auth.currentUser.emailVerified ? auth.currentUser : null
  );
  const [fullName, setFullName] = useState(() => auth.currentUser?.displayName || '');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState(() => auth.currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(OBU_DEPARTMENTS[0]);
  const [jobPosition, setJobPosition] = useState(JOB_POSITION_OPTIONS[2].label);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRecord, setCompletedRecord] = useState<StoredUserRecord | null>(null);

  useEffect(() => {
    if (verifiedUser?.email) {
      setEmail(verifiedUser.email);
      if (!fullName.trim() && verifiedUser.displayName) {
        setFullName(verifiedUser.displayName);
      }
    }
  }, [verifiedUser, fullName]);

  const handleGoogleVerify = async () => {
    setServerError(null);
    setIsVerifyingGoogle(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (!cred.user.emailVerified || !cred.user.email) {
        setServerError('Please choose a verified Google account to link your registration.');
        return;
      }
      setVerifiedUser(cred.user);
      setEmail(cred.user.email);
      setFieldErrors((p) => ({ ...p, email: '' }));
      if (!fullName.trim() && cred.user.displayName) {
        setFullName(cred.user.displayName);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google verification was cancelled.';
      setServerError(
        msg.includes('popup-closed')
          ? 'Google sign-in popup was closed before verification completed.'
          : msg
      );
    } finally {
      setIsVerifyingGoogle(false);
    }
  };

  const validateFields = (): boolean => {
    const errs: Record<string, string> = {};

    if (fullName.trim().length < 3) {
      errs.fullName = 'Please enter your full legal name (at least 3 characters).';
    }
    if (!/^[A-Za-z0-9-]{5,24}$/.test(employeeId.trim())) {
      errs.employeeId = 'Enter a valid University Employee ID (e.g., OBU-ACAD-3042).';
    }
    if (!verifiedUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address or verify with Google above.';
    }
    const cleanDigits = phone.replace(/[\s\-()+]/g, '');
    if (cleanDigits.length < 9 || !/^\d+$/.test(cleanDigits)) {
      errs.phone = 'Please enter a valid phone number (e.g., +251 911 234 567).';
    }
    if (!department.trim()) {
      errs.department = 'Please select your department.';
    }
    if (!jobPosition.trim()) {
      errs.jobPosition = 'Please specify your job position.';
    }
    if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      errs.password = 'Password must include both letters and at least one number.';
    }
    if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateFields()) {
      return;
    }

    const matchedPosition = JOB_POSITION_OPTIONS.find((p) => p.label === jobPosition);
    const staffTier: StaffTier = matchedPosition ? matchedPosition.tier : 'LECTURER_RESEARCHER';

    setIsSubmitting(true);
    try {
      let activeFirebaseUser =
        verifiedUser ||
        (auth.currentUser && auth.currentUser.emailVerified ? auth.currentUser : null);

      if (!activeFirebaseUser) {
        const cred = await signInWithPopup(auth, googleProvider);
        if (!cred.user.emailVerified || !cred.user.email) {
          setServerError('A verified Google account is required to register to the cloud portal.');
          return;
        }
        activeFirebaseUser = cred.user;
        setVerifiedUser(cred.user);
        setEmail(cred.user.email);
      }

      const result = await onCloudRegister(activeFirebaseUser, {
        fullName,
        employeeId,
        phone,
        department,
        jobPosition,
        staffTier,
        password,
      });

      if (!result.ok || !result.record) {
        setServerError(result.message);
        return;
      }

      setCompletedRecord(result.record);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to complete cloud registration.';
      setServerError(
        msg.includes('popup-closed')
          ? 'Google sign-in popup was closed. Please verify your Google account to submit registration.'
          : msg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength calculation
  const strengthScore =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#101B35] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#101B35] text-white border-b border-[#D4AF37]/25 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateWelcome}
          className="flex items-center gap-3 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ObuCrest size={36} />
          <div className="text-left">
            <span className="font-serif font-bold text-sm sm:text-base text-white block leading-tight">
              ODA BULTUM UNIVERSITY
            </span>
            <span className="text-[10px] italic text-[#D4AF37] hidden sm:block">
              Productive Mind for Development
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#D4AF37] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {completedRecord ? (
          /* Registration Submitted: Pending Approval Screen */
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-7 h-7" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#B59024]">
              Cloud Registration Recorded
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#101B35] mt-1.5">
              Account Pending Administrator Approval
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Thank you, <strong className="text-[#101B35]">{completedRecord.name}</strong>. Your
              employee registration is now synced to the university cloud database with{' '}
              <strong className="text-amber-800">Pending Approval</strong> status. Once an Oda
              Bultum University System Administrator authorizes your account, you may sign in from
              any device to submit travel requests.
            </p>

            <div className="mt-6 bg-[#F4F6FA] rounded-xl border border-slate-200 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono font-bold text-[#101B35]">
                  {completedRecord.employeeId}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Verified Account Email:</span>
                <span className="font-semibold text-[#101B35]">{completedRecord.email}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Department:</span>
                <span className="font-medium text-[#101B35] text-right">
                  {completedRecord.department}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-semibold text-[#101B35]">EMPLOYEE</span>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-slate-200">
                <span className="text-slate-500">Authorization Status:</span>
                <span className="font-bold text-amber-700">PENDING APPROVAL</span>
              </div>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="min-h-[46px] px-6 py-2.5 rounded-lg bg-[#101B35] hover:bg-[#1A2B52] text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Back to Login
              </button>
              <button
                type="button"
                onClick={onNavigateWelcome}
                className="min-h-[46px] px-6 py-2.5 rounded-lg border border-slate-300 hover:border-[#101B35] text-[#101B35] font-semibold text-sm transition-colors cursor-pointer"
              >
                Return to Welcome Page
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form Card */
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="bg-[#101B35] px-6 py-6 sm:px-8 text-white border-b border-[#D4AF37]/30 flex items-start gap-4">
              <ObuCrest size={52} className="shrink-0 mt-0.5 hidden sm:inline-flex" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  Oda Bultum University &middot; Employee Enrollment
                </p>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
                  Create Employee Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Complete your Oda Bultum University employment details below. All new registrations
                  sync directly to the Administrator Console in Pending Approval status.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5" noValidate>
              {/* Google Identity Verification Bar */}
              <div className="p-4 rounded-xl bg-[#F4F6FA] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      verifiedUser ? 'text-emerald-700' : 'text-[#101B35]'
                    }`}
                  />
                  <div className="text-xs">
                    <p className="font-bold text-[#101B35]">
                      {verifiedUser
                        ? `Verified Google Email: ${verifiedUser.email}`
                        : 'Google Identity Verification (Required for Cloud Sync)'}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      {verifiedUser
                        ? 'Your registration will be linked securely to this verified email.'
                        : 'Verify your Google account now or when submitting the registration form.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleVerify}
                  disabled={isVerifyingGoogle}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 hover:border-[#101B35] text-xs font-bold text-[#101B35] whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                >
                  {isVerifyingGoogle
                    ? 'Connecting...'
                    : verifiedUser
                    ? 'Switch Google Account'
                    : 'Verify with Google'}
                </button>
              </div>

              {serverError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs sm:text-sm text-rose-900 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="reg-fullname"
                    className="block text-xs font-bold text-[#101B35] mb-1.5"
                  >
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setFieldErrors((p) => ({ ...p, fullName: '' }));
                    }}
                    placeholder="e.g., Dr. Bekele Tadesse"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#F4F6FA] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${
                      fieldErrors.fullName ? 'border-rose-500' : 'border-slate-300 focus:border-[#101B35]'
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Employee ID */}
                <div>
                  <label
                    htmlFor="reg-empid"
                    className="block text-xs font-bold text-[#101B35] mb-1.5"
                  >
                    Employee ID <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="reg-empid"
                    type="text"
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      setFieldErrors((p) => ({ ...p, employeeId: '' }));
                    }}
                    placeholder="e.g., OBU-ACAD-3105"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm font-mono bg-[#F4F6FA] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${
                      fieldErrors.employeeId ? 'border-rose-500' : 'border-slate-300 focus:border-[#101B35]'
                    }`}
                  />
                  {fieldErrors.employeeId && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.employeeId}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-bold text-[#101B35] mb-1.5"
                  >
                    Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setFieldErrors((p) => ({ ...p, phone: '' }));
                    }}
                    placeholder="+251 911 234 567"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#F4F6FA] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${
                      fieldErrors.phone ? 'border-rose-500' : 'border-slate-300 focus:border-[#101B35]'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-bold text-[#101B35] mb-1.5"
                  >
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={verifiedUser?.email || email}
                    readOnly={Boolean(verifiedUser?.email)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((p) => ({ ...p, email: '' }));
                    }}
                    placeholder="name@obu.edu.et or your Google email"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${
                      verifiedUser?.email
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                        : 'bg-[#F4F6FA] focus:bg-white'
                    } ${
                      fieldErrors.email ? 'border-rose-500' : 'border-slate-300 focus:border-[#101B35]'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="reg-dept"
                    className="block text-xs font-bold text-[#101B35] mb-1.5"
                  >
                    Department <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="reg-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2.5 text-sm bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                  >
                    {OBU_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Position */}
                <div>
                  <label
                    htmlFor="reg-position"
                    className="block text-xs font-bold text-[#101B35] mb-1.5"
                  >
                    Job Position <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="reg-position"
                    value={jobPosition}
                    onChange={(e) => setJobPosition(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2.5 text-sm bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                  >
                    {JOB_POSITION_OPTIONS.map((pos) => (
                      <option key={pos.label} value={pos.label}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-bold text-[#101B35] mb-1.5"
                  >
                    Portal Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, password: '' }));
                      }}
                      placeholder="Min. 8 chars (letters + numbers)"
                      className={`w-full min-h-[44px] pl-3.5 pr-11 py-2.5 text-sm bg-[#F4F6FA] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${
                        fieldErrors.password ? 'border-rose-500' : 'border-slate-300 focus:border-[#101B35]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-500 hover:text-[#101B35] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            strengthScore >= level
                              ? strengthScore >= 3
                                ? 'bg-emerald-600'
                                : 'bg-[#D4AF37]'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-[11px] text-slate-500 ml-1">
                        {strengthScore >= 3 ? 'Strong' : strengthScore >= 2 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                  )}
                  {fieldErrors.password && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="reg-confirm-password"
                    className="block text-xs font-bold text-[#101B35] mb-1.5"
                  >
                    Confirm Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
                      }}
                      placeholder="Re-enter password"
                      className={`w-full min-h-[44px] pl-3.5 pr-11 py-2.5 text-sm bg-[#F4F6FA] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${
                        fieldErrors.confirmPassword
                          ? 'border-rose-500'
                          : 'border-slate-300 focus:border-[#101B35]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-500 hover:text-[#101B35] cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword === password && !fieldErrors.confirmPassword && (
                    <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </p>
                  )}
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Security & Approval Policy Notice */}
              <div className="p-3.5 rounded-xl bg-[#F4F6FA] border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#101B35] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#101B35] block">
                    Pending Administrator Authorization Policy
                  </span>
                  Self-registration creates an <strong>Employee</strong> account in{' '}
                  <strong>Pending Approval</strong> status in the shared cloud database. An OBU
                  System Administrator will review and authorize your account before portal access.
                </div>
              </div>

              {/* Submit & Back to Login */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-[#101B35] hover:text-[#B59024] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[48px] px-7 py-3 rounded-lg bg-[#101B35] hover:bg-[#1A2B52] disabled:opacity-60 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isSubmitting ? 'Submitting to Cloud...' : 'Register Employee Account'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
