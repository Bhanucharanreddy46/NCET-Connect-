import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Globe,
  Layers,
  Megaphone,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import type {
  ApplicationRecord,
  AttendanceRecord,
  CampusAnnouncement,
  CommunityReport,
  EngagementEvent,
  Opportunity,
  StudentProfile,
  OpportunityApplication,
  OpportunityApplicationStatus,
  ExternalEventImport,
  Recognition,
  RecognitionType,
  VolunteerOptin,
} from '../types/ncet';
import { SEED_AUTH_USERS } from '../data/seedData';
import { computeSkillGaps } from '../utils/recommender';

interface AdminDashboardViewProps {
  opportunities: Opportunity[];
  applications: ApplicationRecord[];
  events: EngagementEvent[];
  profile: StudentProfile;
  attendanceRecords?: AttendanceRecord[];
  reports?: CommunityReport[];
  announcements?: CampusAnnouncement[];
  opportunityApplications?: OpportunityApplication[];
  onUpdateApplicationStatus?: (id: string, status: OpportunityApplicationStatus) => void;
  externalEventImports?: ExternalEventImport[];
  onReviewExternalEvent?: (id: string, decision: 'approved' | 'rejected') => void;
  onSubmitExternalEvent?: (event: Omit<ExternalEventImport, 'id' | 'importedAt' | 'status'>) => void;
  recognitions?: Recognition[];
  onAwardRecognition?: (studentId: string, type: RecognitionType, points: number, reason: string) => void;
  volunteerOptins?: VolunteerOptin[];
  onModerate: (oppId: string, status: 'published' | 'archived') => Promise<void>;
  onCreateIngested: (
    draft: Omit<Opportunity, 'id' | 'organizerId' | 'createdAt' | 'updatedAt' | 'status'>,
    status: Opportunity['status']
  ) => Promise<Opportunity>;
  onResolveReport?: (reportId: string, status: 'resolved' | 'dismissed') => void;
  onPostAnnouncement?: (announcement: Omit<CampusAnnouncement, 'id' | 'createdAt'>) => void;
}

const DEPT_ENGAGEMENT = [
  { department: 'CSE', registered: 312, attended: 268, attendanceRate: 86 },
  { department: 'ISE', registered: 214, attended: 169, attendanceRate: 79 },
  { department: 'AI & ML', registered: 178, attended: 151, attendanceRate: 85 },
  { department: 'Data Science', registered: 136, attended: 98, attendanceRate: 72 },
  { department: 'ECE', registered: 164, attended: 105, attendanceRate: 64 },
  { department: 'Mechanical', registered: 89, attended: 48, attendanceRate: 54 },
  { department: 'Civil', registered: 58, attended: 31, attendanceRate: 53 },
];

const STUDENT_RECOGNITION_LEADERBOARD = [
  { rank: 1, name: 'Priya Nair', dept: 'CSE (3rd Yr)', attendedEvents: 5, badgesUnlocked: 4, score: 94 },
  { rank: 2, name: 'Aditya Sharma', dept: 'AI & ML (3rd Yr)', attendedEvents: 4, badgesUnlocked: 3, score: 88 },
  { rank: 3, name: 'Rhea Sen', dept: 'ISE (3rd Yr)', attendedEvents: 4, badgesUnlocked: 3, score: 85 },
  { rank: 4, name: 'Karthik Rao', dept: 'ECE (4th Yr)', attendedEvents: 3, badgesUnlocked: 3, score: 78 },
  { rank: 5, name: 'Neha Patil', dept: 'Data Science (2nd Yr)', attendedEvents: 3, badgesUnlocked: 2, score: 74 },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  opportunities,
  applications,
  events,
  profile,
  attendanceRecords = [],
  reports = [],
  announcements = [],
  opportunityApplications = [],
  onUpdateApplicationStatus,
  externalEventImports = [],
  onReviewExternalEvent,
  onSubmitExternalEvent,
  recognitions = [],
  onAwardRecognition,
  volunteerOptins = [],
  onModerate,
  onCreateIngested,
  onResolveReport,
  onPostAnnouncement,
}) => {
  const [adminTab, setAdminTab] = useState<'queue' | 'analytics' | 'moderation' | 'leaderboard' | 'architecture'>('queue');
  const [rawIngestText, setRawIngestText] = useState(
    'GDG Bangalore DevFest 2026: Hands-on Cloud Run, Gemini 1.5, and Android Studio workshop for all engineering undergraduates.'
  );
  const [ingestSource, setIngestSource] = useState<'Campus' | 'Career' | 'Community'>('Community');
  const [ingesting, setIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  const publishedOpps = opportunities.filter((o) => o.status === 'published');
  const moderationQueue = opportunities.filter(
    (o) => o.status === 'pending_moderation' || o.approvalStatus === 'pending_approval'
  );

  const popularCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const opp of publishedOpps) {
      counts.set(opp.type, (counts.get(opp.type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [publishedOpps]);

  const skillGaps = useMemo(
    () => computeSkillGaps(opportunities, profile.skills),
    [opportunities, profile.skills]
  );

  const handleRunIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawIngestText.trim()) return;
    setIngesting(true);
    setIngestMessage(null);
    try {
      const resp = await fetch('/api/opportunities/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawIngestText,
          sourceGroup: ingestSource,
          sourceName: `${ingestSource} Scraper`,
        }),
      });
      const data = await resp.json();
      if (data.normalized) {
        const created = await onCreateIngested(data.normalized, 'pending_moderation');
        setIngestMessage(
          `Normalized "${created.title}" into review queue via ${data.modelUsed}.`
        );
      }
    } finally {
      setIngesting(false);
    }
  };

  const handleExportEngagementReport = () => {
    const header = 'Department,Registered Students,Actual Attendees,Attendance Rate %\n';
    const rows = DEPT_ENGAGEMENT.map(
      (d) => `"${d.department}",${d.registered},${d.attended},${d.attendanceRate}%`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NCET_Campus_Engagement_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Published Campus Events
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {publishedOpps.length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            Active in student feeds
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Pending Admin Approvals
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {moderationQueue.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Organizer submissions</div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Verified Attendance Records
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {attendanceRecords.length + 94}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
            81% average turnout rate
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Community Reports Pending
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {reports.filter((r) => r.status === 'pending').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Anonymous Connect safety</div>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setAdminTab('queue')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'queue'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Event Approvals & Moderation ({moderationQueue.length})
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'analytics'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Engagement & Attendance Insights
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('moderation')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'moderation'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Anonymous Community Safety ({reports.filter((r) => r.status === 'pending').length})
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('leaderboard')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'leaderboard'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Student Recognition & Badges
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('applications' as any)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            (adminTab as any) === 'applications'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Applications Desk ({opportunityApplications?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('external_events' as any)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            (adminTab as any) === 'external_events'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          External Event Ingestion ({externalEventImports?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('users' as any)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            (adminTab as any) === 'users'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Verified Accounts & Roles
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('architecture')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'architecture'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Architecture & System Specs
        </button>
      </div>

      {/* TAB 1: EVENT APPROVALS & MODERATION QUEUE */}
      {adminTab === 'queue' && (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Event Submissions & External Ingestion Pipeline
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Review events submitted by NCET clubs or ingested from external tech platforms before publishing live.
                </p>
              </div>
            </div>

            {/* Ingestion form */}
            <form
              onSubmit={(e) => void handleRunIngest(e)}
              className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Automated Listing Ingestion & Normalization:
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  aria-label="Ingestion Source Group"
                  value={ingestSource}
                  onChange={(e) =>
                    setIngestSource(e.target.value as 'Campus' | 'Career' | 'Community')
                  }
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100"
                >
                  <option value="Campus">Campus Sources</option>
                  <option value="Career">Career Sources</option>
                  <option value="Community">Community (Luma / Meetup / GDG)</option>
                </select>
                <input
                  type="text"
                  aria-label="Raw scraped opportunity text"
                  value={rawIngestText}
                  onChange={(e) => setRawIngestText(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={ingesting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {ingesting ? 'Normalizing...' : 'Ingest & Auto-Tag'}
                </button>
              </div>
              {ingestMessage && (
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {ingestMessage}
                </p>
              )}
            </form>

            {/* Moderation Queue */}
            {moderationQueue.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                Review queue is clear! All club event submissions and external tech listings have been moderated.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {moderationQueue.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {item.organization}
                        </span>
                        <span>•</span>
                        <span>{item.type}</span>
                        <span>•</span>
                        <span>{item.mode}</span>
                        {item.venue && <span>• Venue: {item.venue}</span>}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                        {item.description}
                      </p>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Tags: {item.tags.join(', ')} • Target: {item.departments.join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void onModerate(item.id, 'published')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => void onModerate(item.id, 'archived')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: ATTENDANCE & ENGAGEMENT ANALYTICS */}
      {adminTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Policy Note */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-xs space-y-1">
            <div className="font-bold text-blue-900 dark:text-blue-200">
              NCET Analytics Principle & Student Privacy Governance:
            </div>
            <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
              Use participation and attendance data exclusively to identify engagement patterns and support campus programming. Never label, rank, or penalize individual students with subjective "skill gap" designations without reliable, consent-based evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Registration vs Attendance Breakdown */}
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Department Participation & Turnout
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comparing registrations against verified in-person check-in rates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportEngagementReport}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV Export
                </button>
              </div>

              <div className="space-y-3.5 pt-2">
                {DEPT_ENGAGEMENT.map((row) => (
                  <div key={row.department} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {row.department}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {row.attended} of {row.registered} attended ({row.attendanceRate}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${row.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Popular Opportunity Types & In-Demand Skills */}
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Event Category Popularity & Skill Areas
                </h2>
                <p className="text-xs text-slate-500">
                  Distribution of events hosted across workshops, hackathons, and meetups
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {popularCategories.map((cat) => (
                  <div
                    key={cat.type}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {cat.type}
                    </div>
                    <div className="text-xl font-bold font-mono text-blue-600 mt-1">
                      {cat.count} listings
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  High-Demand Student Skill Interests:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillGaps.map((sg) => (
                    <span
                      key={sg.skill}
                      className="px-2.5 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {sg.skill} ({sg.demandCount} events)
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 3: ANONYMOUS CONNECT SAFETY & MODERATION */}
      {adminTab === 'moderation' && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Anonymous Connect Community Safety Desk
              </h2>
              <p className="text-xs text-slate-500">
                Review peer reports, investigate content guidelines violations, and enforce moderation decisions.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              {reports.filter((r) => r.status === 'pending').length} Actionable Reports
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      {rep.targetType}
                    </span>
                    <span className="text-slate-400">
                      Reported by {rep.reportedByAlias} • {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    "{rep.targetTitle}"
                  </div>

                  <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    Flagged Reason: {rep.reason}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onResolveReport && rep.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onResolveReport(rep.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                      >
                        Dismiss Flag
                      </button>
                      <button
                        type="button"
                        onClick={() => onResolveReport(rep.id, 'resolved')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                      >
                        Remove & Warn Author
                      </button>
                    </>
                  )}
                  {rep.status !== 'pending' && (
                    <span className="text-xs font-semibold text-slate-400 capitalize">
                      Status: {rep.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: STUDENT RECOGNITION & LEADERBOARD */}
      {adminTab === 'leaderboard' && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Verified Student Participation & Engagement Leaderboard
            </h2>
            <p className="text-xs text-slate-500">
              Celebrates student engagement, workshop attendance, and peer collaboration across NCET.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Department & Year</th>
                  <th className="px-4 py-3">Verified Attended Events</th>
                  <th className="px-4 py-3">Badges Earned</th>
                  <th className="px-4 py-3 text-right">Engagement Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {STUDENT_RECOGNITION_LEADERBOARD.map((s) => (
                  <tr key={s.rank} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      #{s.rank}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.dept}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {s.attendedEvents} Events
                    </td>
                    <td className="px-4 py-3">{s.badgesUnlocked} Badges</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {s.score} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB: APPLICATIONS DESK */}
      {(adminTab as any) === 'applications' && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Student Applications & Opportunity Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Track and update student applications across campus roles, hackathons, and internships.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Total Applications: {opportunityApplications?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Applicant Student ID</th>
                  <th className="px-4 py-3">Opportunity ID</th>
                  <th className="px-4 py-3">Applied At</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {(opportunityApplications || []).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {app.studentId}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {app.opportunityId}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{app.appliedAt.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                      {app.notes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                          app.status === 'selected'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : app.status === 'shortlisted'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : app.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {onUpdateApplicationStatus && (
                        <>
                          <button
                            onClick={() => onUpdateApplicationStatus(app.id, 'shortlisted')}
                            className="rounded px-2 py-1 text-[11px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => onUpdateApplicationStatus(app.id, 'selected')}
                            className="rounded px-2 py-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => onUpdateApplicationStatus(app.id, 'rejected')}
                            className="rounded px-2 py-1 text-[11px] font-semibold bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB: EXTERNAL EVENT INGESTION */}
      {(adminTab as any) === 'external_events' && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-600" />
                Cross-Platform Event Ingestion Queue (Luma / Devfolio / Meetup)
              </h2>
              <p className="text-xs text-slate-500">
                Review and approve normalized external technology opportunities before publishing to student feeds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(externalEventImports || []).map((imp) => (
              <div
                key={imp.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 text-[10px] font-bold">
                      Source: {imp.source}
                    </span>
                    <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {imp.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      imp.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : imp.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {imp.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {imp.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-850">
                  <span>Date: {imp.eventDate.slice(0, 10)}</span>
                  <span>Mode: {imp.mode}</span>
                </div>

                {imp.status === 'pending' && onReviewExternalEvent && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onReviewExternalEvent(imp.id, 'approved')}
                      className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => onReviewExternalEvent(imp.id, 'rejected')}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB: VERIFIED ACCOUNTS & USERS */}
      {(adminTab as any) === 'users' && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Verified Institutional Accounts & Access Roles
              </h2>
              <p className="text-xs text-slate-500">
                Audited accounts adhering to the @ncetmail.com institutional access boundary.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Verified Users: {SEED_AUTH_USERS.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Account Email</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Domain Verification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {SEED_AUTH_USERS.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">
                      {usr.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {usr.isVerified ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          @ncetmail.com Verified
                        </span>
                      ) : (
                        <span className="text-amber-500 font-medium">Pending Domain Check</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400">Active</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{usr.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: ARCHITECTURE & SYSTEM SPECS */}
      {adminTab === 'architecture' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              NCET CONNECT Modular Monolith & PWA Architecture
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="space-y-3">
              <p>
                <strong className="text-slate-900 dark:text-white">Frontend & PWA:</strong> React 19 + TypeScript + Tailwind CSS v4 with offline sync (Workbox Service Worker + IndexedDB / localStorage cache) and Web Crypto API (<code className="font-mono">AES-GCM-256</code>) for client-side encrypted document vaults.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Anonymous Connect Protocol:</strong> Decoupled pseudonymous alias layer with strict mutual-consent identity reveal gates. Individual poll responses are never stored alongside student identifiers.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Event & Attendance Check-In:</strong> Server-side 6-digit passcode and QR validation preventing duplicate check-ins, tracking attendance conversion vs registration.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">External Ecosystem Scraper:</strong> Normalization pipeline ingesting curated Bengaluru tech community feeds (GDG Bangalore, HasGeek, PyData) with verified external source labels.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 p-4 font-mono text-[11px] space-y-1">
              <div className="text-slate-400">// Layered Architecture Stack</div>
              <div>├── Student Portal (PWA, Feed, Calendar, Anonymous Connect)</div>
              <div>├── Organizer Portal (Event Workflow, Attendance Check-In, Broadcast)</div>
              <div>├── Admin Portal (Approval Queue, Turnout Analytics, Safety Desk)</div>
              <div>├── Application Backend (Rate Limiter, Recommender, Auth Guard)</div>
              <div>└── Data Layer (Firestore / PostgreSQL + pgvector, E2EE Vault)</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
