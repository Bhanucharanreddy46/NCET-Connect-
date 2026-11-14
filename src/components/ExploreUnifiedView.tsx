import React, { useState, useMemo } from 'react';
import {
  Compass,
  Briefcase,
  Calendar,
  Users,
  Layers,
  Code2,
  BookOpen,
  Search,
  Filter,
  Bookmark,
  Send,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  X,
  UserPlus,
  HeartHandshake,
  CalendarDays,
  LayoutGrid,
} from 'lucide-react';
import type {
  Opportunity,
  StudentProfile,
  CircleProfile,
  LearningGroup,
  OpportunityApplication,
} from '../types/ncet';

export type ExploreCategory =
  | 'Opportunities'
  | 'Events'
  | 'People'
  | 'Communities'
  | 'Projects'
  | 'Learning';

interface ExploreUnifiedViewProps {
  initialCategory?: ExploreCategory;
  opportunities: Opportunity[];
  recommendedOpportunities: Array<Opportunity & { recommendScore: number; explanation: string }>;
  savedOpportunities: { opportunityId: string }[];
  applications: OpportunityApplication[];
  peerMatches: Array<CircleProfile & { matchScore: number; explanation: string }>;
  learningGroups: LearningGroup[];
  profile: StudentProfile;
  onApply: (opportunityId: string) => void;
  onToggleSave: (opportunityId: string) => void;
  onConnectPeer: (peerId: string) => void;
  onJoinGroup: (groupId: string) => void;
  onNavigateToCommunity: () => void;
}

export const ExploreUnifiedView: React.FC<ExploreUnifiedViewProps> = ({
  initialCategory = 'Opportunities',
  opportunities,
  recommendedOpportunities,
  savedOpportunities,
  applications,
  peerMatches,
  learningGroups,
  profile,
  onApply,
  onToggleSave,
  onConnectPeer,
  onJoinGroup,
  onNavigateToCommunity,
}) => {
  const [activeCategory, setActiveCategory] = useState<ExploreCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [subFilter, setSubFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const savedSet = useMemo(() => new Set(savedOpportunities.map((s) => s.opportunityId)), [savedOpportunities]);
  const appliedSet = useMemo(() => new Set(applications.map((a) => a.opportunityId)), [applications]);

  // Categories config
  const categories: Array<{ id: ExploreCategory; label: string; icon: React.ReactNode; desc: string }> = [
    { id: 'Opportunities', label: 'Opportunities', icon: <Briefcase className="h-4 w-4" />, desc: 'Internships, Hackathons & Placements' },
    { id: 'Events', label: 'Events & Meetups', icon: <Calendar className="h-4 w-4" />, desc: 'Campus Fests & Bengaluru Tech Gatherings' },
    { id: 'People', label: 'People & Peers', icon: <Users className="h-4 w-4" />, desc: 'Connect with Like-Minded Students' },
    { id: 'Communities', label: 'Communities & Circles', icon: <Layers className="h-4 w-4" />, desc: 'Clubs, Hubs & Technical Circles' },
    { id: 'Projects', label: 'Student Projects', icon: <Code2 className="h-4 w-4" />, desc: 'Collaborate on Open Team Needs' },
    { id: 'Learning', label: 'Peer Learning', icon: <BookOpen className="h-4 w-4" />, desc: 'Study Groups & Resource Circles' },
  ];

  // Filtered Opportunities
  const filteredOpps = useMemo(() => {
    return opportunities.filter((opp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesOrg = opp.organization.toLowerCase().includes(q);
        const matchesTags = (opp.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesOrg && !matchesTags) return false;
      }
      if (subFilter !== 'All' && opp.type !== subFilter) return false;
      return true;
    });
  }, [opportunities, searchQuery, subFilter]);

  // Filtered Events (Campus events + Bengaluru tech ecosystem)
  const filteredEvents = useMemo(() => {
    return opportunities.filter((opp) => {
      const isEvent = opp.type === 'Workshop' || opp.type === 'Fest' || opp.type === 'Competition' || opp.type === 'Seminar' || opp.isExternal;
      if (!isEvent) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesOrg = opp.organization.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOrg) return false;
      }
      if (subFilter === 'Campus' && opp.isExternal) return false;
      if (subFilter === 'Bengaluru' && !opp.isExternal) return false;
      return true;
    });
  }, [opportunities, searchQuery, subFilter]);

  // Filtered People / Peer Matches
  const filteredPeers = useMemo(() => {
    return peerMatches.filter((peer) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = peer.anonymousName.toLowerCase().includes(q);
        const matchesDept = peer.department.toLowerCase().includes(q);
        const matchesSkills = peer.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesDept && !matchesSkills) return false;
      }
      if (subFilter !== 'All' && peer.connectionIntent !== subFilter) return false;
      return true;
    });
  }, [peerMatches, searchQuery, subFilter]);

  // Projects Mock Showcase
  const studentProjects = [
    {
      id: 'proj-1',
      title: 'Autonomous Drone Navigation using Edge AI',
      lead: 'Robotics & AI Club',
      department: 'CSE / ECE',
      tags: ['PyTorch', 'ROS', 'Python', 'C++'],
      seeking: '2 Teammates (Computer Vision & Embedded Hardware)',
      description: 'Building an obstacle-avoiding quadcopter for internal campus delivery testing at Visvesvaraya Hall.',
    },
    {
      id: 'proj-2',
      title: 'NCET PWA Smart Attendance & Verification Ledger',
      lead: 'Open Source Circle',
      department: 'AIML / ISE',
      tags: ['ReactJS', 'TypeScript', 'Web Crypto', 'Workbox'],
      seeking: '1 Frontend Contributor (UI Components & Animations)',
      description: 'Contributing to open-source campus tooling with offline-first caching and cryptographic document vaults.',
    },
    {
      id: 'proj-3',
      title: 'Decentralized Micro-Credential Badging on Polygon',
      lead: 'Web3 & Fintech Chapter',
      department: 'CSE',
      tags: ['Solidity', 'Ethereum', 'Web3.js'],
      seeking: 'Smart Contract Auditor',
      description: 'Creating verifiable NFT attendance credentials for NCET national hackathon participants.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Compass className="h-4 w-4" />
              <span>Campus Discovery Engine</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white tracking-tight">
              Explore Everything Across NCET
            </h1>
            <p className="text-xs text-slate-400">
              Find internships, campus competitions, Bengaluru tech events, student collaborators, and learning circles.
            </p>
          </div>

          {/* Category Tabs Pill Row */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-950 p-1.5 border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSubFilter('All');
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search across ${activeCategory.toLowerCase()} (e.g. ReactJS, Hackathon, GDG, Python)...`}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
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
      </div>

      {/* CATEGORY A: OPPORTUNITIES */}
      {activeCategory === 'Opportunities' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Internship', 'Hackathon', 'Competition', 'Workshop'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSubFilter(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    subFilter === t
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              Showing <strong>{filteredOpps.length}</strong> opportunities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpps.map((opp) => {
              const isApplied = appliedSet.has(opp.id);
              const isSaved = savedSet.has(opp.id);
              const recItem = recommendedOpportunities.find((r) => r.id === opp.id);

              return (
                <div
                  key={opp.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/90"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        {opp.type}
                      </span>
                      <button
                        onClick={() => onToggleSave(opp.id)}
                        className={`p-1 rounded transition-colors ${
                          isSaved ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-white line-clamp-1">{opp.title}</h3>
                    <p className="text-[11px] text-slate-400">{opp.organization}</p>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {(opp.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {recItem && (
                      <div className="mt-3 rounded bg-emerald-950/40 border border-emerald-500/20 p-2 text-[10px] text-emerald-300">
                        ⚡ {recItem.recommendScore}% Match: {recItem.explanation}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => onApply(opp.id)}
                      disabled={isApplied}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        isApplied
                          ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {isApplied ? 'Application Sent' : 'Apply Now'}
                    </button>
                    <span className="text-[11px] text-slate-400">{opp.deadline ? `Due ${opp.deadline}` : 'Open'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY B: EVENTS */}
      {activeCategory === 'Events' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Campus', 'Bengaluru'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSubFilter(f)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    subFilter === f
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'Campus' ? '🏛️ NCET Campus' : f === 'Bengaluru' ? '🌐 Bengaluru Tech' : 'All Events'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg text-xs font-medium ${
                  viewMode === 'calendar' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        evt.isExternal
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {evt.isExternal ? '🌐 Bengaluru Community' : '🏛️ Campus Event'}
                    </span>
                    <span className="text-[10px] text-slate-400">{evt.mode || 'In-Person'}</span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-white line-clamp-1">{evt.title}</h3>
                  <p className="text-[11px] text-slate-400">{evt.organization}</p>
                  <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                      <span className="truncate">{evt.venue || 'Campus Auditorium'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                      <span>{evt.eventDate ? `Date: ${evt.eventDate}` : `Deadline: ${evt.deadline}`}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onApply(evt.id)}
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500"
                  >
                    Register / RSVP
                  </button>
                  {evt.isExternal && evt.externalUrl && (
                    <a
                      href={evt.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Official Page <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY C: PEOPLE */}
      {activeCategory === 'People' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Connecting with peers based on shared interests & complementary skills
            </span>
            <button
              onClick={onNavigateToCommunity}
              className="text-xs font-semibold text-purple-400 hover:underline flex items-center gap-1"
            >
              Open Campus Circles <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeers.map((peer) => (
              <div
                key={peer.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-white">{peer.anonymousName}</div>
                    <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 text-xs font-bold">
                      {peer.matchScore}% Synergy
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {peer.department} • {peer.academicYear}
                  </div>

                  <div className="mt-2 rounded bg-purple-950/30 border border-purple-500/20 px-2.5 py-1 text-[10px] font-semibold text-purple-300">
                    🎯 Looking for: {peer.connectionIntent}
                  </div>

                  <p className="mt-2 text-xs text-slate-300 italic line-clamp-2">"{peer.bio}"</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {peer.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-950 p-2 text-[10px] text-purple-200/90 border border-purple-500/10">
                    ⚡ <strong>Why recommended:</strong> {peer.explanation}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onConnectPeer(peer.id)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Connect Anonymously
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY D: COMMUNITIES */}
      {activeCategory === 'Communities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {learningGroups.map((grp) => (
            <div
              key={grp.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                    {grp.topic}
                  </span>
                  <span className="text-[10px] text-slate-400">{grp.membersCount} Members</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-white">{grp.name}</h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {grp.description}
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span>Mode: {grp.meetingMode}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => onJoinGroup(grp.id)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    grp.isMember
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {grp.isMember ? 'Joined Community' : 'Join Community'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CATEGORY E: PROJECTS */}
      {activeCategory === 'Projects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studentProjects.map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-bold">
                    {proj.lead}
                  </span>
                  <span>{proj.department}</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-white">{proj.title}</h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {proj.description}
                </p>

                <div className="mt-2 rounded bg-indigo-950/30 border border-indigo-500/20 p-2 text-[10px] text-indigo-300">
                  🤝 <strong>Seeking:</strong> {proj.seeking}
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {proj.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={onNavigateToCommunity}
                  className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Request to Join Project Team
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CATEGORY F: LEARNING */}
      {activeCategory === 'Learning' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <span className="rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-bold">
              Study Circle
            </span>
            <h3 className="text-sm font-bold text-white">Daily LeetCode Hard Sprint</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Targeted algorithm practice for 3rd and 4th year product interview preparation.
            </p>
            <div className="text-[11px] text-slate-400">Schedule: Tuesdays & Thursdays 5:00 PM</div>
            <button
              onClick={onNavigateToCommunity}
              className="w-full rounded-lg bg-amber-600 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
            >
              Join Study Room
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-bold">
              Paper Reading Club
            </span>
            <h3 className="text-sm font-bold text-white">NCET Applied AI Research Lab</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Weekly breakdown of recent arXiv LLM quantization and multimodal agent papers.
            </p>
            <div className="text-[11px] text-slate-400">Schedule: Saturdays 11:00 AM</div>
            <button
              onClick={onNavigateToCommunity}
              className="w-full rounded-lg bg-purple-600 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
            >
              Join Reading Group
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <span className="rounded bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-bold">
              CTF Practice
            </span>
            <h3 className="text-sm font-bold text-white">Cybersecurity & Ethical Hacking Hub</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hands-on reverse engineering, web security, and vulnerability lab challenges.
            </p>
            <div className="text-[11px] text-slate-400">Schedule: Fridays 4:00 PM</div>
            <button
              onClick={onNavigateToCommunity}
              className="w-full rounded-lg bg-cyan-600 py-1.5 text-xs font-bold text-white hover:bg-cyan-500"
            >
              Join CTF Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
