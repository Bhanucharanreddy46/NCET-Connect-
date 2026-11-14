import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Share2,
  Sparkles,
} from 'lucide-react';
import heroCampusImg from '../assets/images/ncet_campus_hero_1794631951978.jpg';
import { DEPARTMENTS, INDUSTRIES } from '../data/seedData';
import type {
  ApplicationRecord,
  Opportunity,
  RecommendationResult,
  StudentProfile,
} from '../types/ncet';

interface StudentFeedViewProps {
  profile: StudentProfile;
  recommendations: RecommendationResult[];
  allOpportunities: Opportunity[];
  applications: ApplicationRecord[];
  onSave: (opp: Opportunity) => void;
  onRegister: (opp: Opportunity) => void;
  onShare: (opp: Opportunity) => void;
  onInspect: (opp: Opportunity) => void;
}

const OPPORTUNITY_TYPES = [
  'All Types',
  'Internship',
  'Hackathon',
  'Workshop',
  'Meetup',
  'Research',
  'Campus Drive',
];

const MODES = ['All Modes', 'Remote', 'Hybrid', 'On-Campus', 'Offline'];

export const StudentFeedView: React.FC<StudentFeedViewProps> = ({
  profile,
  recommendations,
  allOpportunities,
  applications,
  onSave,
  onRegister,
  onShare,
  onInspect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [modeFilter, setModeFilter] = useState('All Modes');
  const [showAllFeed, setShowAllFeed] = useState(false);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);
  const [polishedTips, setPolishedTips] = useState<Record<string, { text: string; tldr: string }>>({});
  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const savedIds = useMemo(
    () => new Set(applications.filter((a) => a.status === 'Saved').map((a) => a.opportunityId)),
    [applications]
  );
  const appliedIds = useMemo(
    () => new Set(applications.filter((a) => a.status !== 'Saved').map((a) => a.opportunityId)),
    [applications]
  );

  const itemsToFilter = useMemo(() => {
    if (!showAllFeed) return recommendations;
    const recMap = new Map(recommendations.map((r) => [r.opportunity.id, r]));
    return allOpportunities
      .filter((o) => o.status === 'published')
      .map((opp) => {
        const existing = recMap.get(opp.id);
        if (existing) return existing;
        return {
          opportunity: opp,
          breakdown: {
            semanticMatch: 0.45,
            skillInterestOverlap: 0.4,
            availabilityFit: 0.5,
            goalAlignment: 0.45,
            engagementHistory: 0.2,
            totalScore: 0.42,
          },
          explanation: `Open campus listing from ${opp.sourceName} in ${opp.domain}.`,
        } as RecommendationResult;
      });
  }, [allOpportunities, recommendations, showAllFeed]);

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return itemsToFilter.filter(({ opportunity }) => {
      if (
        departmentFilter !== 'All Departments' &&
        !opportunity.departments.includes('All Departments') &&
        !opportunity.departments.includes(departmentFilter)
      ) {
        return false;
      }
      if (industryFilter !== 'All Industries' && opportunity.industry !== industryFilter) {
        return false;
      }
      if (typeFilter !== 'All Types' && opportunity.type !== typeFilter) {
        return false;
      }
      if (modeFilter !== 'All Modes' && opportunity.mode !== modeFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        opportunity.title,
        opportunity.organization,
        opportunity.domain,
        opportunity.industry,
        opportunity.description,
        ...opportunity.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [departmentFilter, industryFilter, itemsToFilter, modeFilter, searchQuery, typeFilter]);

  const handlePolishWithAI = async (rec: RecommendationResult) => {
    const id = rec.opportunity.id;
    setPolishingId(id);
    onInspect(rec.opportunity);
    try {
      const resp = await fetch('/api/recommender/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: profile.displayName,
          department: profile.department,
          skills: profile.skills,
          opportunityTitle: rec.opportunity.title,
          organization: rec.opportunity.organization,
          rawExplanation: rec.explanation,
        }),
      });
      const data = await resp.json();
      setPolishedTips((prev) => ({
        ...prev,
        [id]: {
          text: data.polishedExplanation || rec.explanation,
          tldr: data.tldr || 'Focus on core project fundamentals.',
        },
      }));
    } catch {
      setPolishedTips((prev) => ({
        ...prev,
        [id]: {
          text: rec.explanation,
          tldr: 'Offline fallback: Prepare portfolio links aligned to listed skills.',
        },
      }));
    } finally {
      setPolishingId(null);
    }
  };

  const handleShareClick = async (opp: Opportunity) => {
    onShare(opp);
    const shareText = `${opp.title} at ${opp.organization} (${opp.mode}) — Deadline ${opp.deadline} on NCET CONNECT`;
    if (navigator.share) {
      try {
        await navigator.share({ title: opp.title, text: shareText, url: window.location.href });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareToast(`Copied share summary for "${opp.title}"`);
      setTimeout(() => setShareToast(null), 2600);
    } catch {
      setShareToast(`Ready to share: ${opp.title}`);
      setTimeout(() => setShareToast(null), 2600);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with Campus Photography */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between gap-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-blue-600 dark:text-blue-400">
              {profile.department} · {profile.year} · Personalized Campus Discovery
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              Explainable internships, hackathons & campus drives for {profile.displayName}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Ranked dynamically using semantic skill matching, availability fit, career goals, and your engagement history across Campus, Career, and Community feeds.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Matched Feed</div>
              <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                {recommendations.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Saved Items</div>
              <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                {savedIds.size}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Active Applications</div>
              <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                {appliedIds.size}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[200px] lg:min-h-full bg-slate-100 dark:bg-slate-800">
          <img
            src={heroCampusImg}
            alt="NCET engineering students collaborating at the campus innovation courtyard"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent flex items-end p-5">
            <p className="text-xs text-slate-100 font-medium">
              NCET Innovation Courtyard · Placement & Community Hub
            </p>
          </div>
        </div>
      </section>

      {/* Search & Multi-Dimensional Filter Controls */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label htmlFor="feed-search" className="sr-only">
              Search internships, skills, organizations, or domains
            </label>
            <input
              id="feed-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search internships, skills (ReactJS, Python), companies, or hackathons..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowAllFeed(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                !showAllFeed
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Recommended For You
            </button>
            <button
              type="button"
              onClick={() => setShowAllFeed(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                showAllFeed
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Campus Directory
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="filter-department"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Academic Department
            </label>
            <select
              id="filter-department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-industry"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Industry Preference
            </label>
            <select
              id="filter-industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-type"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Opportunity Type
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-mode"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Participation Mode
            </label>
            <select
              id="filter-mode"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {shareToast && (
        <div
          role="status"
          className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-4 py-2.5 text-xs font-medium text-blue-900 dark:text-blue-200"
        >
          {shareToast}
        </div>
      )}

      {/* Opportunity List */}
      {filteredResults.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            No opportunities match your active filters
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Clear your department or keyword filter, or switch to All Campus Directory.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDepartmentFilter('All Departments');
              setIndustryFilter('All Industries');
              setTypeFilter('All Types');
              setModeFilter('All Modes');
              setShowAllFeed(true);
            }}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredResults.map((rec) => {
            const { opportunity, breakdown, explanation } = rec;
            const isSaved = savedIds.has(opportunity.id);
            const isApplied = appliedIds.has(opportunity.id);
            const isExpanded = expandedBreakdownId === opportunity.id;
            const matchPct = Math.round(breakdown.totalScore * 100);
            const aiTip = polishedTips[opportunity.id];

            return (
              <article
                key={opportunity.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors"
              >
                <div className="space-y-3">
                  {/* Quiet 1-line inline metadata kicker (Zero-pill discipline) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {opportunity.organization} · {opportunity.type} · {opportunity.mode}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                      {matchPct}% match
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                    {opportunity.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {opportunity.description}
                  </p>

                  {/* Unboxed inline metadata */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Skills:</span>{' '}
                      {opportunity.tags.join(' · ')}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Details:</span>{' '}
                      {opportunity.industry} · {opportunity.stipendOrPrize} · Closes{' '}
                      <span className="font-mono tabular-nums">{opportunity.deadline}</span>
                    </div>
                  </div>

                  {/* Explainable Recommendation Callout */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {aiTip ? aiTip.text : explanation}
                    </p>
                    {aiTip && (
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Prep brief: {aiTip.tldr}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedBreakdownId(isExpanded ? null : opportunity.id)
                        }
                        aria-expanded={isExpanded}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        Score Breakdown
                      </button>

                      <button
                        type="button"
                        onClick={() => void handlePolishWithAI(rec)}
                        disabled={polishingId === opportunity.id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        {polishingId === opportunity.id
                          ? 'Generating brief...'
                          : 'AI Prep Brief'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <div className="text-slate-400">Semantic 35%</div>
                          <div className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                            {Math.round(breakdown.semanticMatch * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Skills 25%</div>
                          <div className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                            {Math.round(breakdown.skillInterestOverlap * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Time Fit 15%</div>
                          <div className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                            {Math.round(breakdown.availabilityFit * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Goals 15%</div>
                          <div className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                            {Math.round(breakdown.goalAlignment * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">History 10%</div>
                          <div className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                            {Math.round(breakdown.engagementHistory * 100)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSave(opportunity)}
                      aria-label={`Save '${opportunity.title}'`}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isSaved
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                      {isSaved ? 'Saved' : 'Save'}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleShareClick(opportunity)}
                      aria-label={`Share '${opportunity.title}'`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Share
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRegister(opportunity)}
                    disabled={isApplied}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      isApplied
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isApplied && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    {isApplied ? 'Registered' : 'Apply / Register'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
