import React, { useState } from 'react';
import { User, TravelRequest, PaymentDetails } from '../types/perdiem';
import { ObuCrest } from './ObuCrest';
import { 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  MapPin,
  AlertCircle
} from 'lucide-react';

interface FinancePortalProps {
  currentUser: User;
  requests: TravelRequest[];
  onProcessPayment: (requestId: string, paymentData: Partial<PaymentDetails>) => Promise<TravelRequest | null>;
  onViewVoucher: (req: TravelRequest) => void;
}

export const FinancePortal: React.FC<FinancePortalProps> = ({
  currentUser,
  requests,
  onProcessPayment,
  onViewVoucher,
}) => {
  const [selectedReq, setSelectedReq] = useState<TravelRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CBE_BANK_TRANSFER' | 'TELEBIRR' | 'CHEQUE' | 'CASH'>('CBE_BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('CBE-FT-94817290');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const pendingPayments = requests.filter(r => r.status === 'APPROVED_BY_ADMIN');
  const paidClaims = requests.filter(r => r.status === 'COMPLETED' || r.status === 'PAYMENT_PROCESSED');

  const totalDisbursed = paidClaims.reduce((acc, r) => acc + r.breakdown.totalPerDiem, 0);

  const openPaymentModal = (req: TravelRequest) => {
    setSelectedReq(req);
    setPaymentError(null);
    setReferenceNumber(`CBE-FT-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || isProcessing) return;

    const cleanRef = referenceNumber.trim();
    if (cleanRef.length < 2) {
      setPaymentError('Please enter a valid transaction, cheque, or voucher reference number (at least 2 characters).');
      return;
    }

    const voucherNumber = `OBU-FIN-PV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setPaymentError(null);
    setIsProcessing(true);

    try {
      const issuedRequest = await onProcessPayment(selectedReq.id, {
        voucherNumber,
        processedBy: `${currentUser.name} (Finance Officer)`,
        processedAt: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        paymentMethod,
        referenceNumber: cleanRef,
        disbursedAmount: selectedReq.breakdown.totalPerDiem,
        currency: 'ETB',
        paymentStatus: 'PAID',
      });

      setIsPaymentModalOpen(false);
      setSelectedReq(null);
      if (issuedRequest) {
        onViewVoucher(issuedRequest);
      }
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'Unable to process payment and issue voucher.';
      let friendlyMsg = rawMsg;
      try {
        const parsed = JSON.parse(rawMsg);
        if (parsed && typeof parsed.error === 'string') {
          friendlyMsg = parsed.error.includes('Missing or insufficient permissions')
            ? 'Cloud permission denied while issuing voucher. Please sign out and sign back in with Google on the Finance tab, then try again.'
            : parsed.error;
        }
      } catch {
        // Not JSON
      }
      setPaymentError(friendlyMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-[#101B35] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <ObuCrest size={48} onDark={false} className="hidden sm:inline-flex mt-0.5 ring-1 ring-slate-200" />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-[#101B35] uppercase tracking-wider">
                  Oda Bultum University &middot; Finance Directorate
                </span>
                <span aria-hidden="true" className="text-slate-300">&middot;</span>
                <span className="italic text-[#B59024] font-medium">
                  Productive Mind for Development
                </span>
                <span aria-hidden="true" className="text-slate-300">&middot;</span>
                <span className="text-slate-500 font-mono">{currentUser.employeeId}</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#101B35] mt-1">
                Per Diem Disbursement Desk: {currentUser.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Disburse authorized per diem funds to university personnel, record payment references, and generate official payment vouchers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-lg bg-[#F4F6FA] border border-slate-200 text-center">
              <span className="text-[10px] text-slate-600 font-semibold block uppercase">Pending Payment</span>
              <span className="text-xl font-bold text-[#101B35] font-mono tabular-nums">{pendingPayments.length}</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#101B35] text-white text-center border border-[#D4AF37]/40">
              <span className="text-[10px] text-[#D4AF37] font-semibold block uppercase">Total Disbursed</span>
              <span className="text-base font-bold text-white font-mono tabular-nums">{totalDisbursed.toLocaleString()} ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payment Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#B59024]" />
            <h3 className="font-bold text-[#101B35] text-sm">
              Admin-Approved Applications Awaiting Payment
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#101B35] tabular-nums">
            {pendingPayments.length} Ready for Payout
          </span>
        </div>

        {pendingPayments.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-800">No applications pending payment</p>
            <p className="text-xs text-slate-500 mt-1">
              All admin-approved claims have been disbursed and archived into vouchers.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingPayments.map((req) => (
              <div key={req.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Applicant & Approval details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {req.trackingCode}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{req.employeeName}</span>
                      <span className="text-[11px] text-slate-500">({req.department})</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.destination}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span>{req.daysCount} days ({req.departureDate} &rarr; {req.returnDate})</span>
                    </div>

                    {req.approval && (
                      <div className="bg-teal-50/60 p-2 rounded border border-teal-200/80 text-[11px] text-teal-900">
                        <span className="font-bold">Authorized by: </span>
                        {req.approval.reviewedBy} on {req.approval.reviewedAt}
                        <p className="text-slate-600 mt-0.5 italic">"{req.approval.remarks}"</p>
                      </div>
                    )}
                  </div>

                  {/* Middle: Breakdown */}
                  <div className="bg-[#F4F6FA] p-3 rounded-xl border border-slate-200 text-right min-w-[200px]">
                    <span className="text-[10px] text-slate-600 font-semibold block uppercase">
                      Total Disbursable Amount
                    </span>
                    <span className="text-xl font-black text-[#101B35] font-mono tabular-nums">
                      {req.breakdown.totalPerDiem.toLocaleString()} ETB
                    </span>
                    <div className="text-[10px] text-slate-600 mt-0.5 tabular-nums">
                      Meals: {req.breakdown.dailyAllowanceRate * req.daysCount} ETB &bull; Lodging: {req.breakdown.lodgingAllowanceRate * req.daysCount} ETB
                    </div>
                  </div>

                  {/* Right: Process Payment Button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openPaymentModal(req)}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D4AF37]/40"
                    >
                      <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                      <span>Process Payment &amp; Issue Voucher</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      {isPaymentModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101B35]/65 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#101B35] px-6 py-4 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-3">
                <ObuCrest size={34} />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
                    Oda Bultum University &middot; Process Payment
                  </span>
                  <h3 className="font-serif text-base font-bold text-white">
                    Per Diem Disbursement Authorization
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              {paymentError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="bg-[#F4F6FA] p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Payee (Employee):</span>
                  <span className="font-bold text-[#101B35]">{selectedReq.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tracking Code:</span>
                  <span className="font-mono font-bold text-[#101B35]">{selectedReq.trackingCode}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5">
                  <span className="text-[#101B35] font-bold">Authorized Amount:</span>
                  <span className="font-mono font-black text-[#101B35] text-sm tabular-nums">
                    {selectedReq.breakdown.totalPerDiem.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B35] mb-1">
                  Disbursement Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#101B35] focus:outline-none"
                >
                  <option value="CBE_BANK_TRANSFER">Commercial Bank of Ethiopia (CBE Direct Transfer)</option>
                  <option value="TELEBIRR">Telebirr University Merchant Payout</option>
                  <option value="CHEQUE">Bank Cheque (Oda Bultum University Treasury)</option>
                  <option value="CASH">Cash Petty Voucher (University Cashier)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B35] mb-1">
                  Transaction / Cheque / Bank Transfer Reference Number *
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. CBE-FT-994821034"
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#101B35] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#101B35] border border-slate-300 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isProcessing ? 'Processing & Issuing Voucher...' : 'Authorize & Generate Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disbursed Claims & Payment Vouchers */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              Disbursed Claims &amp; Generated Payment Vouchers
            </h3>
          </div>
          <span className="text-xs text-slate-500">{paidClaims.length} Vouchers Issued</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Claim Ref</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Disbursed Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Processed Date</th>
                <th className="py-3 px-4 text-right">Official Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paidClaims.map((req) => (
                <tr key={req.id} className="hover:bg-[#F4F6FA]/70">
                  <td className="py-3 px-4 font-mono font-bold text-[#101B35]">
                    {req.payment?.voucherNumber || 'OBU-FIN-PV-2026-0412'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{req.trackingCode}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{req.employeeName}</td>
                  <td className="py-3 px-4 font-bold text-[#101B35] font-mono tabular-nums">
                    {req.breakdown.totalPerDiem.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F6FA] text-[#101B35] border border-slate-200">
                      {req.payment?.paymentMethod?.replace(/_/g, ' ') || 'CBE BANK TRANSFER'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {req.payment?.processedAt || '2026-10-20 03:30 PM'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onViewVoucher(req)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#101B35] text-white hover:bg-[#1A2B52] transition-colors shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Print Voucher</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
