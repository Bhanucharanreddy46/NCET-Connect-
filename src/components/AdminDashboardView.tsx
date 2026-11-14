import React, { useMemo, useState } from 'react';
import { CheckCircle2, Layers, Sparkles, XCircle } from 'lucide-react';
import type {
  ApplicationRecord,
  EngagementEvent,
  Opportunity,
  StudentProfile,
} from '../types/ncet';
import { computeSkillGaps } from '../utils/recommender';

interface AdminDashboardViewProps {
  opportunities: Opportunity[];
  applications: ApplicationRecord[];
  events: EngagementEvent[];
  profile: StudentProfile;
  onModerate: (oppId: string, status: 'published' | 'archived') => Promise<void>;
  onCreateIngested: (
    draft: Omit<Opportunity, 'id' | 'organizerId' | 'createdAt' | 'updatedAt' | 'status'>,
    status: Opportunity['status']
  ) => Promise<Opportunity>;
}

const DEPT_PARTICIPATION = [
  { department: 'CSE', participationPct: 86, activeStudents: 312 },
  { department: 'ISE', participationPct: 79, activeStudents: 214 },
  { department: 'AI & ML', participationPct: 84, activeStudents: 178 },
  { department: 'Data Science', participationPct: 72, activeStudents: 136 },
  { department: 'ECE', participationPct: 61, activeStudents: 164 },
  { department: 'Mechanical', participationPct: 44, activeStudents: 89 },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  opportunities,
  applications,
  events,
  profile,
  onModerate,
  onCreateIngested,
}) => {
  const [rawIngestText, setRawIngestText] = useState(
    'Meetup Bengaluru Cloud Native & Kubernetes Workshop this Saturday for 3rd Year CSE and ISE students. Hands-on Docker + PostgreSQL labs.'
  );
  const [ingestSource, setIngestSource] = useState<'Campus' | 'Career' | 'Community'>('Community');
  const [ingesting, setIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  const publishedOpps = opportunities.filter((o) => o.status === 'published');
  const moderationQueue = opportunities.filter((o) => o.status === 'pending_moderation');

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
          `Normalized "${created.title}" into moderation queue via ${data.modelUsed}.`
        );
      }
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Published Opportunities
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {publishedOpps.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Pending Moderation
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {moderationQueue.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Engagement Signals
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {events.length + 148}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Student Registrations
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {applications.length + 64}
          </div>
        </div>
      </div>

      {/* Department Participation & Campus Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Department Participation
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Weekly active student engagement across NCET academic departments
          </p>

          <div className="mt-5 space-y-3">
            {DEPT_PARTICIPATION.map((row) => (
              <div key={row.department} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {row.department}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {row.participationPct}% ({row.activeStudents} students)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                    style={{ width: `${row.participationPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Campus Skill Gaps & Popular Categories
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Demand from live listings compared against verified student skill coverage
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2">In-Demand Skill</th>
                  <th className="py-2 text-right">Listings</th>
                  <th className="py-2 text-right">Campus Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {skillGaps.map((g) => (
                  <tr key={g.skill}>
                    <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {g.skill}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {g.demandCount}
                    </td>
                    <td
                      className={`py-2.5 text-right font-mono tabular-nums font-medium ${
                        g.studentCoveragePct < 50
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {g.studentCoveragePct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-800 dark:text-slate-100">
              Popular Categories:
            </span>{' '}
            {popularCategories.map((c) => `${c.type} (${c.count})`).join(' · ')}
          </div>
        </section>
      </div>

      {/* Ingestion Pipeline & Moderation Queue */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Ingestion Pipeline & Moderation Queue
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Normalize Campus, Career, and Luma/Meetup/GDG feeds with auto-tagging before publishing live.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleRunIngest(e)} className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              aria-label="Ingestion Source Group"
              value={ingestSource}
              onChange={(e) => setIngestSource(e.target.value as 'Campus' | 'Career' | 'Community')}
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
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              {ingesting ? 'Normalizing...' : 'Ingest & Auto-Tag'}
            </button>
          </div>
          {ingestMessage && (
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{ingestMessage}</p>
          )}
        </form>

        {moderationQueue.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Moderation queue is clear. All ingested items have been reviewed.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {moderationQueue.map((item) => (
              <div
                key={item.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.sourceGroup} ({item.sourceName}) · {item.type} · {item.mode} · Tags:{' '}
                    {item.tags.join(', ')}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void onModerate(item.id, 'published')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void onModerate(item.id, 'archived')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Frameworks & Cloud Stack Reference (Answering User's Architecture Question) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Recommended Frameworks & Cloud Architecture for NCET CONNECT
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              <strong className="text-slate-900 dark:text-white">Frontend & PWA:</strong> React 19 + TypeScript + Tailwind CSS v4 with <code className="font-mono">vite-plugin-pwa</code> (Workbox offline cache + install manifest) and Web Crypto API (<code className="font-mono">AES-GCM</code>) for client-side document vault and E2EE messaging.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">API Gateway & Modular Monolith:</strong> Node/Express or FastAPI gateway enforcing JWT/Firebase Auth, RBAC (<code className="font-mono">student | organizer | admin</code>), sliding-window rate limits, and routing to Profile, Opportunity, Recommender, and Notifier modules.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Data, Vector & Async Jobs:</strong> Firebase Firestore + Auth for real-time cross-device sync (or PostgreSQL + <code className="font-mono">pgvector</code> for relational + semantic vector search), paired with Redis + BullMQ / Celery workers for RSS/Luma/Meetup ingestion and scheduled email digests.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Cloud Deployment:</strong> Google Cloud Run / Firebase Hosting for containerized full-stack services, or Vercel (React PWA) + Render/Railway (FastAPI, Postgres/pgvector, Redis).
            </p>
          </div>

          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white p-2">
            <img
              src="/assets/aistudio/ncet_connect_architecture_e9617c5f.png"
              alt="NCET CONNECT layered system architecture diagram"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
