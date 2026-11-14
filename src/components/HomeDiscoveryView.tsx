import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Users,
  Calendar,
  ArrowRight,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  Code2,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Vote,
  Target,
  Trophy,
  Flame,
  Award,
  ChevronRight,
  ExternalLink,
  Shield,
  HelpCircle,
} from 'lucide-react';
import type {
  Opportunity,
  StudentProfile,
  CommunityPost,
  CommunityPoll,
  CircleProfile,
  OpportunityApplication,
} from '../types/ncet';

interface HomeDiscoveryViewProps {
  profile: StudentProfile;
  recommendedOpportunities: Array<Opportunity & { recommendScore: number; explanation: string }>;
  allOpportunities: Opportunity[];
  communityPosts: CommunityPost[];
  communityPolls: CommunityPoll[];
  peerMatches: Array<CircleProfile & { matchScore: number; explanation: string }>;
  savedOpportunities: { opportunityId: string }[];
  applications: OpportunityApplication[];
  onNavigateTab: (tab: string, subCategory?: string) => void;
  onApply: (opportunityId: string) => void;
  onToggleSave: (opportunityId: string) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  onOpenOnboarding: () => void;
}

export const HomeDiscoveryView: React.FC<HomeDiscoveryViewProps> = ({
  profile,
  recommendedOpportunities,
  allOpportunities,
  communityPosts,
  communityPolls,
  peerMatches,
  savedOpportunities,
  applications,
  onNavigateTab,
  onApply,
  onToggleSave,
  onVotePoll,
  onOpenOnboarding,
}) => {
  const [filterType, setFilterType] = useState('All');
  const firstName = profile.displayName.split(' ')[0] || 'Student';

  const savedSet = new Set(savedOpportunities.map((s) => s.opportunityId));
  const appliedSet = new Set(applications.map((a) => a.opportunityId));

  // Today's Campus Highlights (Top 5 curated cards across categories)
  const campusHighlights = allOpportunities.slice(0, 5);

  // Active Poll Preview
  const activePoll = communityPolls[0];

  // Trending Post Preview
  const trendingPost = communityPosts.slice().sort((a, b) => b.upvotes - a.upvotes)[0];

  // Top Peer Match Preview
  const topPeer = peerMatches[0];

  // Filtered recommended items
  const filteredRecommendations = recommendedOpportunities.filter((opp) => {
    if (filterType === 'All') return true;
    return opp.type === filterType;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* 4.1 Welcome Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Smart Campus Engagement Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Hey, {firstName}! What’s happening in your campus today?
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Discover opportunities tailored for {profile.department} {profile.year}, collaborate
            with ambitious peers in Campus Circles, and advance your engineering journey.
          </p>

          {/* 3 Personalized Goal Fast Actions */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('explore', 'Opportunities')}
              className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-left transition-all hover:border-emerald-500/60 hover:bg-slate-950"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  🚀 Explore Opportunities
                </div>
                <div className="text-[11px] text-slate-400">Internships & Hackathons</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('community')}
              className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-left transition-all hover:border-purple-500/60 hover:bg-slate-950"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                  🤝 Find Like-Minded Peers
                </div>
                <div className="text-[11px] text-slate-400">Campus Circles & Teams</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 group-hover:text-purple-400 transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('explore', 'Events')}
              className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-left transition-all hover:border-cyan-500/60 hover:bg-slate-950"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                  ⚡ Bengaluru Tech Events
                </div>
                <div className="text-[11px] text-slate-400">GDG, Devfolio, Meetups</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </section>

      {/* 4.2 Today's Campus Highlights (Horizontal Carousel) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Today’s Campus Highlights
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('explore', 'Events')}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>See All Highlights</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {campusHighlights.map((item, idx) => {
            const isRegistered = appliedSet.has(item.id);
            return (
              <div
                key={item.id}
                className="w-72 shrink-0 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 transition-all hover:border-slate-700 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {idx === 0
                        ? '🔥 Trending'
                        : idx === 1
                        ? '🏆 Hackathon'
                        : idx === 2
                        ? '💡 Workshop'
                        : '🏛️ Campus'}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.type}</span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{item.organization}</p>

                  <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>{item.deadline ? `Due ${item.deadline}` : 'Upcoming'}</span>
                    <span>•</span>
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span className="truncate">{item.venue || 'Campus Hub'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  {isRegistered ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Registered
                    </span>
                  ) : (
                    <button
                      onClick={() => onApply(item.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                    >
                      Join / Register
                    </button>
                  )}
                  <button
                    onClick={() => onToggleSave(item.id)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Bookmark"
                  >
                    <Bookmark
                      className={`h-4 w-4 ${savedSet.has(item.id) ? 'fill-amber-400 text-amber-400' : ''}`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4.3 Recommended For You (AI-Personalized Feed) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Recommended For You
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Personalized for your {profile.skills.slice(0, 3).join(', ')} skills and goals.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Internship', 'Hackathon', 'Workshop', 'Competition'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterType === t
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 3-4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredRecommendations.slice(0, 3).map((opp) => (
            <div
              key={opp.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/90"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    ⚡ {opp.recommendScore}% Match
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{opp.type}</span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-white line-clamp-1">{opp.title}</h3>
                <p className="text-[11px] text-slate-400">{opp.organization}</p>

                <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>

                {/* Match Explanation Pill */}
                <div className="mt-3 rounded-lg bg-slate-950 p-2 text-[10px] text-emerald-200/90 border border-emerald-500/10">
                  💡 {opp.explanation}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onApply(opp.id)}
                  disabled={appliedSet.has(opp.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    appliedSet.has(opp.id)
                      ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {appliedSet.has(opp.id) ? 'Applied' : 'Apply Now'}
                </button>
                <button
                  onClick={() => onToggleSave(opp.id)}
                  className="p-1.5 text-slate-400 hover:text-white"
                  title="Bookmark"
                >
                  <Bookmark
                    className={`h-4 w-4 ${savedSet.has(opp.id) ? 'fill-amber-400 text-amber-400' : ''}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigateTab('explore', 'Opportunities')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Compass className="h-4 w-4 text-emerald-400" />
            Explore All Opportunities & Events ({allOpportunities.length})
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* 4.4 Your Community is Active (Community Preview Section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Your Community is Active
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('community')}
            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            <span>Enter Community Hub</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Interactive Campus Poll */}
          {activePoll && (
            <div className="flex flex-col justify-between rounded-2xl border border-purple-500/20 bg-slate-900 p-5 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Vote className="h-3.5 w-3.5" /> Campus Poll
                  </span>
                  <span className="text-[10px] text-slate-400">{activePoll.totalVotes} votes</span>
                </div>
                <h3 className="mt-2 text-xs font-bold text-white">{activePoll.question}</h3>
                <div className="mt-3 space-y-1.5">
                  {activePoll.options.slice(0, 3).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onVotePoll(activePoll.id, opt.id)}
                      className="w-full text-left rounded-lg bg-slate-950 px-3 py-1.5 text-xs text-slate-300 border border-slate-800 hover:border-purple-500/50 flex items-center justify-between group"
                    >
                      <span className="truncate">{opt.text}</span>
                      <span className="text-[10px] text-purple-400 font-mono">
                        {opt.votes}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('community')}
                className="text-[11px] font-semibold text-purple-400 hover:underline flex items-center gap-1"
              >
                View poll discussion <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Card 2: Trending Discussion */}
          {trendingPost && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <MessageSquare className="h-3.5 w-3.5" /> Trending Discussion
                  </span>
                  <span className="text-[10px] text-slate-500">#{trendingPost.topic}</span>
                </div>
                <h3 className="mt-2 text-xs font-bold text-white line-clamp-2">
                  {trendingPost.title}
                </h3>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 italic">
                  "{trendingPost.content}"
                </p>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
                  <span>▲ {trendingPost.upvotes} upvotes</span>
                  <span>💬 {trendingPost.comments.length} replies</span>
                  <span>By {trendingPost.authorAliasName}</span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('community')}
                className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                Join this discussion <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Card 3: Like-Minded Peer Match Spotlight */}
          {topPeer && (
            <div className="flex flex-col justify-between rounded-2xl border border-purple-500/20 bg-slate-900 p-5 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Like-Minded Peer
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {topPeer.matchScore}% Synergy
                  </span>
                </div>
                <h3 className="mt-2 text-xs font-bold text-white">{topPeer.anonymousName}</h3>
                <div className="text-[10px] text-slate-400">
                  {topPeer.department} • Seeking {topPeer.connectionIntent}
                </div>
                <p className="mt-2 text-[11px] text-slate-300 leading-relaxed italic line-clamp-2">
                  "{topPeer.bio}"
                </p>
                <div className="mt-2 rounded bg-purple-950/40 p-1.5 text-[10px] text-purple-300 border border-purple-500/20">
                  ✨ {topPeer.explanation}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('community')}
                className="rounded-lg bg-purple-600 py-1.5 text-xs font-bold text-white hover:bg-purple-500 flex items-center justify-center gap-1"
              >
                Connect in Circles <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4.5 Your Personal Progress (Encouraging Growth Widget) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Your Campus Growth & Activity
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('journey')}
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Journey</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
            <div className="text-[10px] text-slate-400 font-medium">Applications Sent</div>
            <div className="text-xl font-extrabold text-white mt-1">{applications.length}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Active Pipelines</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
            <div className="text-[10px] text-slate-400 font-medium">Saved Bookmarks</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1">
              {savedOpportunities.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">In Shortlist</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
            <div className="text-[10px] text-slate-400 font-medium">Verified Attendance</div>
            <div className="text-xl font-extrabold text-cyan-400 mt-1">
              {profile.attendanceCount || 4}
            </div>
            <div className="text-[10px] text-cyan-300 mt-0.5">Campus Events</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
            <div className="text-[10px] text-slate-400 font-medium">Honors & Badges</div>
            <div className="text-xl font-extrabold text-purple-400 mt-1">
              {profile.badges?.length || 4}
            </div>
            <div className="text-[10px] text-purple-300 mt-0.5">Verified Honors</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>Targeting: {profile.careerGoals.slice(0, 2).join(' • ')}</span>
          <button
            onClick={onOpenOnboarding}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Update Goals & Skills ⚙️
          </button>
        </div>
      </section>
    </div>
  );
};
