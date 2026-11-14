import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  Send,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Tag,
  Building2,
  SlidersHorizontal,
  X,
  Share2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { Opportunity, OpportunityType, OpportunityMode, OpportunityApplication } from '../types/ncet';

interface OpportunityDiscoveryViewProps {
  opportunities: Opportunity[];
  recommendedOpportunities: Array<Opportunity & { recommendScore: number; explanation: string }>;
  savedOpportunities: { opportunityId: string }[];
  applications: OpportunityApplication[];
  onApply: (opportunityId: string, notes?: string) => void;
  onToggleSave: (opportunityId: string) => void;
  onToggleVolunteer: (opportunityId: string) => void;
  volunteerOptins: { opportunityId: string }[];
}

export const OpportunityDiscoveryView: React.FC<OpportunityDiscoveryViewProps> = ({
  opportunities,
  recommendedOpportunities,
  savedOpportunities,
  applications,
  onApply,
  onToggleSave,
  onToggleVolunteer,
  volunteerOptins,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recommended' | 'newest' | 'deadline'>('recommended');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [applyNotes, setApplyNotes] = useState('');

  const savedSet = useMemo(
    () => new Set(savedOpportunities.map((s) => s.opportunityId)),
    [savedOpportunities]
  );

  const appliedMap = useMemo(() => {
    const map = new Map<string, string>();
    applications.forEach((a) => map.set(a.opportunityId, a.status));
    return map;
  }, [applications]);

  const volunteerSet = useMemo(
    () => new Set(volunteerOptins.map((v) => v.opportunityId)),
    [volunteerOptins]
  );

  const filteredOpportunities = useMemo(() => {
    const list = [...opportunities];
    return list.filter((opp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesDesc = opp.description.toLowerCase().includes(q);
        const matchesOrg = opp.organization.toLowerCase().includes(q);
        const matchesTags = (opp.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesOrg && !matchesTags) return false;
      }
      if (selectedType !== 'All' && opp.type !== selectedType) return false;
      if (selectedMode !== 'All' && opp.mode !== selectedMode) return false;
      if (selectedLocation !== 'All') {
        if (selectedLocation === 'On campus' && !opp.venue?.toLowerCase().includes('campus') && opp.isExternal) return false;
        if (selectedLocation === 'Bengaluru' && !opp.venue?.toLowerCase().includes('bengaluru') && !opp.venue?.toLowerCase().includes('blr')) return false;
        if (selectedLocation === 'Remote' && opp.venue?.toLowerCase().includes('in-person')) return false;
      }
      if (selectedDept !== 'All') {
        const depts = opp.eligibleDepartments || opp.departments || [];
        if (depts.length > 0 && !depts.includes(selectedDept)) return false;
      }
      return true;
    });
  }, [opportunities, searchQuery, selectedDept, selectedLocation, selectedMode, selectedType]);

  const sortedList = useMemo(() => {
    const list = [...filteredOpportunities];
    if (sortBy === 'recommended') {
      const scoreMap = new Map<string, number>();
      recommendedOpportunities.forEach((r) => scoreMap.set(r.id, r.recommendScore));
      list.sort((a, b) => (scoreMap.get(b.id) ?? 70) - (scoreMap.get(a.id) ?? 70));
    } else if (sortBy === 'deadline') {
      list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [filteredOpportunities, recommendedOpportunities, sortBy]);

  const typeOptions = [
    'All',
    'Internship',
    'Hackathon',
    'Workshop',
    'Competition',
    'Fest',
    'Seminar',
    'Meetup',
    'Campus Project',
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Unified Campus & Bengaluru Tech Ecosystem
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Opportunity Discovery
            </h1>
            <p className="mt-1 text-xs text-slate-400 max-w-xl">
              Explore curated campus hackathons, technical workshops, verified industry internships,
              and Bengaluru tech meetups — with personalized multi-objective match scores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-emerald-400 focus:outline-none"
            >
              <option value="recommended">Personalized Match Score</option>
              <option value="deadline">Registration Deadline</option>
              <option value="newest">Recently Published</option>
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-5 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, required skills, club, organizer, or venue (e.g. ReactJS, PyTorch, GDG)..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Chips Row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            Type:
          </div>
          {typeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedType === t
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
              }`}
            >
              {t}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Mode Selector */}
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Formats</option>
            <option value="In-Person">In-Person</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          {/* Location Selector */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Locations</option>
            <option value="On campus">On Campus</option>
            <option value="Bengaluru">Bengaluru City</option>
            <option value="Remote">Online / Remote</option>
          </select>

          {/* Department Selector */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="AIML">AIML</option>
            <option value="ISE">ISE</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
          </select>
        </div>
      </div>

      {/* Top Personalized Recommendations Carousel / Strip */}
      {recommendedOpportunities.length > 0 && selectedType === 'All' && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Recommended For You (AI Multi-Fit Engine)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Formula: 30% Skills + 20% Interests + 15% Dept + 15% Avail + 10% Location + 10% Urgency
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {recommendedOpportunities.slice(0, 3).map((opp) => (
              <div
                key={opp.id}
                className="group relative flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-slate-900/90 p-4 transition-all hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-950/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      {opp.recommendScore}% Match
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {opp.type}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {opp.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
                    {opp.organization}
                  </p>
                  <div className="mt-2 rounded-lg bg-slate-950/60 p-2 text-[10px] text-emerald-200/90 border border-emerald-500/10">
                    💡 {opp.explanation}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    Due {opp.deadline}
                  </span>
                  <button
                    onClick={() => setSelectedOpp(opp)}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    View Details
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Opportunities Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{sortedList.length}</strong> opportunities
          </span>
        </div>

        {sortedList.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-600" />
            <h3 className="mt-3 text-sm font-semibold text-slate-300">No opportunities match</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try broadening your filters or clearing search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedList.map((opp) => {
              const isSaved = savedSet.has(opp.id);
              const applicationStatus = appliedMap.get(opp.id);
              const isVolunteered = volunteerSet.has(opp.id);
              const recItem = recommendedOpportunities.find((r) => r.id === opp.id);

              return (
                <div
                  key={opp.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/90"
                >
                  <div>
                    {/* Source and Type row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            opp.isExternal
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {opp.isExternal ? '🌐 Bengaluru Tech' : '🏛️ Campus'}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                          {opp.type}
                        </span>
                      </div>
                      <button
                        onClick={() => onToggleSave(opp.id)}
                        className={`p-1 rounded-md transition-colors ${
                          isSaved
                            ? 'text-amber-400 bg-amber-400/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                        title={isSaved ? 'Remove bookmark' : 'Bookmark opportunity'}
                      >
                        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-white line-clamp-1">{opp.title}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Building2 className="h-3 w-3 text-slate-500" />
                      <span>{opp.organization}</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Tags / Skills */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(opp.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] font-medium text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {(opp.tags || []).length > 3 && (
                        <span className="text-[10px] text-slate-500">
                          +{(opp.tags || []).length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Venue & Time info */}
                    <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate">{opp.venue || 'Virtual Event'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                        <span>Deadline: {opp.deadline}</span>
                      </div>
                    </div>

                    {/* Recommendation reason if available */}
                    {recItem && (
                      <div className="mt-2 rounded bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 text-[10px] text-emerald-300">
                        ⚡ {recItem.recommendScore}% Match: {recItem.explanation}
                      </div>
                    )}
                  </div>

                  {/* Action buttons footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      {applicationStatus ? (
                        <div className="flex-1 text-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 py-1.5 text-xs font-bold text-emerald-300 capitalize">
                          Status: {applicationStatus}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOpp(opp);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Apply / Register
                        </button>
                      )}

                      <button
                        onClick={() => onToggleVolunteer(opp.id)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1 ${
                          isVolunteered
                            ? 'border-pink-500/40 bg-pink-500/10 text-pink-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-pink-500/40 hover:text-pink-300'
                        }`}
                        title="Opt-in as event volunteer"
                      >
                        <HeartHandshake className="h-3.5 w-3.5" />
                        {isVolunteered ? 'Volunteering' : 'Volunteer'}
                      </button>
                    </div>

                    {opp.isExternal && opp.externalUrl && (
                      <a
                        href={opp.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center text-[10px] text-cyan-400 hover:underline flex items-center justify-center gap-1"
                      >
                        Official External Link
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Application Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setSelectedOpp(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                {selectedOpp.type}
              </span>
              <span className="text-xs text-slate-400">{selectedOpp.organization}</span>
            </div>

            <h2 className="mt-2 text-lg font-bold text-white">{selectedOpp.title}</h2>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
              {selectedOpp.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                <div className="text-[10px] text-slate-500">Venue / Location</div>
                <div className="font-medium text-slate-200 truncate mt-0.5">
                  {selectedOpp.venue || 'Online / Remote'}
                </div>
              </div>
              <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                <div className="text-[10px] text-slate-500">Stipend / Prize</div>
                <div className="font-medium text-emerald-400 truncate mt-0.5">
                  {selectedOpp.stipendOrPrize || 'Free Participation'}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Application Note / Statement of Interest (Optional)
              </label>
              <textarea
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                placeholder="Highlight relevant projects or why you'd like to join..."
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedOpp(null)}
                className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onApply(selectedOpp.id, applyNotes);
                  setSelectedOpp(null);
                  setApplyNotes('');
                }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                <Send className="h-3.5 w-3.5" />
                Confirm Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
