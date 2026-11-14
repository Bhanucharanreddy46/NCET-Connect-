import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Globe,
  HelpCircle,
  Lock,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type {
  CommunityAlias,
  CommunityComment,
  CommunityPoll,
  CommunityPost,
  CommunityReport,
  CommunityTopic,
  LearningGroup,
  PeerMatch,
  StudentProfile,
} from '../types/ncet';

interface AnonymousConnectViewProps {
  alias: CommunityAlias;
  profile: StudentProfile;
  posts: CommunityPost[];
  polls: CommunityPoll[];
  peerMatches: PeerMatch[];
  groups: LearningGroup[];
  onRegenerateAlias: () => CommunityAlias;
  onCreatePost: (topic: CommunityTopic, title: string, content: string, tags: string[]) => void;
  onUpvotePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  onCreatePoll: (topic: string, question: string, options: string[]) => void;
  onRequestPeerConnection: (matchId: string) => void;
  onAcceptPeerConnection: (matchId: string) => void;
  onRevealMutualIdentity: (matchId: string) => void;
  onToggleGroupMembership: (groupId: string) => void;
  onCreateLearningGroup: (
    name: string,
    topic: string,
    description: string,
    meetingMode: 'Campus Innovation Lab' | 'Virtual Room' | 'Library Discussion Hub',
    tags: string[]
  ) => void;
  onReportContent: (
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    targetTitle: string,
    reason: string
  ) => void;
}

const TOPICS: Array<CommunityTopic | 'All Topics'> = [
  'All Topics',
  'AI & ML',
  'Web Dev',
  'Cybersecurity',
  'Robotics',
  'Design',
  'Startups',
  'Competitive Programming',
  'General Learning',
];

export const AnonymousConnectView: React.FC<AnonymousConnectViewProps> = ({
  alias,
  profile,
  posts,
  polls,
  peerMatches,
  groups,
  onRegenerateAlias,
  onCreatePost,
  onUpvotePost,
  onAddComment,
  onVotePoll,
  onCreatePoll,
  onRequestPeerConnection,
  onAcceptPeerConnection,
  onRevealMutualIdentity,
  onToggleGroupMembership,
  onCreateLearningGroup,
  onReportContent,
}) => {
  const [subTab, setSubTab] = useState<'discussions' | 'polls' | 'matches' | 'groups'>(
    'discussions'
  );
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | 'All Topics'>('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);

  // New Post modal state
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostTopic, setNewPostTopic] = useState<CommunityTopic>('AI & ML');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('AI, Research, Python');

  // New Poll modal state
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [newPollTopic, setNewPollTopic] = useState('Tech Stack');
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['Option 1', 'Option 2', 'Option 3']);

  // New Group modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('Hackathons & Competitions');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupMode, setNewGroupMode] = useState<
    'Campus Innovation Lab' | 'Virtual Room' | 'Library Discussion Hub'
  >('Campus Innovation Lab');
  const [newGroupTags, setNewGroupTags] = useState('Hackathons, Pitching');

  // Active post comments drawer
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Mutual reveal modal state
  const [revealTargetMatch, setRevealTargetMatch] = useState<PeerMatch | null>(null);

  // Reporting modal
  const [reportingTarget, setReportingTarget] = useState<{
    type: 'post' | 'comment' | 'user';
    id: string;
    title: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState('Spam or commercial promotion');

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchTopic = selectedTopic === 'All Topics' || p.topic === selectedTopic;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchTopic && matchQuery;
    });
  }, [posts, selectedTopic, searchQuery]);

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    const tags = newPostTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onCreatePost(newPostTopic, newPostTitle.trim(), newPostContent.trim(), tags);
    setNewPostTitle('');
    setNewPostContent('');
    setShowCreatePostModal(false);
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) return;
    const cleanOpts = newPollOptions.map((o) => o.trim()).filter(Boolean);
    if (cleanOpts.length < 2) return;
    onCreatePoll(newPollTopic.trim(), newPollQuestion.trim(), cleanOpts);
    setNewPollQuestion('');
    setShowCreatePollModal(false);
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) return;
    const tags = newGroupTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onCreateLearningGroup(newGroupName.trim(), newGroupTopic.trim(), newGroupDesc.trim(), newGroupMode, tags);
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateGroupModal(false);
  };

  const handleAddCommentSubmit = (postId: string) => {
    if (!commentInput.trim()) return;
    onAddComment(postId, commentInput.trim());
    setCommentInput('');
  };

  const handleConfirmMutualReveal = () => {
    if (revealTargetMatch) {
      onRevealMutualIdentity(revealTargetMatch.id);
      setRevealTargetMatch(null);
    }
  };

  const handleConfirmReport = () => {
    if (reportingTarget) {
      onReportContent(
        reportingTarget.type,
        reportingTarget.id,
        reportingTarget.title,
        reportReason
      );
      setReportingTarget(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Anonymous Connect Header & Identity Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                NCET Anonymous Connect
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Mutual-Consent Protected
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Interest-Based Peer Community
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore shared interests, vote in anonymous polls, and collaborate on tech
              projects. Your institutional identity (<span className="text-indigo-200 font-medium">@{profile.department.toLowerCase()}</span>) is never displayed without explicit mutual consent.
            </p>
          </div>

          {/* Alias Card */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 p-4 rounded-xl flex items-center gap-4 shrink-0 shadow-inner">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-md">
              {alias.aliasName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Active Pseudonym
              </div>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                {alias.aliasName}
              </div>
              <div className="text-xs text-indigo-300 flex items-center gap-2">
                <span>{alias.reputationPoints} Community Karma</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowGuidelines(true)}
                  className="text-slate-400 hover:text-white underline text-[11px]"
                >
                  Privacy Rules
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={onRegenerateAlias}
              title="Generate fresh pseudonym"
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors ml-2"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('discussions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              subTab === 'discussions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Anonymous Discussions ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('polls')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              subTab === 'polls'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Interest Polls ({polls.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('matches')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              subTab === 'matches'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Like-Minded Discovery ({peerMatches.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('groups')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              subTab === 'groups'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Learning & Project Groups ({groups.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ANONYMOUS DISCUSSIONS */}
      {subTab === 'discussions' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search discussions by topic, keywords or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreatePostModal(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Post Pseudonymously
              </button>
            </div>
          </div>

          {/* Topic Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedTopic === topic
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-400" />
                <div className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  No discussions found in #{selectedTopic}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Be the first student to publish an inquiry, tech benchmark, or project idea under your pseudonymous alias!
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(true)}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Start Discussion
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isExpanded = expandedPostId === post.id;
                return (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {post.authorAliasName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {post.authorAliasName}
                            {post.authorAliasId === alias.id && (
                              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          #{post.topic}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReportingTarget({
                              type: 'post',
                              id: post.id,
                              title: post.title,
                            })
                          }
                          title="Report content"
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Body */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-400 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => onUpvotePost(post.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors font-medium ${
                            post.hasUpvoted
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{post.upvotes} Upvotes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium text-slate-600 dark:text-slate-300"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{post.commentCount} Comments</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Pseudonymous identity verified
                      </div>
                    </div>

                    {/* Comments Drawer */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-lg mt-2">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Replies ({post.comments?.length || 0})
                        </div>

                        {post.comments && post.comments.length > 0 ? (
                          <div className="space-y-2">
                            {post.comments.map((c) => (
                              <div
                                key={c.id}
                                className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-750 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {c.authorAliasName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(c.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300">{c.content}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No comments yet.</div>
                        )}

                        {/* Comment input box */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={`Reply as ${alias.aliasName}...`}
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddCommentSubmit(post.id);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCommentSubmit(post.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INTEREST POLLS */}
      {subTab === 'polls' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Anonymous Campus Interest Polls
              </h2>
              <p className="text-xs text-slate-500">
                Poll results are strictly aggregated. Individual votes are never revealed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreatePollModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Create Community Poll
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {polls.map((poll) => {
              const hasVoted = Boolean(poll.userVotedOptionId);
              return (
                <div
                  key={poll.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      #{poll.topic}
                    </span>
                    <span className="text-xs text-slate-400">
                      {poll.totalVotes} student responses
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {poll.question}
                  </h3>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {poll.options.map((option) => {
                      const pct =
                        poll.totalVotes > 0
                          ? Math.round((option.votes / poll.totalVotes) * 100)
                          : 0;
                      const isUserSelection = poll.userVotedOptionId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onVotePoll(poll.id, option.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                            isUserSelection
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {/* Aggregate progress background bar */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 opacity-15 pointer-events-none transition-all duration-500 ${
                              isUserSelection ? 'bg-indigo-600' : 'bg-slate-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />

                          <div className="relative flex items-center justify-between text-xs z-10">
                            <span className="flex items-center gap-2">
                              {isUserSelection && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              )}
                              <span>{option.text}</span>
                            </span>
                            <span className="font-mono font-bold text-slate-500 dark:text-slate-400 ml-2">
                              {pct}% ({option.votes})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>
                      {hasVoted ? '✓ Your vote was counted anonymously' : 'Click any option to vote'}
                    </span>
                    <span>By {poll.authorAliasName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LIKE-MINDED PEOPLE DISCOVERY & MUTUAL CONSENT */}
      {subTab === 'matches' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-indigo-950 dark:text-indigo-200">
                Privacy-Preserving Mutual Consent Protocol
              </div>
              <p className="text-indigo-900/80 dark:text-indigo-300 leading-relaxed">
                Matches are generated by analyzing your selected interests, learning goals, and anonymous poll preferences. Your real name, USN, and institutional email are NEVER exposed unless both you and your peer click <span className="font-semibold">"Reveal Mutual Identity"</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peerMatches.map((match) => {
              const isRevealed = match.mutualConsentRevealed && match.revealedProfile;

              return (
                <div
                  key={match.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow">
                        {match.peerAliasName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {match.peerAliasName}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          {match.matchScore}% Interest Fit
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isRevealed
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : match.status === 'connected'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : match.status === 'pending_approval'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isRevealed
                        ? 'Identity Revealed'
                        : match.status === 'connected'
                        ? 'Connected Pseudonym'
                        : match.status === 'pending_approval'
                        ? 'Request Pending'
                        : 'Suggested Match'}
                    </span>
                  </div>

                  {/* Explainable Match Reason */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-750 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                      Why this match was suggested:
                    </div>
                    <p className="leading-relaxed font-medium">"{match.matchExplanation}"</p>
                  </div>

                  {/* Shared Interests */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-400">Shared Tracks:</div>
                    <div className="flex flex-wrap gap-1">
                      {match.sharedInterests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Revealed Profile Card (if mutual consent confirmed) */}
                  {isRevealed && match.revealedProfile && (
                    <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <UserCheck className="w-4 h-4" />
                        Verified NCET Student Identity
                      </div>
                      <div className="font-semibold text-sm">
                        {match.revealedProfile.displayName} ({match.revealedProfile.department} · {match.revealedProfile.year})
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                        Institutional Email: {match.revealedProfile.email}
                      </div>
                      <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300 italic pt-1">
                        "{match.revealedProfile.bio}"
                      </p>
                    </div>
                  )}

                  {/* Connection Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                    {match.status === 'unconnected' && (
                      <button
                        type="button"
                        onClick={() => onRequestPeerConnection(match.id)}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Send Pseudonymous Request
                      </button>
                    )}

                    {match.status === 'pending_approval' && (
                      <button
                        type="button"
                        onClick={() => onAcceptPeerConnection(match.id)}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept Connection Request
                      </button>
                    )}

                    {match.status === 'connected' && !isRevealed && (
                      <button
                        type="button"
                        onClick={() => setRevealTargetMatch(match)}
                        className="w-full py-2 px-3 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Mutual Identity Reveal Flow
                      </button>
                    )}

                    {isRevealed && (
                      <div className="w-full text-center py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Connection Active & Verified
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LEARNING & PROJECT GROUPS */}
      {subTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Peer Learning & Project Collaboration Groups
              </h2>
              <p className="text-xs text-slate-500">
                Form study circles, hackathon squads, or open-source research teams with campus peers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Create Learning Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      #{group.topic}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {group.membersCount} / {group.maxMembers} Members
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {group.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {group.description}
                  </p>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Meeting Hub:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[11px]">
                      {group.meetingMode}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {group.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Created by {group.creatorAlias}</span>
                  <button
                    type="button"
                    onClick={() => onToggleGroupMembership(group.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      group.isMember
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {group.isMember ? 'Leave Group' : 'Join Learning Group'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE POST */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Post as {alias.aliasName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePostModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Your real institutional name will not be attached. Content must follow NCET community guidelines.
            </p>

            <form onSubmit={handleCreatePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Category
                </label>
                <select
                  value={newPostTopic}
                  onChange={(e) => setNewPostTopic(e.target.value as CommunityTopic)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {TOPICS.filter((t) => t !== 'All Topics').map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discussion Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seeking teammates for NCET Buildathon or benchmarking quantized models..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content Details
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share your technical questions, project goals, or learning insights..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="React, PyTorch, Hackathon, Bengaluru"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Publish Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE POLL */}
      {showCreatePollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Anonymous Interest Poll
              </h3>
              <button
                type="button"
                onClick={() => setShowCreatePollModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Category
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hackathon Stacks, Bengaluru Meetups"
                  value={newPollTopic}
                  onChange={(e) => setNewPollTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Poll Question
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which web framework should the student council host workshops for?"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Poll Options (at least 2)
                </label>
                {newPollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newPollOptions];
                      updated[idx] = e.target.value;
                      setNewPollOptions(updated);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                ))}
                {newPollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setNewPollOptions([...newPollOptions, `Option ${newPollOptions.length + 1}`])}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    + Add Another Option
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePollModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Launch Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE GROUP */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Peer Learning Group
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru Hackathon Squad 2026"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Focus
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Agents, LeetCode, Robotics"
                  value={newGroupTopic}
                  onChange={(e) => setNewGroupTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Goals
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What will this group learn, build, or practice together?"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Location / Mode
                </label>
                <select
                  value={newGroupMode}
                  onChange={(e) =>
                    setNewGroupMode(
                      e.target.value as 'Campus Innovation Lab' | 'Virtual Room' | 'Library Discussion Hub'
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Campus Innovation Lab">Campus Innovation Lab (Block B)</option>
                  <option value="Library Discussion Hub">Library Discussion Hub</option>
                  <option value="Virtual Room">Virtual Room (Discord / Google Meet)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MUTUAL IDENTITY REVEAL CONFIRMATION */}
      {revealTargetMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Mutual Consent Identity Disclosure
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You are about to reveal your verified institutional student profile to{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {revealTargetMatch.peerAliasName}
                </span>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                What will be shared mutually:
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                <li>Your full name: <span className="font-medium text-slate-800 dark:text-slate-200">{profile.displayName}</span></li>
                <li>Department & Year: <span className="font-medium text-slate-800 dark:text-slate-200">{profile.department} · {profile.year}</span></li>
                <li>Institutional Email: <span className="font-medium text-slate-800 dark:text-slate-200">{profile.institutionalEmail || `${profile.uid}@ncet.ac.in`}</span></li>
              </ul>
            </div>

            <div className="text-[11px] text-slate-400 text-center">
              Both students must approve before either profile is unlocked. You can withdraw connections anytime.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevealTargetMatch(null)}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Keep Anonymous
              </button>
              <button
                type="button"
                onClick={handleConfirmMutualReveal}
                className="flex-1 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              >
                I Agree to Reveal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: REPORT CONTENT */}
      {reportingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Report Community Content
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportingTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Reporting: <span className="font-semibold text-slate-800 dark:text-slate-200">"{reportingTarget.title}"</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for report:
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="Commercial spam / promotional link">Commercial spam / promotional link</option>
                <option value="Harassment or abusive language">Harassment or abusive language</option>
                <option value="Academic dishonesty / sharing exam leaks">Academic dishonesty / sharing exam leaks</option>
                <option value="Doxxing / revealing student personal identity">Doxxing / revealing student personal identity</option>
                <option value="Misleading opportunity information">Misleading opportunity information</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingTarget(null)}
                className="px-4 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReport}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Submit Report to Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDELINES & PRIVACY DRAWER */}
      {showGuidelines && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Shield className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Anonymous Connect Governance & Privacy Notice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuidelines(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                  What "Anonymous" Means at NCET
                </div>
                Your public identity to other peers is strictly pseudonymous. Your student name, roll number, department, and contact details are never attached to public posts or polls.
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">1. Mutual-Consent Connection Flow</h4>
                No peer can see your institutional profile without both parties explicitly agreeing to reveal their identity.
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">2. Community Integrity & Anti-Abuse</h4>
                Commercial spam, harassment, hate speech, or academic malpractice are strictly prohibited. In cases of severe abuse or legal requests, platform administrators may access audit trails.
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">3. Aggregated Polls</h4>
                Interest poll responses are tallied in aggregate percentages to help clubs plan workshops. Individual poll answers are never displayed.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuidelines(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
