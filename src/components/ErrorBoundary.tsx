import React from 'react';
import { signOut } from 'firebase/auth';
import { auth, FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID } from '../firebase';
import { ObuCrest } from './ObuCrest';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isQuotaError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isQuotaError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error?.message || 'An unexpected application error occurred.';
    let readable = raw;
    let isQuota = raw.toLowerCase().includes('quota exceeded');

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.error === 'string') {
        readable = parsed.error;
        isQuota = isQuota || parsed.error.toLowerCase().includes('quota exceeded');
      }
    } catch {
      // Plain error message
    }

    return {
      hasError: true,
      message: readable,
      isQuotaError: isQuota,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary captured error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleSignOutAndReload = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore sign-out errors during recovery
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const upgradeLink = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data?openUpgradeDialog=true`;

    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-[#101B35] px-6 py-4 text-white flex items-center gap-3 border-b border-[#D4AF37]/30">
            <ObuCrest size={38} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                Oda Bultum University &middot; Cloud Portal Recovery
              </p>
              <h1 className="font-serif text-lg font-bold">Connection or Permission Issue</h1>
            </div>
          </div>

          <div className="p-6 space-y-4 text-sm text-slate-700">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-bold">
                  {this.state.isQuotaError
                    ? 'Daily Cloud Database Quota Reached'
                    : 'Unable to complete the cloud database operation.'}
                </p>
                <p className="break-words">{this.state.message}</p>
                {this.state.isQuotaError && (
                  <p className="pt-1">
                    Free-tier quota resets daily, or an administrator can{' '}
                    <a
                      href={upgradeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-[#101B35]"
                    >
                      review the Firebase database plan
                    </a>
                    .
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleSignOutAndReload}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:border-[#101B35] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out &amp; Reset</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 text-xs font-bold text-white bg-[#101B35] hover:bg-[#1A2B52] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Reload Portal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
