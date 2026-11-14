import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { DEPARTMENTS, INDUSTRIES, YEARS } from '../data/seedData';
import type {
  Opportunity,
  OpportunityMode,
  OpportunityType,
} from '../types/ncet';

interface OrganizerPortalViewProps {
  opportunities: Opportunity[];
  onCreateOpportunity: (
    draft: Omit<Opportunity, 'id' | 'organizerId' | 'createdAt' | 'updatedAt' | 'status'>
  ) => Promise<Opportunity>;
}

export const OrganizerPortalView: React.FC<OrganizerPortalViewProps> = ({
  opportunities,
  onCreateOpportunity,
}) => {
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('NCET Robotics & AI Club');
  const [type, setType] = useState<OpportunityType>('Workshop');
  const [domain, setDomain] = useState('AI & ML');
  const [industry, setIndustry] = useState('AI & Robotics');
  const [mode, setMode] = useState<OpportunityMode>('On-Campus');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['CSE', 'AI & ML']);
  const [selectedYears, setSelectedYears] = useState<string[]>(['2nd Year', '3rd Year']);
  const [tagsText, setTagsText] = useState('Python, ReactJS, Vector Search');
  const [availabilitySlot, setAvailabilitySlot] = useState('Weekends');
  const [goalMatch, setGoalMatch] = useState('AI Systems Engineer');
  const [deadline, setDeadline] = useState('2026-12-18');
  const [stipendOrPrize, setStipendOrPrize] = useState('Verified Certificate + Lab Grant');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organization.trim() || !description.trim()) {
      setBanner('Please complete the opportunity title, organization, and description.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await onCreateOpportunity({
        title: title.trim(),
        organization: organization.trim(),
        type,
        domain,
        industry,
        mode,
        departments: selectedDepts.length ? selectedDepts : ['All Departments'],
        eligibleYears: selectedYears.length ? selectedYears : YEARS,
        tags: tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        availabilitySlot,
        goalMatch,
        deadline,
        sourceGroup: 'Campus',
        sourceName: 'Organizer Portal',
        description: description.trim(),
        stipendOrPrize: stipendOrPrize.trim() || 'See details',
      });
      setTitle('');
      setDescription('');
      setBanner(`Published "${created.title}" to targeted student feeds.`);
    } finally {
      setSubmitting(false);
    }
  };

  const campusListings = opportunities.filter((o) => o.status === 'published').slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Club & Department Organizer Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Post campus drives, workshops, or internships and target eligible departments, years, and skills.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-title"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Opportunity Title
              </label>
              <input
                id="org-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Autonomous Drone Vision Lab Sprint"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="org-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Club / Department / Recruiter
              </label>
              <input
                id="org-name"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="org-type"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Type
              </label>
              <select
                id="org-type"
                value={type}
                onChange={(e) => setType(e.target.value as OpportunityType)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                {(['Internship', 'Hackathon', 'Workshop', 'Meetup', 'Research', 'Campus Drive'] as const).map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="org-mode"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Mode
              </label>
              <select
                id="org-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as OpportunityMode)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                {(['On-Campus', 'Hybrid', 'Remote', 'Offline'] as const).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="org-industry"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Industry
              </label>
              <select
                id="org-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                {INDUSTRIES.filter((i) => i !== 'All Industries').map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="org-deadline"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Deadline
              </label>
              <input
                id="org-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Target Departments */}
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Target Academic Departments
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.filter((d) => d !== 'All Departments').map((dept) => {
                const active = selectedDepts.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleItem(selectedDepts, dept, setSelectedDepts)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Years */}
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Eligible Years
            </span>
            <div className="flex flex-wrap gap-1.5">
              {YEARS.map((yr) => {
                const active = selectedYears.includes(yr);
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => toggleItem(selectedYears, yr, setSelectedYears)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="org-tags"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Required Skills / Tags
              </label>
              <input
                id="org-tags"
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="org-slot"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Schedule Slot
              </label>
              <input
                id="org-slot"
                type="text"
                value={availabilitySlot}
                onChange={(e) => setAvailabilitySlot(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="org-reward"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Stipend / Prize
              </label>
              <input
                id="org-reward"
                type="text"
                value={stipendOrPrize}
                onChange={(e) => setStipendOrPrize(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-domain"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Domain
              </label>
              <input
                id="org-domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="org-goal"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Target Career Goal
              </label>
              <input
                id="org-goal"
                type="text"
                value={goalMatch}
                onChange={(e) => setGoalMatch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="org-desc"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Description & Eligibility Details
            </label>
            <textarea
              id="org-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe curriculum, interview rounds, venue, or team size..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          {banner && (
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{banner}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            {submitting ? 'Publishing...' : 'Publish Targeted Opportunity'}
          </button>
        </form>
      </section>

      {/* Active Postings Sidebar */}
      <aside className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Live Campus & Partner Listings
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Active opportunities currently surfaced in student feeds
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {campusListings.map((opp) => (
            <div key={opp.id} className="py-3.5 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {opp.type} · {opp.mode} · Closes <span className="font-mono">{opp.deadline}</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {opp.title}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {opp.organization} · Targets {opp.departments.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};
