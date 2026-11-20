import React, { useState } from 'react';
import { TravelRequest } from '../types/perdiem';
import { ObuCrest } from './ObuCrest';
import { Printer, ArrowLeft, FileText, TableProperties } from 'lucide-react';

interface ReportVoucherViewProps {
  requests: TravelRequest[];
  selectedRequest: TravelRequest | null;
  onSelectRequest: (req: TravelRequest) => void;
  onBackToWorkflow: () => void;
}

export const ReportVoucherView: React.FC<ReportVoucherViewProps> = ({
  requests,
  selectedRequest,
  onSelectRequest,
  onBackToWorkflow,
}) => {
  const [documentMode, setDocumentMode] = useState<'voucher' | 'summary'>('voucher');

  const eligibleRequests = requests.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'APPROVED_BY_ADMIN' || r.payment
  );
  const activeReq = selectedRequest || eligibleRequests[0] || requests[0];

  const handlePrint = () => {
    window.print();
  };

  if (!activeReq) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
        <p className="text-slate-600">No travel claims available to generate report.</p>
      </div>
    );
  }

  const breakdown = activeReq.breakdown;
  const payment = activeReq.payment || {
    voucherNumber: 'OBU-FIN-PV-2026-0412',
    processedBy: 'Chala Gemechu (Finance Directorate)',
    processedAt: 'Pending Disbursement',
    paymentMethod: 'CBE_BANK_TRANSFER',
    referenceNumber: 'PENDING-REF',
    disbursedAmount: breakdown.totalPerDiem,
    currency: 'ETB',
    paymentStatus: activeReq.status === 'COMPLETED' ? 'PAID' : 'PENDING',
  };

  // Summary Report aggregates
  const totalClaimedAmount = requests.reduce((sum, r) => sum + r.breakdown.totalPerDiem, 0);
  const totalDisbursedAmount = requests
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.breakdown.totalPerDiem, 0);
  const totalPendingPayment = requests
    .filter((r) => r.status === 'APPROVED_BY_ADMIN')
    .reduce((sum, r) => sum + r.breakdown.totalPerDiem, 0);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar (Hidden during window.print()) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-[#101B35] p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToWorkflow}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-[#101B35] hover:bg-[#F4F6FA] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <h2 className="font-serif text-base font-bold text-[#101B35]">
              Official OBU Payment Vouchers &amp; Printable Reports
            </h2>
            <p className="text-xs text-slate-500">
              Official Oda Bultum University financial documentation for treasury audit and archiving.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Document Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#F4F6FA] rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setDocumentMode('voucher')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                documentMode === 'voucher'
                  ? 'bg-[#101B35] text-white'
                  : 'text-slate-600 hover:text-[#101B35]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Payment Voucher</span>
            </button>
            <button
              type="button"
              onClick={() => setDocumentMode('summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                documentMode === 'summary'
                  ? 'bg-[#101B35] text-white'
                  : 'text-slate-600 hover:text-[#101B35]'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Summary Report</span>
            </button>
          </div>

          {documentMode === 'voucher' && (
            <div className="flex items-center gap-2 bg-[#F4F6FA] px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-600">Claim:</span>
              <select
                value={activeReq.id}
                onChange={(e) => {
                  const found = requests.find((r) => r.id === e.target.value);
                  if (found) onSelectRequest(found);
                }}
                className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-[#101B35]"
              >
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.payment?.voucherNumber || r.trackingCode} - {r.employeeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D4AF37]/40"
          >
            <Printer className="w-4 h-4 text-[#D4AF37]" />
            <span>
              {documentMode === 'voucher' ? 'Print Voucher / Save PDF' : 'Print Report / Save PDF'}
            </span>
          </button>
        </div>
      </div>

      {documentMode === 'voucher' ? (
        /* ================= OFFICIAL PAYMENT VOUCHER (OBU-FIN-08) ================= */
        <div className="bg-white border-2 border-[#101B35] shadow-xl rounded-xl p-6 sm:p-8 max-w-4xl mx-auto text-[#101B35] print:border print:border-[#101B35] print:shadow-none print:p-6 print:max-w-full">
          {/* University Official Header */}
          <div className="border-b-2 border-[#101B35] pb-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <ObuCrest size={78} onDark={false} className="shrink-0" />

              <div className="flex-1 text-center px-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#101B35] font-serif">
                  ODA BULTUM UNIVERSITY
                </h1>
                <p className="text-xs font-serif italic text-[#B59024] font-semibold mt-0.5">
                  &ldquo;Productive Mind for Development&rdquo;
                </p>
                <p className="text-xs font-bold text-[#101B35] uppercase tracking-widest mt-1">
                  DIRECTORATE OF FINANCE &amp; RESOURCE MANAGEMENT
                </p>
                <div className="inline-block bg-[#101B35] text-white border border-[#D4AF37] font-bold text-xs uppercase px-4 py-1 rounded mt-2 tracking-wider">
                  Official Travel Allowance &amp; Per Diem Payment Voucher
                </div>
              </div>

              <div className="text-center sm:text-right text-xs font-mono shrink-0">
                <div className="font-bold text-[#101B35]">FORM: OBU-FIN-08</div>
                <div className="text-slate-600 mt-0.5">Voucher No:</div>
                <div className="font-bold text-[#101B35] text-sm bg-[#F4F6FA] px-2 py-0.5 rounded border border-[#D4AF37]/60">
                  {payment.voucherNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-medium text-[10px]">
                Payment Date:
              </span>
              <span className="font-bold text-[#101B35]">{payment.processedAt}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-medium text-[10px]">
                Claim Tracking Ref:
              </span>
              <span className="font-mono font-bold text-[#101B35]">{activeReq.trackingCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-medium text-[10px]">
                Disbursement Mode:
              </span>
              <span className="font-semibold text-[#101B35]">
                {payment.paymentMethod.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-medium text-[10px]">
                Bank / Transaction Ref:
              </span>
              <span className="font-mono font-bold text-[#101B35]">{payment.referenceNumber}</span>
            </div>
          </div>

          {/* Section A: Beneficiary Information */}
          <div className="mt-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-white bg-[#101B35] p-2.5 rounded border-l-4 border-[#D4AF37]">
              Section A: Beneficiary &amp; Travel Particulars
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 text-xs border border-t-0 border-slate-200 rounded-b">
              <div>
                <span className="text-slate-500 block">Full Name of Claimant:</span>
                <span className="font-bold text-[#101B35] text-sm">{activeReq.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Academic Title &amp; Tier:</span>
                <span className="font-semibold text-slate-800">{activeReq.employeeRole}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Department / College:</span>
                <span className="font-semibold text-slate-800">{activeReq.department}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Official Travel Purpose:</span>
                <span className="font-medium text-slate-800">{activeReq.purpose}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Destination:</span>
                <span className="font-bold text-[#101B35]">{activeReq.destination}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Departure Date:</span>
                <span className="font-semibold text-slate-800">{activeReq.departureDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Return Date:</span>
                <span className="font-semibold text-slate-800">{activeReq.returnDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Travel Days:</span>
                <span className="font-bold text-[#101B35]">{activeReq.daysCount} Days</span>
              </div>
            </div>
          </div>

          {/* Section B: Detailed Accounting Schedule & Breakdown Table */}
          <div className="mt-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-white bg-[#101B35] p-2.5 rounded-t border-l-4 border-[#D4AF37]">
              Section B: Itemized Per Diem Computation Schedule
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-[#F4F6FA] text-[#101B35] font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 border-r border-slate-300">Allowance Component</th>
                    <th className="p-2.5 border-r border-slate-300">Rate Calculation</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">Days / Units</th>
                    <th className="p-2.5 text-right">Amount (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-semibold">
                      Daily Subsistence &amp; Meal Allowance
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-600 tabular-nums">
                      {breakdown.dailyAllowanceRate.toLocaleString()} ETB / day (Dest. Factor:{' '}
                      {breakdown.destinationMultiplier}x)
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-medium tabular-nums">
                      {breakdown.days} days
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#101B35] tabular-nums">
                      {(breakdown.dailyAllowanceRate * breakdown.days).toLocaleString()} ETB
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-semibold">
                      Hotel &amp; Lodging Allowance
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-600 tabular-nums">
                      {breakdown.lodgingAllowanceRate.toLocaleString()} ETB / night
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-medium tabular-nums">
                      {breakdown.days} nights
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#101B35] tabular-nums">
                      {(breakdown.lodgingAllowanceRate * breakdown.days).toLocaleString()} ETB
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-semibold">
                      Transportation Subsidy / Allowance
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-600">
                      {activeReq.transportMode.replace(/_/g, ' ')}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-medium">
                      1 trip
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#101B35] tabular-nums">
                      {breakdown.transportAllowance.toLocaleString()} ETB
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-semibold">
                      Field Research Incidentals &amp; Communication
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-600">
                      200 ETB / day fixed university standard
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-medium tabular-nums">
                      {breakdown.days} days
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#101B35] tabular-nums">
                      {breakdown.incidentals.toLocaleString()} ETB
                    </td>
                  </tr>
                  <tr className="bg-[#F4F6FA] font-bold border-t-2 border-[#101B35]">
                    <td
                      colSpan={3}
                      className="p-3 text-right uppercase tracking-wider text-[#101B35]"
                    >
                      Total Net Per Diem Disbursement:
                    </td>
                    <td className="p-3 text-right font-mono text-base font-black text-[#101B35] tabular-nums">
                      {breakdown.totalPerDiem.toLocaleString()} ETB
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Formal Verification & Physical Sign-Off Fields (No invented stamps or fake signatures) */}
          <div className="mt-7 pt-5 border-t-2 border-[#101B35]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              {/* 1. Claimant */}
              <div className="flex flex-col justify-between min-h-[124px] border border-slate-300 rounded-lg p-3.5 bg-[#F4F6FA]/50">
                <div>
                  <span className="font-bold text-[#101B35] uppercase text-[10px] block">
                    1. Claimed By (Employee)
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">{activeReq.employeeName}</p>
                  <p className="text-[11px] text-slate-500">
                    Submitted: {activeReq.createdAt.split(',')[0]}
                  </p>
                </div>
                <div className="mt-6 pt-1.5 border-t border-dashed border-slate-400 text-[10px] text-slate-600">
                  Claimant Signature &amp; Date
                </div>
              </div>

              {/* 2. Administrator */}
              <div className="flex flex-col justify-between min-h-[124px] border border-slate-300 rounded-lg p-3.5 bg-[#F4F6FA]/50">
                <div>
                  <span className="font-bold text-[#101B35] uppercase text-[10px] block">
                    2. Authorized By (Administration)
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {activeReq.approval?.reviewedBy || 'Pending Administrative Review'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Status: {activeReq.approval?.decision || activeReq.status.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="mt-6 pt-1.5 border-t border-dashed border-slate-400 text-[10px] text-slate-600">
                  Authorized Signature &amp; Official Office Seal
                </div>
              </div>

              {/* 3. Finance Officer */}
              <div className="flex flex-col justify-between min-h-[124px] border border-slate-300 rounded-lg p-3.5 bg-[#F4F6FA]/50">
                <div>
                  <span className="font-bold text-[#101B35] uppercase text-[10px] block">
                    3. Audited &amp; Disbursed (Finance)
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {activeReq.payment ? payment.processedBy : 'Awaiting Treasury Settlement'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Status: {payment.paymentStatus}
                  </p>
                </div>
                <div className="mt-6 pt-1.5 border-t border-dashed border-slate-400 text-[10px] text-slate-600">
                  Finance Officer Signature &amp; Treasury Seal
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>
                Oda Bultum University &middot; Productive Mind for Development &middot; Chiro, Oromia
              </span>
              <span>Tel: +251 25 651 0040 &middot; obuofficial@obu.edu.et &middot; obu.edu.et</span>
              <span className="font-mono font-semibold text-[#101B35]">
                Ref: {payment.voucherNumber}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ================= PRINTABLE PER DIEM SUMMARY REPORT (OBU-FIN-RPT) ================= */
        <div className="bg-white border-2 border-[#101B35] shadow-xl rounded-xl p-6 sm:p-8 max-w-5xl mx-auto text-[#101B35] print:border print:border-[#101B35] print:shadow-none print:p-6 print:max-w-full">
          {/* Official Report Header */}
          <div className="border-b-2 border-[#101B35] pb-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <ObuCrest size={74} onDark={false} className="shrink-0" />

              <div className="flex-1 text-center px-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#101B35] font-serif">
                  ODA BULTUM UNIVERSITY
                </h1>
                <p className="text-xs font-serif italic text-[#B59024] font-semibold mt-0.5">
                  &ldquo;Productive Mind for Development&rdquo;
                </p>
                <p className="text-xs font-bold text-[#101B35] uppercase tracking-widest mt-1">
                  DIRECTORATE OF FINANCE &amp; RESOURCE MANAGEMENT
                </p>
                <div className="inline-block bg-[#101B35] text-white border border-[#D4AF37] font-bold text-xs uppercase px-4 py-1 rounded mt-2 tracking-wider">
                  Official Travel &amp; Per Diem Summary Report
                </div>
              </div>

              <div className="text-center sm:text-right text-xs font-mono shrink-0">
                <div className="font-bold text-[#101B35]">FORM: OBU-FIN-RPT</div>
                <div className="text-slate-600 mt-0.5">Generated:</div>
                <div className="font-semibold text-[#101B35]">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Totals Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
            <div className="p-3.5 rounded-lg border border-slate-300 bg-[#F4F6FA]">
              <span className="text-[10px] font-bold uppercase text-slate-600 block">
                Total Claims Recorded
              </span>
              <span className="text-lg font-black text-[#101B35] font-mono tabular-nums">
                {requests.length} Claims ({totalClaimedAmount.toLocaleString()} ETB)
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-300 bg-[#F4F6FA]">
              <span className="text-[10px] font-bold uppercase text-slate-600 block">
                Approved Pending Disbursement
              </span>
              <span className="text-lg font-black text-[#101B35] font-mono tabular-nums">
                {totalPendingPayment.toLocaleString()} ETB
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-[#101B35] bg-[#101B35] text-white">
              <span className="text-[10px] font-bold uppercase text-[#D4AF37] block">
                Total Disbursed &amp; Settled
              </span>
              <span className="text-lg font-black text-white font-mono tabular-nums">
                {totalDisbursedAmount.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-[#101B35] text-white text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 border-r border-white/15">Tracking / Voucher</th>
                  <th className="p-2.5 border-r border-white/15">Employee &amp; Dept</th>
                  <th className="p-2.5 border-r border-white/15">Destination &amp; Dates</th>
                  <th className="p-2.5 border-r border-white/15 text-center">Days</th>
                  <th className="p-2.5 border-r border-white/15 text-right">Amount (ETB)</th>
                  <th className="p-2.5">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F4F6FA]/70">
                    <td className="p-2.5 border-r border-slate-200 font-mono">
                      <span className="font-bold text-[#101B35] block">{r.trackingCode}</span>
                      {r.payment?.voucherNumber && (
                        <span className="text-[10px] text-slate-600">{r.payment.voucherNumber}</span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-slate-200">
                      <span className="font-bold text-[#101B35] block">{r.employeeName}</span>
                      <span className="text-[10px] text-slate-600">{r.department}</span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200">
                      <span className="font-medium text-slate-800 block">{r.destination}</span>
                      <span className="text-[10px] text-slate-500">
                        {r.departureDate} &rarr; {r.returnDate}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-mono tabular-nums">
                      {r.daysCount}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold text-[#101B35] tabular-nums">
                      {r.breakdown.totalPerDiem.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-[11px] font-semibold">
                      {r.status.replace(/_/g, ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Physical Report Verification Block */}
          <div className="mt-8 pt-5 border-t-2 border-[#101B35] grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="border border-slate-300 rounded-lg p-4 bg-[#F4F6FA]/40">
              <p className="font-bold uppercase text-[10px] text-[#101B35]">
                Prepared &amp; Verified By (Finance Directorate)
              </p>
              <div className="mt-10 pt-1.5 border-t border-dashed border-slate-400 text-[10px] text-slate-600">
                Name, Signature &amp; Official Directorate Stamp
              </div>
            </div>
            <div className="border border-slate-300 rounded-lg p-4 bg-[#F4F6FA]/40">
              <p className="font-bold uppercase text-[10px] text-[#101B35]">
                Reviewed &amp; Endorsed By (University Administration)
              </p>
              <div className="mt-10 pt-1.5 border-t border-dashed border-slate-400 text-[10px] text-slate-600">
                Name, Signature &amp; Official University Seal
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>
              Oda Bultum University &middot; Productive Mind for Development &middot; Chiro, Oromia
            </span>
            <span>Tel: +251 25 651 0040 &middot; obuofficial@obu.edu.et &middot; obu.edu.et</span>
          </div>
        </div>
      )}
    </div>
  );
};
