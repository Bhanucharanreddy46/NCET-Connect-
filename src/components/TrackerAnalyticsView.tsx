import React, { useMemo, useState } from 'react';
import { Calendar, Download, FileText } from 'lucide-react';
import type { ApplicationRecord, ApplicationStatus, StudentProfile } from '../types/ncet';
import {
  computeApplicationAnalytics,
  filterApplicationsByDateRange,
} from '../utils/recommender';
import {
  generateAnalyticsPdfBytes,
  generateApplicationsCsv,
  triggerFileDownload,
} from '../utils/export';

interface TrackerAnalyticsViewProps {
  profile: StudentProfile;
  applications: ApplicationRecord[];
  onUpdateStatus: (
    appId: string,
    status: ApplicationStatus,
    interviewAt?: string,
    notes?: string
  ) => void;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Interview Scheduled',
  'Offer',
  'Completed',
];

const RANGE_OPTIONS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Full Semester', days: 180 },
];

export const TrackerAnalyticsView: React.FC<TrackerAnalyticsViewProps> = ({
  profile,
  applications,
  onUpdateStatus,
}) => {
  const [rangeDays, setRangeDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleInput, setScheduleInput] = useState('2026-11-21T10:30');
  const [notesInput, setNotesInput] = useState('');

  const referenceIso = useMemo(() => new Date().toISOString(), []);

  const rangeApps = useMemo(
    () => filterApplicationsByDateRange(applications, rangeDays, referenceIso),
    [applications, rangeDays, referenceIso]
  );

  const visibleApps = useMemo(() => {
    if (statusFilter === 'All') return rangeApps;
    return rangeApps.filter((a) => a.status === statusFilter);
  }, [rangeApps, statusFilter]);

  const analytics = useMemo(() => computeApplicationAnalytics(rangeApps), [rangeApps]);

  const handleExportCsv = () => {
    const csv = generateApplicationsCsv(visibleApps);
    triggerFileDownload(csv, `ncet-connect-applications-${rangeDays}d.csv`, 'text/csv;charset=utf-8');
  };

  const handleExportPdf = () => {
    const pdfBytes = generateAnalyticsPdfBytes(
      profile.displayName,
      profile.department,
      visibleApps
    );
    triggerFileDownload(
      pdfBytes.buffer as ArrayBuffer,
      `ncet-connect-report-${rangeDays}d.pdf`,
      'application/pdf'
    );
  };

  const maxDomainCount = Math.max(1, ...analytics.byDomain.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Application Tracker & Progress Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track saved items, schedule recruiter interviews, and export personal activity reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="analytics-range" className="sr-only">
            Date range
          </label>
          <select
            id="analytics-range"
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.days} value={opt.days}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tracked in Window
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {analytics.totalTracked}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Submitted Applications
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {analytics.appliedCount}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Interviews Scheduled
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {analytics.interviewCount}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Interview Conversion
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {analytics.conversionRatePct}%
          </div>
        </div>
      </div>

      {/* Interactive Progress Visualization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Domain Activity Breakdown ({rangeDays}D)
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Distribution of tracked applications across engineering domains
          </p>

          <div className="mt-5 space-y-3">
            {analytics.byDomain.length === 0 ? (
              <p className="text-xs text-slate-500">No applications recorded in this date window.</p>
            ) : (
              analytics.byDomain.map((item) => (
                <div key={item.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {item.domain}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
                      style={{ width: `${Math.round((item.count / maxDomainCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Pipeline Stage Funnel
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time progression from saved opportunities to interviews and offers
          </p>

          <div className="mt-5">
            <svg
              viewBox="0 0 420 150"
              className="w-full h-36"
              role="img"
              aria-label="Pipeline stage funnel chart"
            >
              {STATUS_OPTIONS.map((status, idx) => {
                const count =
                  analytics.byStatus.find((s) => s.status === status)?.count ?? 0;
                const barMax = Math.max(1, analytics.totalTracked);
                const height = Math.max(12, Math.round((count / barMax) * 90));
                const x = 14 + idx * 80;
                const y = 110 - height;
                return (
                  <g key={status}>
                    <rect
                      x={x}
                      y={y}
                      width="48"
                      height={height}
                      rx="6"
                      className={
                        status === 'Interview Scheduled' || status === 'Offer'
                          ? 'fill-blue-600 dark:fill-blue-500'
                          : 'fill-slate-300 dark:fill-slate-700'
                      }
                    />
                    <text
                      x={x + 24}
                      y={y - 6}
                      textAnchor="middle"
                      className="fill-slate-800 dark:fill-slate-100 text-[11px] font-mono font-semibold"
                    >
                      {count}
                    </text>
                    <text
                      x={x + 24}
                      y={132}
                      textAnchor="middle"
                      className="fill-slate-500 dark:fill-slate-400 text-[9px]"
                    >
                      {status.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>
      </div>

      {/* Application & Interview Schedule Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Applications & Interview Schedule
          </h2>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {['All', ...STATUS_OPTIONS].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="py-3 px-5">Opportunity</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Interview Slot</th>
                <th className="py-3 px-5 text-right">Schedule / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {visibleApps.map((app) => (
                <React.Fragment key={app.id}>
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {app.opportunityTitle}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {app.organization}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {app.domain}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Status for ${app.opportunityTitle}`}
                        value={app.status}
                        onChange={(e) =>
                          onUpdateStatus(app.id, e.target.value as ApplicationStatus)
                        }
                        className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-100"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                      {app.interviewAt ? app.interviewAt.replace('T', ' ') : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingScheduleId === app.id) {
                            setEditingScheduleId(null);
                          } else {
                            setEditingScheduleId(app.id);
                            setScheduleInput(app.interviewAt || '2026-11-21T10:30');
                            setNotesInput(app.notes || '');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                      >
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        {editingScheduleId === app.id ? 'Close' : 'Schedule'}
                      </button>
                    </td>
                  </tr>

                  {editingScheduleId === app.id && (
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                          <div className="flex-1 w-full">
                            <label
                              htmlFor={`interview-dt-${app.id}`}
                              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                            >
                              Interview Date & Time
                            </label>
                            <input
                              id={`interview-dt-${app.id}`}
                              type="datetime-local"
                              value={scheduleInput}
                              onChange={(e) => setScheduleInput(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div className="flex-[2] w-full">
                            <label
                              htmlFor={`interview-notes-${app.id}`}
                              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                            >
                              Prep Notes
                            </label>
                            <input
                              id={`interview-notes-${app.id}`}
                              type="text"
                              value={notesInput}
                              onChange={(e) => setNotesInput(e.target.value)}
                              placeholder="Topics, recruiter link, or room number"
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(
                                app.id,
                                'Interview Scheduled',
                                scheduleInput,
                                notesInput
                              );
                              setEditingScheduleId(null);
                            }}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0"
                          >
                            Save Interview Reminder
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
