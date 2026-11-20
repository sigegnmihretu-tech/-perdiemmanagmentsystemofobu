import React, { useState } from 'react';
import { AccountInvitation, StoredUserRecord, User, TravelRequest } from '../types/perdiem';
import { ObuCrest } from './ObuCrest';
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  MapPin,
  UserCheck,
  UserPlus,
  Users,
  Lock,
  AlertCircle,
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User;
  requests: TravelRequest[];
  userRecords: StoredUserRecord[];
  invitations?: AccountInvitation[];
  onApprove: (requestId: string, remarks: string) => void;
  onReject: (requestId: string, remarks: string) => void;
  onViewVoucher: (req: TravelRequest) => void;
  onAuthorizeEmployee: (userId: string, decision: 'ACTIVE' | 'REJECTED') => void;
  onProvisionPrivilegedUser: (input: {
    fullName: string;
    employeeId: string;
    email: string;
    phone: string;
    department: string;
    jobPosition: string;
    role: 'ADMINISTRATOR' | 'FINANCE';
    password: string;
  }) => Promise<{ ok: boolean; message: string }>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  requests,
  userRecords,
  invitations = [],
  onApprove,
  onReject,
  onAuthorizeEmployee,
  onProvisionPrivilegedUser,
}) => {
  const [adminSection, setAdminSection] = useState<'claims' | 'accounts'>('claims');
  const [selectedReviewReq, setSelectedReviewReq] = useState<TravelRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState('');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Provision Admin/Finance Account modal state
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provName, setProvName] = useState('');
  const [provEmpId, setProvEmpId] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provDept, setProvDept] = useState('Finance & Treasury Directorate');
  const [provPosition, setProvPosition] = useState('Finance Disbursement Officer');
  const [provRole, setProvRole] = useState<'ADMINISTRATOR' | 'FINANCE'>('FINANCE');
  const [provPassword, setProvPassword] = useState('');
  const [provError, setProvError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === 'SUBMITTED_FOR_APPROVAL');
  const processedRequests = requests.filter((r) => r.status !== 'SUBMITTED_FOR_APPROVAL');
  const pendingRegistrations = userRecords.filter((u) => u.accountStatus === 'PENDING_APPROVAL');
  const activeDirectory = userRecords.filter((u) => u.accountStatus !== 'PENDING_APPROVAL');

  const openDecisionModal = (req: TravelRequest, type: 'APPROVE' | 'REJECT') => {
    setSelectedReviewReq(req);
    setActionType(type);
    setRemarks(
      type === 'APPROVE'
        ? 'Approved. Official academic and research mission aligned with institutional goals and allocated faculty travel budget.'
        : 'Budget ceiling reached for the current quarter or missing external workshop invitation voucher. Please revise.'
    );
    setIsDecisionModalOpen(true);
  };

  const handleConfirmDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewReq) return;

    if (actionType === 'APPROVE') {
      onApprove(selectedReviewReq.id, remarks);
    } else {
      onReject(selectedReviewReq.id, remarks);
    }
    setIsDecisionModalOpen(false);
    setSelectedReviewReq(null);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvError(null);

    if (provName.trim().length < 3 || !provEmpId.trim() || !provEmail.trim() || provPassword.length < 8) {
      setProvError('Please fill all required fields and provide a password of at least 8 characters.');
      return;
    }

    setIsProvisioning(true);
    try {
      const res = await onProvisionPrivilegedUser({
        fullName: provName,
        employeeId: provEmpId,
        email: provEmail,
        phone: provPhone || '+251 911 000 000',
        department: provDept,
        jobPosition: provPosition,
        role: provRole,
        password: provPassword,
      });

      if (!res.ok) {
        setProvError(res.message);
        return;
      }

      setIsProvisionOpen(false);
      setProvName('');
      setProvEmpId('');
      setProvEmail('');
      setProvPhone('');
      setProvPassword('');
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Summary Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-[#101B35] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <ObuCrest size={48} onDark={false} className="hidden sm:inline-flex mt-0.5 ring-1 ring-slate-200" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-[#101B35] uppercase tracking-wider">
                Oda Bultum University &middot; Administrator Console
              </span>
              <span aria-hidden="true">&middot;</span>
              <span className="italic text-[#B59024] font-medium">
                Productive Mind for Development
              </span>
              <span aria-hidden="true">&middot;</span>
              <span className="font-mono">{currentUser.employeeId}</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#101B35] mt-1">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Review academic travel claims, authorize new employee registrations, and provision
              Administrator or Finance accounts.
            </p>
          </div>
        </div>

        {/* Section Switcher + KPI Counters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F4F6FA] rounded-lg border border-slate-200">
            <button
              onClick={() => setAdminSection('claims')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                adminSection === 'claims'
                  ? 'bg-[#101B35] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#101B35]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Travel Claims ({pendingRequests.length})</span>
            </button>
            <button
              onClick={() => setAdminSection('accounts')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                adminSection === 'accounts'
                  ? 'bg-[#101B35] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#101B35]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Account Authorizations ({pendingRegistrations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {adminSection === 'claims' ? (
        <>
          {pendingRegistrations.length > 0 && (
            <div className="bg-[#101B35] text-white rounded-xl border border-[#D4AF37]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">
                    {pendingRegistrations.length} New Employee{' '}
                    {pendingRegistrations.length === 1 ? 'Registration' : 'Registrations'} Pending
                    Approval
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Newly registered employees must be authorized before they can sign in:{' '}
                    <span className="text-[#D4AF37] font-medium">
                      {pendingRegistrations.map((u) => u.name).join(', ')}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminSection('accounts')}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#E2BE48] text-[#101B35] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                Review &amp; Authorize Now
              </button>
            </div>
          )}

          {/* Pending Applications Review Queue */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B59024]" />
                <h3 className="font-bold text-[#101B35] text-sm">
                  Pending Applications Requiring Review
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#101B35] tabular-nums">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-10 text-center">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800">No applications pending review</p>
                <p className="text-xs text-slate-500 mt-1">
                  All travel and per diem claims have been evaluated.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-4 sm:p-5 hover:bg-[#F4F6FA]/70 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Applicant details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-[#101B35]">
                            {req.trackingCode}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">&middot;</span>
                          <span className="font-bold text-slate-800">{req.employeeName}</span>
                          <span aria-hidden="true" className="text-slate-300">&middot;</span>
                          <span className="text-slate-500">{req.department}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.destination}</span>
                          <span className="text-slate-400 font-normal">&bull;</span>
                          <span className="font-normal text-slate-600">
                            {req.daysCount} days ({req.departureDate} &rarr; {req.returnDate})
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          <span className="font-medium text-slate-700">Purpose: </span>
                          {req.purpose}
                        </p>

                        {req.notes && (
                          <p className="text-[11px] text-slate-500 italic">Note: {req.notes}</p>
                        )}
                      </div>

                      {/* Middle: Calculated breakdown summary */}
                      <div className="bg-[#F4F6FA] p-3 rounded-xl border border-slate-200 text-right min-w-[180px]">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                          Calculated Per Diem
                        </span>
                        <span className="text-lg font-black text-[#101B35] font-mono tabular-nums">
                          {req.breakdown.totalPerDiem.toLocaleString()} ETB
                        </span>
                        <div className="text-[10px] text-slate-600 mt-0.5 tabular-nums">
                          Daily: {req.breakdown.totalDaily} ETB &bull; Transit:{' '}
                          {req.breakdown.transportAllowance} ETB
                        </div>
                      </div>

                      {/* Right: Branch Decision Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openDecisionModal(req, 'APPROVE')}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Approve &rarr; Finance</span>
                        </button>
                        <button
                          onClick={() => openDecisionModal(req, 'REJECT')}
                          className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject &rarr; Employee</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical / Processed Applications */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-[#101B35] text-sm">
                Review History &amp; Decision Audit Log
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {processedRequests.length} applications processed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tracking Code</th>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4 text-right">Per Diem Total</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F4F6FA]/60">
                      <td className="py-3 px-4 font-mono font-bold text-[#101B35]">
                        {req.trackingCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{req.employeeName}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {req.destination}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-right font-mono tabular-nums">
                        {req.breakdown.totalPerDiem.toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold text-[11px] ${
                            req.status === 'REJECTED_BY_ADMIN'
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {req.status === 'REJECTED_BY_ADMIN' ? 'REJECTED' : 'APPROVED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate text-[11px]">
                        {req.approval?.remarks || 'Approved for research mission.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Account Authorizations & Privileged Account Provisioning */
        <div className="space-y-6">
          {/* Pending Employee Registrations */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#101B35] text-sm">
                  Pending Employee Account Registrations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Newly registered employees remain in Pending Approval status until authorized here.
                </p>
              </div>
              <button
                onClick={() => {
                  setProvError(null);
                  setIsProvisionOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-[#101B35] bg-[#D4AF37] hover:bg-[#E2BE48] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Provision Admin / Finance Account</span>
              </button>
            </div>

            {pendingRegistrations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No employee registrations awaiting approval.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRegistrations.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F4F6FA]/60"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-[#101B35]">{u.employeeId}</span>
                        <span aria-hidden="true" className="text-slate-300">&middot;</span>
                        <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                        <span aria-hidden="true" className="text-slate-300">&middot;</span>
                        <span className="text-amber-700 font-semibold">Pending Approval</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {u.jobPosition || u.staffTier.replace(/_/g, ' ')} &middot; {u.department}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {u.email} {u.phone ? `· ${u.phone}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onAuthorizeEmployee(u.id, 'ACTIVE')}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Authorize Employee</span>
                      </button>
                      <button
                        onClick={() => onAuthorizeEmployee(u.id, 'REJECTED')}
                        className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Authorized University Staff Directory */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-[#101B35] text-sm">
                Authorized University Accounts Directory
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {activeDirectory.length} accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">University ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDirectory.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F4F6FA]/60">
                      <td className="py-3 px-4 font-mono font-bold text-[#101B35]">
                        {u.employeeId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {u.department}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#101B35]">{u.role}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            u.accountStatus === 'REJECTED' ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {u.accountStatus || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {invitations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#101B35] text-sm">
                    Provisioned Administrator &amp; Finance Authorizations
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Officers listed below are authorized to activate their portal access via Google Sign-In.
                  </p>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {invitations.length} issued
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F6FA] text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">University ID</th>
                      <th className="py-3 px-4">Officer Name</th>
                      <th className="py-3 px-4">Google / OBU Email</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Activation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invitations.map((inv) => (
                      <tr key={inv.email} className="hover:bg-[#F4F6FA]/60">
                        <td className="py-3 px-4 font-mono font-bold text-[#101B35]">
                          {inv.employeeId}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{inv.name}</td>
                        <td className="py-3 px-4 text-slate-600">{inv.email}</td>
                        <td className="py-3 px-4 font-bold text-[#101B35]">{inv.role}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              inv.status === 'CLAIMED'
                                ? 'text-emerald-700'
                                : inv.status === 'REVOKED'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {inv.status === 'ACTIVE'
                              ? 'Awaiting Google Sign-In'
                              : inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Modal (Approve or Reject Claim) */}
      {isDecisionModalOpen && selectedReviewReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101B35]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                actionType === 'APPROVE' ? 'bg-[#101B35]' : 'bg-rose-800'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
                  Oda Bultum University &middot; Authorization Decision
                </span>
                <h3 className="text-base font-bold text-white">
                  {actionType === 'APPROVE'
                    ? 'Authorize & Route to Finance'
                    : 'Reject & Return to Employee'}
                </h3>
              </div>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmDecision} className="p-6 space-y-4">
              <div className="bg-[#F4F6FA] p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-800">{selectedReviewReq.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReviewReq.destination}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Claim Amount:</span>
                  <span className="font-bold text-[#101B35] font-mono tabular-nums">
                    {selectedReviewReq.breakdown.totalPerDiem.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {actionType === 'APPROVE'
                    ? 'Administrator Approval Remarks:'
                    : 'Reason for Rejection (Visible to Employee):'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#101B35] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    actionType === 'APPROVE'
                      ? 'bg-[#101B35] hover:bg-[#1A2B52]'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {actionType === 'APPROVE' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Confirm Approval &rarr; Forward to Finance</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Confirm Rejection &rarr; Return to Employee</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Privileged Account Modal (Admin / Finance) */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101B35]/65 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full my-8 overflow-hidden">
            <div className="bg-[#101B35] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  System Administrator Authority
                </p>
                <h3 className="font-serif text-lg font-bold">
                  Authorize Administrator or Finance Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionOpen(false)}
                className="text-slate-300 hover:text-white px-2 py-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="p-6 space-y-4">
              {provError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{provError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#101B35] mb-1">
                  Authorized Role
                </label>
                <select
                  value={provRole}
                  onChange={(e) => setProvRole(e.target.value as 'ADMINISTRATOR' | 'FINANCE')}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                >
                  <option value="FINANCE">FINANCE (Finance &amp; Treasury Directorate)</option>
                  <option value="ADMINISTRATOR">ADMINISTRATOR (Executive / Dean Approver)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#101B35] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    placeholder="e.g., Tigist Alemu"
                    className="w-full min-h-[40px] px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#101B35] mb-1">
                    University ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={provEmpId}
                    onChange={(e) => setProvEmpId(e.target.value)}
                    placeholder="OBU-FIN-0490"
                    className="w-full min-h-[40px] px-3 py-2 text-xs font-mono bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#101B35] mb-1">
                    OBU Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={provEmail}
                    onChange={(e) => setProvEmail(e.target.value)}
                    placeholder="tigist.alemu@obu.edu.et"
                    className="w-full min-h-[40px] px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#101B35] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={provPhone}
                    onChange={(e) => setProvPhone(e.target.value)}
                    placeholder="+251 911 555 210"
                    className="w-full min-h-[40px] px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#101B35] mb-1">Department</label>
                  <input
                    type="text"
                    value={provDept}
                    onChange={(e) => setProvDept(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#101B35] mb-1">Job Position</label>
                  <input
                    type="text"
                    value={provPosition}
                    onChange={(e) => setProvPosition(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B35] mb-1">
                  Initial Password (min. 8 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={provPassword}
                  onChange={(e) => setProvPassword(e.target.value)}
                  placeholder="Hashed securely via SHA-256"
                  className="w-full min-h-[40px] px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:bg-white focus:border-[#101B35] focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#F4F6FA] border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#101B35] shrink-0" />
                <span>
                  This account will be immediately active and restricted exclusively to{' '}
                  <strong>{provRole}</strong> portal permissions.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg cursor-pointer"
                >
                  {isProvisioning ? 'Provisioning...' : 'Create & Authorize Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
