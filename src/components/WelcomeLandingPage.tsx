import React from 'react';
import { AuthPortalRole } from '../types/perdiem';
import { ObuCrest } from './ObuCrest';
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface WelcomeLandingPageProps {
  onNavigateLogin: (preferredRole?: AuthPortalRole) => void;
  onNavigateRegister: () => void;
}

export const WelcomeLandingPage: React.FC<WelcomeLandingPageProps> = ({
  onNavigateLogin,
  onNavigateRegister,
}) => {
  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#101B35] flex flex-col">
      {/* Top Bar: Strict 3-zone contract */}
      <header className="bg-[#101B35] text-white border-b border-[#D4AF37]/25 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title (single line with crest) */}
          <a
            href="#top"
            className="flex items-center gap-3 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded"
          >
            <ObuCrest size={34} />
            <span className="font-serif font-bold tracking-wide text-sm sm:text-base text-white">
              ODA BULTUM UNIVERSITY
            </span>
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-200">
            <a
              href="#overview"
              className="hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#workflow"
              className="hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <a
              href="#policy"
              className="hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              Per Diem Rates
            </a>
            <a
              href="#portals"
              className="hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              Role Portals
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              onClick={() => onNavigateLogin('EMPLOYEE')}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-[#D4AF37] text-[#101B35] hover:bg-[#E2BE48] transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              Portal Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1">
        {/* Hero Section */}
        <section id="overview" className="bg-[#101B35] text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Column: University Identity & Primary Entry CTAs */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                <div className="flex items-center gap-4">
                  <ObuCrest size={68} className="shrink-0" />
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#D4AF37]">
                      Oda Bultum University
                    </p>
                    <p className="font-serif italic text-sm text-white mt-0.5">
                      &ldquo;Productive Mind for Development&rdquo;
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Directorate of Finance &amp; Academic Administration
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h1
                    className="font-serif font-bold text-white leading-tight tracking-tight"
                    style={{ fontSize: 'clamp(2.1rem, 3.8vw, 3.35rem)', textWrap: 'balance' }}
                  >
                    Official Per Diem Management System
                  </h1>
                  <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
                    Welcome to the centralized institutional portal for Oda Bultum University travel
                    authorization, standardized per diem computation, administrative review, and
                    treasury disbursement.
                  </p>
                </div>

                {/* Primary & Secondary Entry Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                  <button
                    onClick={() => onNavigateLogin('EMPLOYEE')}
                    className="min-h-[48px] px-7 py-3 rounded-lg bg-[#D4AF37] hover:bg-[#E2BE48] text-[#101B35] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors shadow-lg cursor-pointer whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login to Portal</span>
                  </button>

                  <button
                    onClick={onNavigateRegister}
                    className="min-h-[48px] px-7 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/25 font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                    <span>Create Employee Account</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-white/15 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
                  <span>Role-Verified Access</span>
                  <span aria-hidden="true" className="text-[#D4AF37]">&middot;</span>
                  <span>Chiro Campus, Oromia</span>
                  <span aria-hidden="true" className="text-[#D4AF37]">&middot;</span>
                  <span>Est. 2015</span>
                </div>
              </div>

              {/* Right Column: Authentic Oda Bultum University Campus Photograph */}
              <div className="lg:col-span-6 flex">
                <div className="relative w-full rounded-xl overflow-hidden border border-[#D4AF37]/35 bg-[#101B35] min-h-[300px] sm:min-h-[380px] lg:min-h-[440px]">
                  <img
                    src="/assets/obu/campus-2.jpg"
                    alt="Oda Bultum University Main Campus Grounds and Academic Buildings in Chiro"
                    className="w-full h-full object-cover"
                  />
                  {/* Measured Bottom Scrim */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101B35]/95 via-[#101B35]/70 to-transparent p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                      Oda Bultum University &middot; Chiro Campus
                    </p>
                    <p className="text-sm sm:text-base font-medium text-white mt-1">
                      Transparent travel claims and auditable payment vouchers across all university colleges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Institutional Workflow Section */}
        <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#B59024]">
              End-to-End Accountability
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#101B35] mt-1.5">
              Three-Stage University Approval Lifecycle
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              Every official trip follows a verified institutional chain from employee submission to
              administrative authorization and treasury disbursement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-sm font-bold text-[#D4AF37] bg-[#101B35] px-2.5 py-1 rounded">
                    01
                  </span>
                  <Calculator className="w-5 h-5 text-[#101B35]" />
                </div>
                <h3 className="text-lg font-bold text-[#101B35]">
                  Employee Claim &amp; Calculation
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Academic and support staff submit travel requests with itinerary dates, transport
                  modes, and automatically calculated per diem rates in ETB.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                Requires Administrator-approved employee account
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-sm font-bold text-[#D4AF37] bg-[#101B35] px-2.5 py-1 rounded">
                    02
                  </span>
                  <ShieldCheck className="w-5 h-5 text-[#101B35]" />
                </div>
                <h3 className="text-lg font-bold text-[#101B35]">
                  Administrator Review &amp; Authorization
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Deans and Vice Presidents inspect purpose and budget ceilings to approve claims
                  for Finance or return them to the employee with notes.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                Authorizes new employee registrations &amp; staff roles
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-sm font-bold text-[#D4AF37] bg-[#101B35] px-2.5 py-1 rounded">
                    03
                  </span>
                  <CreditCard className="w-5 h-5 text-[#101B35]" />
                </div>
                <h3 className="text-lg font-bold text-[#101B35]">
                  Finance Payment &amp; Voucher Report
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Finance officers process CBE transfers, Telebirr, or cheque disbursements and
                  issue official OBU-FIN-08 printable settlement vouchers.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                Full financial audit trail &amp; voucher archiving
              </div>
            </div>
          </div>
        </section>

        {/* Standardized Rate Schedule */}
        <section id="policy" className="bg-white border-y border-slate-200 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#B59024]">
                  University Financial Policy
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#101B35] mt-1">
                  Standardized Per Diem Allowance Schedule
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                All allowances computed in Ethiopian Birr (ETB) with destination multipliers
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#101B35] text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5 font-semibold">Staff Classification</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Daily Subsistence</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Lodging Allowance</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Addis Ababa Index</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Remote Field Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                  <tr className="hover:bg-[#F4F6FA] transition-colors">
                    <td className="py-3.5 px-5 font-semibold">Senior Academic / Dean / Professor</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">1,200 ETB</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">1,800 ETB</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-[#101B35] font-semibold">1.25&times;</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-[#101B35] font-semibold">1.15&times;</td>
                  </tr>
                  <tr className="hover:bg-[#F4F6FA] transition-colors">
                    <td className="py-3.5 px-5 font-semibold">Lecturer / Field Researcher</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">900 ETB</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">1,400 ETB</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-[#101B35] font-semibold">1.25&times;</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-[#101B35] font-semibold">1.15&times;</td>
                  </tr>
                  <tr className="hover:bg-[#F4F6FA] transition-colors">
                    <td className="py-3.5 px-5 font-semibold">Administrative &amp; Support Staff</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">600 ETB</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">1,000 ETB</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-[#101B35] font-semibold">1.25&times;</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-[#101B35] font-semibold">1.15&times;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Role-Based Portal Entry Gateways */}
        <section id="portals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#B59024]">
              Authorized System Entry
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#101B35] mt-1.5">
              Select Your University Portal
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Access is strictly governed by verified institutional roles. Choose your designated
              sign-in gateway or register as an employee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Employee Access */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#101B35] text-[#D4AF37] flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#101B35]">Employee Access</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  For OBU faculty, researchers, and staff submitting travel requests and tracking
                  per diem disbursements.
                </p>
              </div>
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => onNavigateLogin('EMPLOYEE')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#101B35] hover:bg-[#1A2B52] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Employee Login</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
                <button
                  onClick={onNavigateRegister}
                  className="w-full min-h-[42px] px-4 py-2 rounded-lg border border-slate-300 hover:border-[#101B35] text-[#101B35] text-xs font-semibold transition-colors cursor-pointer"
                >
                  New Staff? Register Account
                </button>
              </div>
            </div>

            {/* Administrator Access */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#101B35] text-[#D4AF37] flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#101B35]">Administrator Access</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  For Deans, Academic Vice Presidents, and System Administrators reviewing claims and
                  authorizing staff accounts.
                </p>
              </div>
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => onNavigateLogin('ADMINISTRATOR')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#101B35] hover:bg-[#1A2B52] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Administrator Login</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
                <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1 pt-1">
                  <Lock className="w-3 h-3" />
                  <span>Authorized by System Administration only</span>
                </p>
              </div>
            </div>

            {/* Finance Access */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#101B35] text-[#D4AF37] flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#101B35]">Finance Directorate Access</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  For Finance Officers and University Cashiers disbursing approved per diem funds and
                  issuing payment vouchers.
                </p>
              </div>
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => onNavigateLogin('FINANCE')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#101B35] hover:bg-[#1A2B52] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Finance Login</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
                <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1 pt-1">
                  <Lock className="w-3 h-3" />
                  <span>Authorized by System Administration only</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Authentic OBU Campus Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#B59024]">
                Chiro Main Campus &middot; Productive Mind for Development
              </p>
              <h2 className="font-serif text-2xl font-bold text-[#101B35] mt-1">
                Oda Bultum University Campus
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Empowering ethical, competent and innovative graduates through quality education,
              problem-solving research and meaningful community engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                <img
                  src="/assets/obu/obu-campus-hero.jpg"
                  alt="Oda Bultum University academic leadership and graduating community"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-[#101B35]">Academic Community</p>
                <p className="text-xs text-slate-600 mt-1">
                  Faculty leadership, research scholars, and graduating cohorts at Chiro Campus.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                <img
                  src="/assets/obu/campus-1.jpg"
                  alt="Oda Bultum University Campus Building"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-[#101B35]">University Facilities</p>
                <p className="text-xs text-slate-600 mt-1">
                  Multi-story academic complexes supporting colleges and administrative directorates.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                <img
                  src="/assets/obu/campus-3.jpg"
                  alt="Oda Bultum University Chiro Grounds"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-[#101B35]">Chiro Campus Grounds</p>
                <p className="text-xs text-slate-600 mt-1">
                  Main university grounds in West Hararghe, Oromia Regional State, Ethiopia.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-[#101B35] text-slate-300 border-t border-[#D4AF37]/25 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ObuCrest size={32} />
            <div>
              <span className="font-semibold text-white">Oda Bultum University</span>
              <span className="mx-2 text-[#D4AF37]">&middot;</span>
              <span className="italic text-slate-200">Productive Mind for Development</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chiro, West Hararghe, Oromia, Ethiopia &middot; Tel: +251 25 651 0040 &middot; obuofficial@obu.edu.et
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              onClick={() => onNavigateLogin('EMPLOYEE')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Portal Login
            </button>
            <button
              onClick={onNavigateRegister}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Employee Registration
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
