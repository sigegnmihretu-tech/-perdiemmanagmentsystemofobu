import React from 'react';
import { User } from '../types/perdiem';
import { ObuCrest } from './ObuCrest';
import { LayoutDashboard, FileText, LogOut } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  activeTab: 'dashboard' | 'voucher';
  setActiveTab: (tab: 'dashboard' | 'voucher') => void;
  pendingAdminCount: number;
  pendingRegistrationCount: number;
  pendingFinanceCount: number;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  pendingAdminCount,
  pendingRegistrationCount,
  pendingFinanceCount,
  onLogout,
}) => {
  const totalAdminAlerts = pendingAdminCount + pendingRegistrationCount;
  const initials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <header className="bg-[#101B35] border-b border-[#D4AF37]/30 text-white sticky top-0 z-40 shadow-md print:hidden">
      {/* Top University Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <ObuCrest size={40} className="shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold tracking-wide text-white text-sm sm:text-base truncate">
                ODA BULTUM UNIVERSITY
              </span>
              <span className="hidden md:inline text-[11px] italic text-[#D4AF37] whitespace-nowrap">
                &ldquo;Productive Mind for Development&rdquo;
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              Official Per Diem Management System &middot; {currentUser.role} Workspace
            </p>
          </div>
        </div>

        {/* Authenticated Profile & Secure Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Verified Authenticated User Identity */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1A2B52] border border-[#D4AF37]/50 flex items-center justify-center shrink-0">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#D4AF37]">{initials}</span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white leading-tight whitespace-nowrap">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-mono truncate max-w-[170px]">
                {currentUser.employeeId}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#E2BE48] text-[#101B35] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Sign out of session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Role-Protected Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#D4AF37] text-[#101B35] shadow-sm'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>
              {currentUser.role === 'ADMINISTRATOR'
                ? 'Administrator Console'
                : currentUser.role === 'FINANCE'
                ? 'Finance Disbursement'
                : 'Employee Dashboard'}
            </span>
            {currentUser.role === 'ADMINISTRATOR' && totalAdminAlerts > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#101B35] text-[#D4AF37] tabular-nums">
                {totalAdminAlerts}
              </span>
            )}
            {currentUser.role === 'FINANCE' && pendingFinanceCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#101B35] text-[#D4AF37] tabular-nums">
                {pendingFinanceCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('voucher')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'voucher'
                ? 'bg-[#D4AF37] text-[#101B35] shadow-sm'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Vouchers &amp; Reports</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
