import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Lock,
  KeyRound,
  User,
  GraduationCap,
  Building,
  Briefcase,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import type { UserRole } from '../types/ncet';

interface AuthViewProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, role: UserRole) => void;
  currentEmail?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentEmail,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState(currentEmail || 'priya.nair@ncetmail.com');
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('Priya Nair');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('3rd Year');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const isNcetDomain = email.trim().toLowerCase().endsWith('@ncetmail.com');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter an institutional email address.');
      return;
    }
    if (!isNcetDomain) {
      setErrorMessage('Access restricted: Only official @ncetmail.com addresses are permitted.');
      return;
    }
    setOtpSent(true);
    setOtpCode('849201'); // Pre-fill mock OTP for smooth demo
  };

  const handleVerifyAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMessage('Please enter the 6-digit OTP sent to your NCET inbox.');
      return;
    }
    onLogin(email.trim(), role);
    onClose();
  };

  const handleQuickDemo = (demoEmail: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setRole(demoRole);
    setOtpSent(true);
    setOtpCode('849201');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header gradient banner */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">NCET Verified Access</h2>
              <p className="text-xs text-emerald-100">
                Institutional Domain Authentication & Role-Based Campus Portal
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3">
          <button
            onClick={() => {
              setMode('signin');
              setErrorMessage('');
            }}
            className={`border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
              mode === 'signin'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In with NCET Mail
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
            }}
            className={`ml-6 border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
              mode === 'signup'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Student Onboarding
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Demo Identities */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Demo Accounts (Quick Select)
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('priya.nair@ncetmail.com', 'student')}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
              >
                <GraduationCap className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="font-medium truncate">Priya Nair (Student)</div>
                  <div className="text-[10px] text-slate-500 truncate">priya.nair@ncetmail.com</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@ncetmail.com', 'admin')}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
              >
                <Shield className="h-4 w-4 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <div className="font-medium truncate">Campus Admin</div>
                  <div className="text-[10px] text-slate-500 truncate">admin@ncetmail.com</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('dr.kavitha.sharma@ncetmail.com', 'faculty')}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300 hover:border-purple-500 hover:text-purple-300"
              >
                <Building className="h-4 w-4 text-purple-400 shrink-0" />
                <div className="truncate">
                  <div className="font-medium truncate">Dr. Kavitha (Faculty)</div>
                  <div className="text-[10px] text-slate-500 truncate">dr.kavitha@ncetmail.com</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('rohan.mehta@ncetmail.com', 'startup')}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300 hover:border-amber-500 hover:text-amber-300"
              >
                <Briefcase className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="font-medium truncate">Rohan Mehta (Startup)</div>
                  <div className="text-[10px] text-slate-500 truncate">rohan.mehta@ncetmail.com</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={otpSent ? handleVerifyAndSubmit : handleSendOtp} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="e.g. Priya Nair"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="AIML">AI & Machine Learning (AIML)</option>
                    <option value="ISE">Information Science (ISE)</option>
                    <option value="ECE">Electronics & Comm (ECE)</option>
                    <option value="ME">Mechanical Engg (ME)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Institutional Email Address
                </label>
                {email && (
                  <span
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      isNcetDomain ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isNcetDomain ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Valid @ncetmail.com
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" /> Must be @ncetmail.com
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="username@ncetmail.com"
                  required
                />
              </div>
            </div>

            {/* Role picker */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Account Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="student">Student (Full access to Circles, Events, Feed)</option>
                <option value="club_organizer">Club Organizer (Requires Admin Approval)</option>
                <option value="faculty">Faculty / Research Lab (Requires Approval)</option>
                <option value="startup">Startup Partner / Recruiter (Requires Approval)</option>
                <option value="ngo">NGO / Social Organization (Requires Approval)</option>
                <option value="admin">Administrator (Elevated Permissions)</option>
              </select>
            </div>

            {/* OTP verification block */}
            {otpSent ? (
              <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                    <KeyRound className="h-4 w-4 text-emerald-400" />
                    Enter 6-Digit OTP / Magic Code
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Demo Code: 849201
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="849201"
                  className="w-full text-center tracking-widest text-lg font-bold rounded-lg border border-emerald-500/40 bg-slate-950 py-2 text-emerald-400 placeholder-slate-600 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-500"
                >
                  Verify & Proceed to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!isNcetDomain}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-colors ${
                  isNcetDomain
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Send Magic Link / OTP to NCET Mail
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Security & Access Policies Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Lock className="h-3.5 w-3.5 text-cyan-400" />
              Institutional Security & Privacy Principles
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Domain Verification:</strong> Signup strictly restricted to official{' '}
                <span className="text-emerald-400">@ncetmail.com</span> addresses.
              </li>
              <li>
                <strong>Decoupled Community Identity:</strong> In Campus Circles, your name & email
                are masked behind a pseudonymous identity unless mutually revealed.
              </li>
              <li>
                <strong>RBAC Governance:</strong> Faculty, startups, and club organizers require
                administrative approval before publishing live listings.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
