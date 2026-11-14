import React, { useState } from 'react';
import {
  Award,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  Lock,
  Mail,
  QrCode,
  Save,
  Shield,
  UserCheck,
} from 'lucide-react';
import { DEPARTMENTS, YEARS } from '../data/seedData';
import type {
  ApplicationRecord,
  AttendanceRecord,
  CommunityAlias,
  Opportunity,
  StudentProfile,
  StudentRecognitionBadge,
} from '../types/ncet';
import {
  clearBiometricPasskey,
  enrollBiometricPasskey,
  getEnrolledBiometricId,
  verifyBiometricPasskey,
} from '../utils/biometric';
import { computeSkillGaps } from '../utils/recommender';

interface ProfileAdvisorViewProps {
  profile: StudentProfile;
  opportunities: Opportunity[];
  applications: ApplicationRecord[];
  alias?: CommunityAlias;
  badges?: StudentRecognitionBadge[];
  attendanceRecords?: AttendanceRecord[];
  onSaveProfile: (next: StudentProfile) => Promise<void>;
  onUnlockBiometric: (unlocked: boolean) => void;
  onTriggerNotification: (title: string, body: string, channel: 'push' | 'email') => Promise<void>;
  onNavigateToAnonymous?: () => void;
}

export const ProfileAdvisorView: React.FC<ProfileAdvisorViewProps> = ({
  profile,
  opportunities,
  applications,
  alias,
  badges = [],
  attendanceRecords = [],
  onSaveProfile,
  onUnlockBiometric,
  onTriggerNotification,
  onNavigateToAnonymous,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [department, setDepartment] = useState(profile.department);
  const [year, setYear] = useState(profile.year);
  const [skillsText, setSkillsText] = useState(profile.skills.join(', '));
  const [interestsText, setInterestsText] = useState(profile.interests.join(', '));
  const [availabilityText, setAvailabilityText] = useState(profile.availability.join(', '));
  const [goalsText, setGoalsText] = useState(profile.careerGoals.join(', '));
  const [bio, setBio] = useState(profile.bio);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const [biometricId, setBiometricId] = useState<string | null>(() => getEnrolledBiometricId());
  const [biometricStatus, setBiometricStatus] = useState<string | null>(null);

  // High-thinking AI Career Strategist state
  const [advisorQuestion, setAdvisorQuestion] = useState(
    'What skills and campus projects should I prioritize over the next 6 weeks to convert my internship interviews?'
  );
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResult, setAdvisorResult] = useState<{
    strategy: string;
    actionPlan: string[];
    modelUsed: string;
  } | null>(null);
  const [digestPreview, setDigestPreview] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parseList = (val: string) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    await onSaveProfile({
      ...profile,
      displayName: displayName.trim() || profile.displayName,
      department,
      year,
      skills: parseList(skillsText),
      interests: parseList(interestsText),
      availability: parseList(availabilityText),
      careerGoals: parseList(goalsText),
      bio: bio.trim(),
      updatedAt: new Date().toISOString(),
    });
    setSavedNotice('Profile updated and recommendation weights recalculated.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleEnrollBiometric = async () => {
    const res = await enrollBiometricPasskey(profile.uid, profile.displayName);
    setBiometricId(res.credentialId);
    onUnlockBiometric(true);
    setBiometricStatus(
      res.mode === 'webauthn'
        ? 'Platform WebAuthn biometric passkey enrolled.'
        : 'Device passkey credential enrolled for quick unlock.'
    );
  };

  const handleVerifyBiometric = async () => {
    const res = await verifyBiometricPasskey();
    onUnlockBiometric(res.verified);
    setBiometricStatus(
      res.verified
        ? `Biometric identity verified (${res.mode}).`
        : 'No enrolled credential found.'
    );
  };

  const handleEnablePush = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore in sandbox
      }
    }
    await onTriggerNotification(
      'Goal Reminder Armed',
      'Weekly internship goal nudges and interview alerts are active on this device.',
      'push'
    );
    setBiometricStatus('Push goal reminders enabled and test notification dispatched.');
  };

  const handleSendEmailDigest = async () => {
    const resp = await fetch('/api/reminders/digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: profile.displayName,
        email: `${profile.displayName.toLowerCase().replace(/\s+/g, '.')}@ncet.edu`,
        applications,
        upcomingOpportunities: opportunities.filter((o) => o.status === 'published').slice(0, 3),
      }),
    });
    const data = await resp.json();
    setDigestPreview(`${data.subject}\n\n${data.preview}`);
    await onTriggerNotification(
      'Automated Email Digest Dispatched',
      data.subject,
      'email'
    );
  };

  const handleRunDeepAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorQuestion.trim()) return;
    setAdvisorLoading(true);
    try {
      const skillGaps = computeSkillGaps(opportunities, profile.skills);
      const resp = await fetch('/api/advisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          targetGoal: profile.careerGoals[0] || 'Product Engineering Internship',
          marketSkillGaps: skillGaps,
          question: advisorQuestion,
        }),
      });
      const data = await resp.json();
      setAdvisorResult({
        strategy: data.strategy,
        actionPlan: data.actionPlan || [],
        modelUsed: data.modelUsed || 'gemini-4-hydrogen',
      });
    } finally {
      setAdvisorLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Profile & Preferences Form */}
      <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover shrink-0"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Student Profile & Matching Weights
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your skills, availability, and goals directly drive the hybrid recommendation score.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="prof-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="prof-dept"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Department
              </label>
              <select
                id="prof-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {DEPARTMENTS.filter((d) => d !== 'All Departments').map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="prof-year"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Academic Year
              </label>
              <select
                id="prof-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="prof-skills"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Skills (comma-separated)
            </label>
            <input
              id="prof-skills"
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prof-interests"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Interests
              </label>
              <input
                id="prof-interests"
                type="text"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="prof-availability"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Availability Slots
              </label>
              <input
                id="prof-availability"
                type="text"
                value={availabilityText}
                onChange={(e) => setAvailabilityText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="prof-goals"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Career Goals
            </label>
            <input
              id="prof-goals"
              type="text"
              value={goalsText}
              onChange={(e) => setGoalsText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="prof-bio"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Bio & Academic Focus
            </label>
            <textarea
              id="prof-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          {savedNotice && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {savedNotice}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            Save Profile & Recompute Feed
          </button>
        </form>

        {/* Verified Attendance History */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Verified Event Participation History ({attendanceRecords.length})
            </h2>
            <span className="text-[11px] text-slate-400">Official Campus Records</span>
          </div>

          {attendanceRecords.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No verified attendance records yet. Check in to campus events using organizer passcodes.
            </p>
          ) : (
            <div className="space-y-2.5">
              {attendanceRecords.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {att.opportunityTitle}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Method: {att.method.toUpperCase()} • Check-in: {new Date(att.markedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Recognition Badges */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Earned Recognition Badges ({badges.filter((b) => b.unlocked).length} / {badges.length})
            </h2>
            <span className="text-[11px] text-slate-400">Participation Based</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`p-3 rounded-xl border transition-all text-xs space-y-1 ${
                  b.unlocked
                    ? 'border-amber-300/80 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Award
                      className={`w-4 h-4 ${
                        b.unlocked ? 'text-amber-500' : 'text-slate-400'
                      }`}
                    />
                    {b.title}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {b.unlocked ? `Unlocked ${b.unlockedAt || 'recently'}` : 'Locked'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right Column: Institutional ID, Anonymous Alias, Security & Strategist */}
      <div className="lg:col-span-5 space-y-6">
        {/* Institutional Student Identity Card */}
        <section className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              NCET Institutional Student Identity
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Verified Student
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {profile.displayName}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              USN: {profile.usn || '1NC23CS094'} • {profile.department} · {profile.year}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Email: {profile.institutionalEmail || `${profile.uid}@ncet.ac.in`}
            </div>
          </div>
        </section>

        {/* Anonymous Pseudonym Card */}
        {alias && (
          <section className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Anonymous Connect Pseudonym
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {alias.reputationPoints} Karma
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {alias.aliasName}
                </div>
                <div className="text-[11px] text-slate-500">
                  Decoupled from your institutional profile
                </div>
              </div>

              {onNavigateToAnonymous && (
                <button
                  type="button"
                  onClick={onNavigateToAnonymous}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  Enter Space <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </section>
        )}
        {/* Biometric & Automated Reminders */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Biometric Passkey & Automated Reminders
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleEnrollBiometric()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Fingerprint className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              {biometricId ? 'Re-Enroll Biometric' : 'Enroll Biometric Passkey'}
            </button>

            {biometricId && (
              <>
                <button
                  type="button"
                  onClick={() => void handleVerifyBiometric()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 px-3 py-2 text-xs font-medium text-white"
                >
                  Verify Passkey
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearBiometricPasskey();
                    setBiometricId(null);
                    onUnlockBiometric(false);
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline px-2"
                >
                  Revoke
                </button>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleEnablePush()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              Test Goal Push Alert
            </button>
            <button
              type="button"
              onClick={() => void handleSendEmailDigest()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              Trigger Email Digest
            </button>
          </div>

          {biometricStatus && (
            <p className="text-xs text-blue-700 dark:text-blue-300">{biometricStatus}</p>
          )}
          {digestPreview && (
            <pre className="whitespace-pre-wrap text-[11px] font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-700 dark:text-slate-200">
              {digestPreview}
            </pre>
          )}
        </section>

        {/* Deep-Thinking Career & Skill-Gap Strategist */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Deep-Thinking Career Strategist
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Uses high-depth reasoning across your skills, interview pipeline, and campus market demand.
          </p>

          <form onSubmit={(e) => void handleRunDeepAdvisor(e)} className="space-y-3">
            <label htmlFor="advisor-query" className="sr-only">
              Ask career strategist
            </label>
            <textarea
              id="advisor-query"
              rows={2}
              value={advisorQuestion}
              onChange={(e) => setAdvisorQuestion(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={advisorLoading}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2 text-xs font-semibold text-white transition-colors"
            >
              {advisorLoading ? 'Running High-Thinking Analysis...' : 'Analyze Career Roadmap'}
            </button>
          </form>

          {advisorResult && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {advisorResult.strategy}
              </p>
              {advisorResult.actionPlan.length > 0 && (
                <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {advisorResult.actionPlan.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
