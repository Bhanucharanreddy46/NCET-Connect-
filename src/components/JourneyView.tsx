import React, { useState } from 'react';
import {
  Briefcase,
  Bookmark,
  CheckCircle2,
  Lock,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  Trash2,
  Plus,
  Shield,
  Fingerprint,
  FileText,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import type {
  OpportunityApplication,
  SavedOpportunity,
  Opportunity,
  AttendanceRecord,
  EncryptedVaultDoc,
  Recognition,
  LeaderboardEntry,
} from '../types/ncet';

interface JourneyViewProps {
  applications: OpportunityApplication[];
  savedOpportunities: SavedOpportunity[];
  allOpportunities: Opportunity[];
  attendanceRecords: AttendanceRecord[];
  vaultDocs: EncryptedVaultDoc[];
  recognitions: Recognition[];
  leaderboard: LeaderboardEntry[];
  currentStudentId: string;
  biometricUnlocked: boolean;
  onUnlockBiometric: (unlocked: boolean) => void;
  onWithdrawApplication: (applicationId: string) => void;
  onApplyOpportunity: (opportunityId: string) => void;
  onToggleSave: (opportunityId: string) => void;
  onCheckInAttendance: (passcode: string) => { success: boolean; message: string };
  onAddVaultDoc: (
    title: string,
    docType: EncryptedVaultDoc['docType'],
    rawContent: string
  ) => Promise<EncryptedVaultDoc>;
  onDeleteVaultDoc: (id: string) => Promise<void>;
  onDecryptVaultDoc: (doc: EncryptedVaultDoc) => Promise<string>;
}

export const JourneyView: React.FC<JourneyViewProps> = ({
  applications,
  savedOpportunities,
  allOpportunities,
  attendanceRecords,
  vaultDocs,
  recognitions,
  leaderboard,
  currentStudentId,
  biometricUnlocked,
  onUnlockBiometric,
  onWithdrawApplication,
  onApplyOpportunity,
  onToggleSave,
  onCheckInAttendance,
  onAddVaultDoc,
  onDeleteVaultDoc,
  onDecryptVaultDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'saved' | 'attendance' | 'vault' | 'honors'>('applications');
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);

  // Vault upload state
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'resume' | 'transcript' | 'id_card' | 'certificate'>('certificate');
  const [docContent, setDocContent] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [decryptedText, setDecryptedText] = useState<{ id: string; text: string } | null>(null);

  const oppMap = new Map(allOpportunities.map((o) => [o.id, o]));
  const myRecognitions = recognitions.filter((r) => r.studentId === currentStudentId);
  const myTotalPoints = myRecognitions.reduce((sum, r) => sum + r.points, 0);

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;
    const res = onCheckInAttendance(checkInCode.trim().toUpperCase());
    if (res.success) {
      setCheckInMessage(`✅ ${res.message}`);
      setCheckInCode('');
    } else {
      setCheckInMessage(`❌ ${res.message}`);
    }
  };

  const handleVaultUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) return;
    await onAddVaultDoc(
      docName.trim(),
      docCategory as EncryptedVaultDoc['docType'],
      docContent.trim()
    );
    setDocName('');
    setDocContent('');
    setUploadOpen(false);
  };

  const handleDecryptClick = async (doc: EncryptedVaultDoc) => {
    const text = await onDecryptVaultDoc(doc);
    setDecryptedText({ id: doc.id, text });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Briefcase className="h-4 w-4" />
              <span>Personal Academic & Career Pipeline</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white tracking-tight">
              My Journey
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Track your internship applications, bookmarked events, verified attendance passport,
              encrypted credentials vault, and earned honors badges.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center shrink-0">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
              <div className="text-[10px] text-slate-400">Active Apps</div>
              <div className="text-base font-bold text-white">{applications.length}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
              <div className="text-[10px] text-slate-400">Bookmarks</div>
              <div className="text-base font-bold text-amber-400">{savedOpportunities.length}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
              <div className="text-[10px] text-slate-400">Honor Pts</div>
              <div className="text-base font-bold text-emerald-400">{myTotalPoints}</div>
            </div>
          </div>
        </div>

        {/* Journey Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'applications'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'saved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Saved Items ({savedOpportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Attendance Passport ({attendanceRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'vault'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Encrypted Document Safe ({vaultDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('honors')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'honors'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Honors & Badges ({myRecognitions.length})
          </button>
        </div>
      </section>

      {/* SUB-TAB 1: APPLICATIONS PIPELINE */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Track stage conversion for your active applications and campus recruitment interviews.
          </div>

          {applications.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-xs text-slate-500">
              No active applications submitted yet. Browse the Explore tab to apply to campus events, hackathons, and internships!
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const opp = oppMap.get(app.opportunityId);
                return (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                            app.status === 'selected'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : app.status === 'shortlisted'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : app.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          Stage: {app.status}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Applied on {app.appliedAt.slice(0, 10)}
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-bold text-white">
                        {opp?.title || app.opportunityId}
                      </h3>
                      <div className="text-xs text-slate-400">{opp?.organization || 'Campus Organization'}</div>

                      {app.notes && (
                        <p className="mt-2 text-xs text-slate-400 italic">"{app.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {app.status === 'applied' && (
                        <button
                          onClick={() => onWithdrawApplication(app.id)}
                          className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
                        >
                          Withdraw
                        </button>
                      )}
                      <span className="text-xs text-slate-500">
                        Updated {app.updatedAt.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SAVED OPPORTUNITIES */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Bookmarked internships and hackathons saved for future application.
          </div>

          {savedOpportunities.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-xs text-slate-500">
              No bookmarked opportunities. Click the bookmark icon on any card to save it here!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedOpportunities.map((s) => {
                const opp = oppMap.get(s.opportunityId);
                if (!opp) return null;
                return (
                  <div
                    key={s.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                          {opp.type}
                        </span>
                        <button
                          onClick={() => onToggleSave(opp.id)}
                          className="text-amber-400 p-1 hover:text-white"
                          title="Remove bookmark"
                        >
                          <Bookmark className="h-4 w-4 fill-amber-400" />
                        </button>
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-white line-clamp-1">{opp.title}</h3>
                      <div className="text-[11px] text-slate-400">{opp.organization}</div>
                      <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>Deadline: {opp.deadline}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <button
                        onClick={() => onApplyOpportunity(opp.id)}
                        className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: ATTENDANCE & PASSCODE DESK */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Physical Venue Passcode Check-In Desk */}
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Live Venue Check-In (Passcode Desk)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Attending an in-person workshop or fest? Enter the organizer's 6-character code (e.g. <code>GDG782</code>, <code>HACK36</code>, <code>ROBO99</code>) to record verified attendance.
            </p>

            <form onSubmit={handleCheckInSubmit} className="flex gap-2 max-w-md">
              <input
                type="text"
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value)}
                placeholder="Enter 6-char passcode..."
                className="flex-1 uppercase tracking-widest text-center font-bold text-sm rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-cyan-300 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-500"
              >
                Verify Check-In
              </button>
            </form>

            {checkInMessage && (
              <div className="rounded-lg bg-slate-950 p-2.5 text-xs font-medium text-slate-200 border border-slate-800">
                {checkInMessage}
              </div>
            )}
          </div>

          {/* Verified Attendance History */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Verified Event Attendance Passport
            </h3>

            <div className="space-y-2">
              {attendanceRecords.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{att.opportunityTitle}</div>
                    <div className="text-[11px] text-slate-400">
                      Dept: {att.department} • Verified via {att.method}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                      Verified Present
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {att.markedAt.slice(0, 10)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ENCRYPTED DOCUMENT VAULT */}
      {activeTab === 'vault' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Client-Side AES-GCM Encrypted Document Safe
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Transcripts, government IDs, and degree certificates are encrypted locally using the Web Crypto API before storage.
              </p>
            </div>

            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              Secure New Document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaultDocs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                      <div className="text-[10px] text-slate-400 uppercase">
                        Category: {doc.docType}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteVaultDoc(doc.id)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 font-mono truncate">
                  Ciphertext: {doc.ciphertext.slice(0, 24)}...
                </div>

                <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                  <button
                    onClick={() => handleDecryptClick(doc)}
                    className="text-xs font-semibold text-emerald-400 hover:underline"
                  >
                    Decrypt & View Locally
                  </button>
                  <span className="text-[10px] text-slate-500">
                    Encrypted {doc.createdAt.slice(0, 10)}
                  </span>
                </div>

                {decryptedText?.id === doc.id && (
                  <div className="mt-2 rounded bg-slate-900 p-2 text-xs text-slate-200 border border-emerald-500/20 whitespace-pre-wrap">
                    🔓 <strong>Decrypted Content:</strong> {decryptedText.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Secure Upload Dialog */}
          {uploadOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
                <h3 className="text-base font-bold text-white">Encrypt & Store Document</h3>

                <form onSubmit={handleVaultUpload} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Document Name</label>
                    <input
                      type="text"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="e.g. 5th Sem Grade Card.pdf"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Category</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="transcript">Academic Transcript</option>
                      <option value="resume">Resume / CV</option>
                      <option value="certificate">Hackathon / Course Certificate</option>
                      <option value="id_card">College ID Card</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Document Text / Base64 Payload</label>
                    <textarea
                      rows={3}
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      placeholder="Enter sensitive document payload..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUploadOpen(false)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      Encrypt & Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: HONORS & BADGES */}
      {activeTab === 'honors' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                Verified Student Honors & Achievement Badges
              </h2>
              <p className="text-xs text-slate-400">
                Celebrates learning, open source contribution, hackathon participation, and peer mentorship.
              </p>
            </div>
            <span className="text-sm font-extrabold text-amber-400 font-mono">
              Total Points: {myTotalPoints} pts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {myRecognitions.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-amber-500/30 bg-slate-950 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{rec.recognitionType}</span>
                  <span className="rounded bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                    +{rec.points} pts
                  </span>
                </div>
                <p className="text-xs text-slate-400">{rec.reason}</p>
                <div className="text-[10px] text-slate-500">Awarded {rec.awardedAt.slice(0, 10)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
