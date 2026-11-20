import React, { useState, useEffect } from 'react';
import { User, TravelRequest, DestinationTier, TransportMode } from '../types/perdiem';
import { calculatePerDiem, DESTINATION_TIERS, TRANSPORT_ALLOWANCE, STAFF_RATES } from '../utils/perDiemCalculator';
import { ObuCrest } from './ObuCrest';
import { 
  Send, 
  Plus, 
  Calendar, 
  MapPin, 
  Car, 
  Calculator, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';

interface EmployeePortalProps {
  currentUser: User;
  requests: TravelRequest[];
  onSubmitRequest: (newReq: Partial<TravelRequest>) => void;
  onViewVoucher: (req: TravelRequest) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  currentUser,
  requests,
  onSubmitRequest,
  onViewVoucher,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  // Form fields
  const [destination, setDestination] = useState('Addis Ababa (Ministry of Education & ASTU)');
  const [destinationTier, setDestinationTier] = useState<DestinationTier>('CAPITAL');
  const [purpose, setPurpose] = useState('Research collaboration, laboratory equipment calibration, and conference presentation');
  const [departureDate, setDepartureDate] = useState('2026-11-20');
  const [returnDate, setReturnDate] = useState('2026-11-24');
  const [transportMode, setTransportMode] = useState<TransportMode>('PUBLIC_TRANSPORT');
  const [notes, setNotes] = useState('Department authorized travel under fiscal research allotment.');

  // Calculate days dynamically
  const calcDays = () => {
    try {
      const dep = new Date(departureDate);
      const ret = new Date(returnDate);
      const diffTime = ret.getTime() - dep.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
    } catch {
      return 1;
    }
  };

  const daysCount = calcDays();

  // Real-time calculated per diem breakdown
  const previewBreakdown = calculatePerDiem(
    currentUser.staffTier,
    destinationTier,
    transportMode,
    daysCount
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitRequest({
      employeeUid: currentUser.uid || currentUser.id,
      employeeId: currentUser.employeeId || currentUser.id,
      employeeName: currentUser.name,
      employeeRole: currentUser.jobPosition || currentUser.staffTier.replace(/_/g, ' '),
      department: currentUser.department,
      destination,
      destinationTier,
      purpose,
      departureDate,
      returnDate,
      daysCount,
      transportMode,
      breakdown: previewBreakdown,
      notes,
    });
    setIsCreateModalOpen(false);
  };

  // Filter requests for current employee
  const myRequests = requests.filter(
    (r) =>
      (currentUser.uid && r.employeeUid === currentUser.uid) ||
      r.employeeId === currentUser.id ||
      r.employeeId === currentUser.employeeId
  );

  return (
    <div className="space-y-6">
      {/* Top Action Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-[#101B35] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <ObuCrest size={48} onDark={false} className="hidden sm:inline-flex mt-0.5 ring-1 ring-slate-200" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-[#101B35] uppercase tracking-wider">
                Oda Bultum University &middot; Employee Dashboard
              </span>
              <span aria-hidden="true" className="text-slate-300">&middot;</span>
              <span className="italic text-[#B59024] font-medium">
                Productive Mind for Development
              </span>
              <span aria-hidden="true" className="text-slate-300">&middot;</span>
              <span className="text-slate-500 font-mono">{currentUser.employeeId}</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#101B35] mt-1">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Submit official travel authorization claims and calculate per diem allowances in accordance with Oda Bultum University regulations.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#101B35] hover:bg-[#1A2B52] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer border border-[#D4AF37]/40"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>New Travel Request</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>My Travel Claims &amp; Per Diem Applications</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal">
              {myRequests.length} total
            </span>
          </h3>
        </div>

        {myRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No travel requests submitted yet. Click "New Travel Request" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tracking Code</th>
                  <th className="py-3 px-4">Destination &amp; Purpose</th>
                  <th className="py-3 px-4">Dates &amp; Duration</th>
                  <th className="py-3 px-4">Calculated Per Diem</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {req.trackingCode}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {req.createdAt}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{req.destination}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{req.purpose}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">
                        {req.departureDate} &rarr; {req.returnDate}
                      </div>
                      <span className="text-[11px] text-[#B59024] font-semibold">
                        {req.daysCount} days
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#101B35] text-sm font-mono tabular-nums">
                        {req.breakdown.totalPerDiem.toLocaleString()} ETB
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono tabular-nums">
                        {req.breakdown.totalDaily.toLocaleString()} ETB / day
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {req.status === 'SUBMITTED_FOR_APPROVAL' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Awaiting Admin Review
                        </span>
                      )}
                      {req.status === 'APPROVED_BY_ADMIN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-300">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          Admin Approved &rarr; In Finance
                        </span>
                      )}
                      {req.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Disbursed &amp; Paid
                        </span>
                      )}
                      {req.status === 'REJECTED_BY_ADMIN' && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Rejected by Admin
                          </span>
                          {req.approval?.remarks && (
                            <p className="text-[10px] text-rose-700 mt-1 max-w-[200px] leading-tight">
                              Note: {req.approval.remarks}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'COMPLETED' ? (
                        <button
                          onClick={() => onViewVoucher(req)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Voucher</span>
                        </button>
                      ) : req.status === 'REJECTED_BY_ADMIN' ? (
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          <span>Revise &amp; Reapply</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Travel Request & Per Diem Calculator Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101B35]/65 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#101B35] px-6 py-4 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-3">
                <ObuCrest size={38} />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
                    Oda Bultum University &middot; Submission &amp; Calculation
                  </span>
                  <h3 className="font-serif text-base font-bold text-white">
                    OBU Travel Authorization &amp; Per Diem Calculation Form
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Employee Baseline Info Bar */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Applicant:</span>
                  <span className="font-bold text-slate-800">{currentUser.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Staff Tier / Grade:</span>
                  <span className="font-bold text-slate-800">{STAFF_RATES[currentUser.staffTier].label}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Department:</span>
                  <span className="font-bold text-slate-800">{currentUser.department}</span>
                </div>
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Destination */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trip Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Addis Ababa (Ministry of Innovation & Technology)"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Destination Tier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destination Rate Category *
                  </label>
                  <select
                    value={destinationTier}
                    onChange={(e) => setDestinationTier(e.target.value as DestinationTier)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="CAPITAL">Category 1: Federal Capital (Addis Ababa) [+25% Index]</option>
                    <option value="REGIONAL_CITY">Category 2: Regional City (Adama, Hawassa, Chiro, Harar) [Standard]</option>
                    <option value="REMOTE_WOREDA">Category 3: Field / Remote Research Site [+15% Hardship]</option>
                  </select>
                </div>

                {/* Transport Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transportation Mode *
                  </label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="UNIVERSITY_VEHICLE">University Vehicle (Fleet Provided - 0 ETB Allowance)</option>
                    <option value="PUBLIC_TRANSPORT">Public Intercity Transport (600 ETB Allowance)</option>
                    <option value="FLIGHT">Domestic Flight (350 ETB Shuttle Allowance)</option>
                    <option value="PERSONAL_CAR">Personal Car (1,200 ETB Fuel &amp; Subsidy)</option>
                  </select>
                </div>

                {/* Departure Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Return Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Purpose */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Travel Purpose &amp; Academic Justification *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe academic, research, or administrative mission details..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time Per Diem Calculator Breakdown Box */}
              <div className="bg-[#F4F6FA] border-2 border-[#D4AF37]/60 rounded-xl p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#101B35]" />
                    <span className="text-xs font-bold text-[#101B35] uppercase tracking-wider">
                      Automated Per Diem Breakdown
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#B59024]">
                    Duration: {daysCount} Days
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block">Daily Meal Rate:</span>
                    <span className="font-bold text-[#101B35] font-mono tabular-nums">
                      {previewBreakdown.dailyAllowanceRate.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block">Lodging Allowance:</span>
                    <span className="font-bold text-[#101B35] font-mono tabular-nums">
                      {previewBreakdown.lodgingAllowanceRate.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block">Transport Allowance:</span>
                    <span className="font-bold text-[#101B35] font-mono tabular-nums">
                      {previewBreakdown.transportAllowance.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] block">Contingency / Incidentals:</span>
                    <span className="font-bold text-[#101B35] font-mono tabular-nums">
                      {previewBreakdown.incidentals.toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101B35]">
                    Grand Total Per Diem Entitlement:
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#101B35] font-mono tabular-nums">
                      {previewBreakdown.totalPerDiem.toLocaleString()} ETB
                    </span>
                    <span className="block text-[10px] text-[#B59024] font-medium">
                      (Includes living index multiplier {previewBreakdown.destinationMultiplier}x)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#101B35] border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Submit for Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
