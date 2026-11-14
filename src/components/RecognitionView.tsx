import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Star,
  Sparkles,
  BookOpen,
  Code2,
  Users,
  Heart,
  ClipboardList,
  Compass,
  Lightbulb,
  CheckCircle2,
  Lock,
  Flame,
  Info,
} from 'lucide-react';
import type { Recognition, RecognitionType, LeaderboardEntry } from '../types/ncet';

interface RecognitionViewProps {
  recognitions: Recognition[];
  leaderboard: LeaderboardEntry[];
  currentStudentId: string;
}

export const RecognitionView: React.FC<RecognitionViewProps> = ({
  recognitions,
  leaderboard,
  currentStudentId,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('Overall');

  const myRecognitions = recognitions.filter((r) => r.studentId === currentStudentId);
  const myTotalPoints = myRecognitions.reduce((sum, r) => sum + r.points, 0);
  const myBadgesSet = new Set(myRecognitions.map((r) => r.recognitionType));

  const myRankEntry = leaderboard.find((l) => l.studentId === currentStudentId);
  const myRank = myRankEntry ? myRankEntry.rank : '-';

  const allBadgeTypes: Array<{
    type: RecognitionType;
    icon: React.ReactNode;
    color: string;
    description: string;
    pointsReward: number;
  }> = [
    {
      type: 'Active Learner',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'from-blue-500 to-indigo-600',
      description: 'Attend campus workshops, guest lectures, and tech seminars.',
      pointsReward: 20,
    },
    {
      type: 'Hackathon Participant',
      icon: <Code2 className="h-5 w-5" />,
      color: 'from-purple-500 to-pink-600',
      description: 'Register and build solutions at hackathons and code sprints.',
      pointsReward: 30,
    },
    {
      type: 'Hackathon Winner',
      icon: <Trophy className="h-5 w-5" />,
      color: 'from-amber-400 to-orange-500',
      description: 'Secure 1st, 2nd, or 3rd podium place in recognized hackathons.',
      pointsReward: 100,
    },
    {
      type: 'Club Contributor',
      icon: <Users className="h-5 w-5" />,
      color: 'from-teal-400 to-emerald-600',
      description: 'Active contribution to NCET clubs (GDG, CodeChef, Robotics, E-Cell).',
      pointsReward: 25,
    },
    {
      type: 'Open-Source Contributor',
      icon: <Code2 className="h-5 w-5" />,
      color: 'from-cyan-400 to-blue-600',
      description: 'Merged pull requests into verified open-source repositories.',
      pointsReward: 40,
    },
    {
      type: 'Community Volunteer',
      icon: <Heart className="h-5 w-5" />,
      color: 'from-pink-500 to-rose-600',
      description: 'Volunteer support at campus festivals, study jams, and community meetups.',
      pointsReward: 25,
    },
    {
      type: 'Event Organizer',
      icon: <ClipboardList className="h-5 w-5" />,
      color: 'from-violet-500 to-purple-600',
      description: 'Plan, curate, and host departmental or inter-college events.',
      pointsReward: 35,
    },
    {
      type: 'Campus Ambassador',
      icon: <Star className="h-5 w-5" />,
      color: 'from-yellow-400 to-amber-500',
      description: 'Represent NCET in external developer programs (Google, Postman, etc.).',
      pointsReward: 35,
    },
    {
      type: 'Research Contributor',
      icon: <Medal className="h-5 w-5" />,
      color: 'from-indigo-400 to-violet-600',
      description: 'Author or co-author technical research papers and lab benchmarks.',
      pointsReward: 50,
    },
    {
      type: 'Mentor',
      icon: <Compass className="h-5 w-5" />,
      color: 'from-emerald-400 to-teal-500',
      description: 'Mentor junior peers in interview prep, algorithms, or coding sprints.',
      pointsReward: 45,
    },
    {
      type: 'Innovation Champion',
      icon: <Lightbulb className="h-5 w-5" />,
      color: 'from-orange-400 to-red-500',
      description: 'Pioneering innovative prototypes recognized at NCET Innovation Day.',
      pointsReward: 60,
    },
  ];

  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (filterCategory === 'Overall') return true;
    if (filterCategory === 'Hackathon') {
      return entry.badges.includes('Hackathon Participant') || entry.badges.includes('Hackathon Winner');
    }
    if (filterCategory === 'Volunteer') {
      return entry.badges.includes('Community Volunteer');
    }
    if (filterCategory === 'Open-Source') {
      return entry.badges.includes('Open-Source Contributor');
    }
    if (filterCategory === 'Club') {
      return entry.badges.includes('Club Contributor');
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Stats Header */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Student Recognition & Engagement Honors
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Celebrate Learning & Campus Contribution
            </h1>
            <p className="mt-1 text-xs text-slate-400 max-w-xl">
              Earn verified recognition badges for event participation, hackathon excellence,
              open-source commits, community volunteering, and peer mentorship.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-500/30 bg-slate-950/80 px-4 py-3 text-center">
              <div className="text-[10px] text-slate-400 font-medium">Your Campus Rank</div>
              <div className="text-xl font-extrabold text-amber-400">#{myRank}</div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-slate-950/80 px-4 py-3 text-center">
              <div className="text-[10px] text-slate-400 font-medium">Total Honor Points</div>
              <div className="text-xl font-extrabold text-emerald-400">{myTotalPoints} pts</div>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Pills */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">Badges Unlocked</div>
            <div className="text-base font-bold text-white mt-0.5">
              {myBadgesSet.size} / {allBadgeTypes.length}
            </div>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">Verified Activities</div>
            <div className="text-base font-bold text-white mt-0.5">{myRecognitions.length} Recorded</div>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">Top Achievement</div>
            <div className="text-base font-bold text-amber-300 mt-0.5 truncate">
              {myRecognitions[0]?.recognitionType || 'Active Learner'}
            </div>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">Recognition Model</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5">Non-Stigmatizing</div>
          </div>
        </div>
      </div>

      {/* Badges Collection Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-400" />
            Recognition Badge Gallery (11 Honors)
          </h2>
          <span className="text-xs text-slate-400">
            Gold borders denote unlocked badges
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allBadgeTypes.map((badge) => {
            const isUnlocked = myBadgesSet.has(badge.type);
            const matchingRec = myRecognitions.find((r) => r.recognitionType === badge.type);

            return (
              <div
                key={badge.type}
                className={`relative overflow-hidden rounded-xl p-4 border transition-all ${
                  isUnlocked
                    ? 'border-amber-500/50 bg-slate-900/90 shadow-sm'
                    : 'border-slate-800 bg-slate-950/40 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${
                      isUnlocked ? badge.color : 'from-slate-800 to-slate-900 text-slate-600'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`text-xs font-bold truncate ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                        {badge.type}
                      </h3>
                      {isUnlocked ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                          <Lock className="h-3 w-3" />
                          Locked
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-semibold">+{badge.pointsReward} Points</span>
                      {matchingRec?.reason && (
                        <span className="text-slate-500 truncate max-w-[140px]" title={matchingRec.reason}>
                          {matchingRec.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              Active Campus Contributors Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rankings recognize active contribution and peer support across departments.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['Overall', 'Hackathon', 'Volunteer', 'Open-Source', 'Club'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Rank</th>
                <th className="pb-3 font-semibold">Student / Alias</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Badges Earned</th>
                <th className="pb-3 font-semibold text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeaderboard.map((entry) => {
                const isMe = entry.studentId === currentStudentId;
                return (
                  <tr
                    key={entry.studentId}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-amber-500/10 font-bold text-amber-300'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-3">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-black'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-black'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-semibold">{entry.displayName}</div>
                      {entry.anonymousName && (
                        <div className="text-[10px] text-slate-500">
                          Alias: {entry.anonymousName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-slate-400">{entry.department}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {entry.badges.slice(0, 2).map((b) => (
                          <span
                            key={b}
                            className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
                          >
                            {b}
                          </span>
                        ))}
                        {entry.badges.length > 2 && (
                          <span className="text-[10px] text-slate-500">
                            +{entry.badges.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-extrabold text-emerald-400">
                      {entry.totalPoints} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Positive Ethics Note */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-950 p-3 text-xs text-slate-400 border border-slate-800/80">
          <Info className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Engagement Ethics Principle:</strong> Recognition is designed to encourage
            collaborative growth and cross-department participation, rather than stressful
            academic competition.
          </span>
        </div>
      </div>
    </div>
  );
};
