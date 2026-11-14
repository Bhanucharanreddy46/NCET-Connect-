import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Vote,
  Sparkles,
  Shield,
  Layers,
  Send,
  Flag,
  Unlock,
  PlusCircle,
  ThumbsUp,
  MessageCircle,
  X,
  RefreshCw,
  UserPlus,
  Compass,
  Lock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import type {
  CircleProfile,
  CircleConnection,
  CircleMessage,
  CommunityPost,
  CommunityPoll,
  LearningGroup,
  CommunityTopic,
  StudentProfile,
  DirectMessage,
} from '../types/ncet';

interface CommunityHubViewProps {
  profile: StudentProfile;
  myCircleProfile: CircleProfile | null;
  circleProfiles: CircleProfile[];
  circleConnections: CircleConnection[];
  circleMessages: CircleMessage[];
  peerMatches: Array<CircleProfile & { matchScore: number; explanation: string }>;
  posts: CommunityPost[];
  polls: CommunityPoll[];
  groups: LearningGroup[];
  directMessages: DirectMessage[];
  onSendConnection: (receiverId: string) => void;
  onAcceptConnection: (connectionId: string) => void;
  onRejectConnection: (connectionId: string) => void;
  onSendCircleMessage: (connectionId: string, message: string) => void;
  onFlagCircleMessage: (messageId: string) => void;
  onCreatePost: (title: string, content: string, topic: CommunityTopic) => void;
  onUpvotePost: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  onCreatePoll: (question: string, options: string[], topic: CommunityTopic) => void;
  onToggleGroup: (groupId: string) => void;
  onReportContent: (targetId: string, targetType: 'post' | 'comment', reason: string) => void;
  onSendDirectMessage: (receiverUid: string, plaintext: string) => Promise<void>;
}

export const CommunityHubView: React.FC<CommunityHubViewProps> = ({
  profile,
  myCircleProfile,
  circleProfiles,
  circleConnections,
  circleMessages,
  peerMatches,
  posts,
  polls,
  groups,
  directMessages,
  onSendConnection,
  onAcceptConnection,
  onRejectConnection,
  onSendCircleMessage,
  onFlagCircleMessage,
  onCreatePost,
  onUpvotePost,
  onAddComment,
  onVotePoll,
  onCreatePoll,
  onToggleGroup,
  onReportContent,
  onSendDirectMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'circles' | 'discussions' | 'polls' | 'chat' | 'groups'>('circles');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTopic, setPostTopic] = useState<CommunityTopic>('AI & ML');

  // Comment state
  const [activePostComments, setActivePostComments] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Anonymous Chat selection
  const [activeChatConnId, setActiveChatConnId] = useState<string | null>(null);
  const [anonChatMsg, setAnonChatMsg] = useState('');

  const myId = myCircleProfile?.id || 'circle-priya-001';
  const acceptedConns = circleConnections.filter((c) => c.status === 'accepted');

  const topics: CommunityTopic[] = [
    'AI & ML',
    'Web Dev',
    'Cybersecurity',
    'Robotics',
    'Design',
    'Startups',
    'Competitive Programming',
    'General Learning',
  ];

  const filteredPosts = posts.filter((p) => {
    if (selectedTopic !== 'All' && p.topic !== selectedTopic) return false;
    return true;
  });

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    onCreatePost(postTitle.trim(), postContent.trim(), postTopic);
    setPostTitle('');
    setPostContent('');
    setNewPostOpen(false);
  };

  const handleCommentSubmit = (postId: string) => {
    if (!commentInput.trim()) return;
    onAddComment(postId, commentInput.trim());
    setCommentInput('');
  };

  const activeChat = circleConnections.find((c) => c.id === activeChatConnId);
  const activePartner = activeChat
    ? circleProfiles.find(
        (p) => p.id === (activeChat.senderId === myId ? activeChat.receiverId : activeChat.senderId)
      )
    : null;
  const activeChatMessages = circleMessages.filter((m) => m.connectionId === activeChatConnId);

  return (
    <div className="space-y-6">
      {/* 6.1 Mascot Header — Nova the AI Campus Guide */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-2xl shadow-lg shadow-purple-950/50">
              🦅
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                  Curiosity • Collaboration • Learning • Discovery
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Campus Community & Circles
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                Meet <strong>Nova</strong>, your AI guide. Share unfiltered ideas, find project teammates,
                and discover peers under protected pseudonyms until mutual identity reveal.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-slate-950/80 p-3 text-center shrink-0">
            <div className="text-[10px] text-slate-400 font-medium">Your Anonymous Handle</div>
            <div className="text-sm font-bold text-purple-300">
              {myCircleProfile?.anonymousName || 'Quantum Badger #482'}
            </div>
            <div className="text-[10px] text-slate-400">Zero Public Real-Name Exposure</div>
          </div>
        </div>

        {/* Community Sub-Navigation */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab('circles')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'circles'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Find Your People ({peerMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'discussions'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Discussions ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'polls'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Vote className="h-3.5 w-3.5" />
            Campus Polls ({polls.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'groups'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Interest Circles ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Active Chats ({acceptedConns.length})
          </button>
        </div>
      </section>

      {/* 6.2 "FIND YOUR PEOPLE" / CAMPUS CIRCLES TAB */}
      {activeTab === 'circles' && (
        <div className="space-y-5">
          {/* Section banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                You don’t have to build everything alone.
              </h2>
              <p className="text-xs text-slate-400">
                Meet students with complementary skills who are building towards the same hackathon, project, or career goals.
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-400">
              5-Factor Match Algorithm Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {peerMatches.map((peer) => (
              <div
                key={peer.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 transition-all hover:border-purple-500/40 hover:bg-slate-900/90"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{peer.anonymousName}</div>
                      <div className="text-[11px] text-slate-400">
                        {peer.department} • {peer.academicYear}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
                      {peer.matchScore}% Synergy
                    </span>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                    🎯 Looking for: {peer.connectionIntent}
                  </div>

                  <p className="mt-2 text-xs text-slate-300 leading-relaxed italic line-clamp-2">
                    "{peer.bio}"
                  </p>

                  <div className="mt-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Skills & Tech
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {peer.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-950 p-2 text-[10px] text-purple-200/90 border border-purple-500/10">
                    💡 <strong>Match Explanation:</strong> {peer.explanation}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onSendConnection(peer.id)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Request Peer Connection
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6.3 DISCUSSIONS FEED TAB */}
      {activeTab === 'discussions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-purple-400" /> Topic:
              </span>
              {['All', 'AI & Machine Learning', 'Web & Cloud Architecture', 'Startups & Product Building'].map(
                (top) => (
                  <button
                    key={top}
                    onClick={() => setSelectedTopic(top)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      selectedTopic === top
                        ? 'bg-purple-600 text-white font-bold'
                        : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {top === 'All' ? 'All Topics' : top.split(' ')[0]}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setNewPostOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              New Anonymous Discussion
            </button>
          </div>

          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const isCommentsOpen = activePostComments === post.id;
              return (
                <div
                  key={post.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-bold">
                          #{post.topic}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          by <strong>{post.authorAliasName}</strong>
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-sm font-bold text-white">{post.title}</h3>
                    </div>
                    <button
                      onClick={() => onReportContent(post.id, 'post', 'Flagged by user')}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Report content"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpvotePost(post.id)}
                        className="flex items-center gap-1 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-slate-300 hover:border-purple-500/40 hover:text-purple-300"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{post.upvotes}</span>
                      </button>

                      <button
                        onClick={() =>
                          setActivePostComments(isCommentsOpen ? null : post.id)
                        }
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{post.comments.length} Comments</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500">{post.createdAt.slice(0, 10)}</span>
                  </div>

                  {/* Comments accordion */}
                  {isCommentsOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {post.comments.length === 0 ? (
                          <div className="text-[11px] text-slate-500 py-1">
                            No comments yet. Be the first to reply!
                          </div>
                        ) : (
                          post.comments.map((c) => (
                            <div key={c.id} className="rounded-lg bg-slate-950 p-2.5 text-xs border border-slate-850">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                <span className="font-semibold text-purple-300">{c.authorAliasName}</span>
                                <span>{c.createdAt.slice(0, 10)}</span>
                              </div>
                              <p className="text-slate-300">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Reply anonymously..."
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleCommentSubmit(post.id)}
                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6.1 ANONYMOUS POLLS TAB */}
      {activeTab === 'polls' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Express learning goals and hackathon interests voluntarily. Results are strictly aggregated.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {polls.map((poll) => (
              <div
                key={poll.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-purple-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Vote className="h-4 w-4" /> #{poll.topic}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {poll.totalVotes} Total Votes
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{poll.question}</h3>

                <div className="space-y-2 pt-1">
                  {poll.options.map((opt) => {
                    const pct =
                      poll.totalVotes > 0
                        ? Math.round((opt.votes / poll.totalVotes) * 100)
                        : 0;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => onVotePoll(poll.id, opt.id)}
                        className="w-full relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 p-3 text-left transition-all hover:border-purple-500/50"
                      >
                        <div
                          className="absolute inset-0 bg-purple-600/20"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative z-10 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">{opt.text}</span>
                          <span className="font-bold text-purple-300 font-mono">
                            {pct}% ({opt.votes})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6.4 CAMPUS CIRCLES TAB */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Interest-based peer learning communities at NCET</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 text-[10px] font-bold">
                      {grp.topic}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {grp.membersCount} Members
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-white">{grp.name}</h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {grp.description}
                  </p>
                  <div className="mt-3 text-[11px] text-slate-400">
                    Mode: <strong>{grp.meetingMode}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onToggleGroup(grp.id)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      grp.isMember
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                        : 'bg-purple-600 text-white hover:bg-purple-500'
                    }`}
                  >
                    {grp.isMember ? 'Joined Circle' : 'Join Circle'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE CHATS & DIRECT MESSAGES TAB */}
      {activeTab === 'chat' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 grid grid-cols-1 md:grid-cols-3 min-h-[460px]">
          {/* Chat List */}
          <div className="border-r border-slate-800 p-3 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Active Connections
            </div>
            {acceptedConns.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">
                No active connections yet. Send connect requests from the "Find Your People" tab!
              </div>
            ) : (
              acceptedConns.map((conn) => {
                const partnerId = conn.senderId === myId ? conn.receiverId : conn.senderId;
                const partner = circleProfiles.find((p) => p.id === partnerId);
                const isSelected = conn.id === activeChatConnId;
                return (
                  <button
                    key={conn.id}
                    onClick={() => setActiveChatConnId(conn.id)}
                    className={`w-full text-left rounded-xl p-3 transition-colors ${
                      isSelected
                        ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">
                      {partner?.anonymousName || 'Peer'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {partner?.connectionIntent}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Active Conversation Thread */}
          <div className="md:col-span-2 flex flex-col justify-between">
            {activeChatConnId && activePartner ? (
              <>
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div>
                    <div className="font-bold text-xs text-white">
                      {activePartner.anonymousName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {activeChat?.identityRevealed
                        ? '✅ Identities Mutually Revealed'
                        : '🔒 Protected Pseudonym'}
                    </div>
                  </div>
                  <span className="text-[10px] rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 font-bold">
                    {activePartner.department}
                  </span>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto max-h-72 flex-1">
                  {activeChatMessages.map((msg) => {
                    const isMe = msg.senderId === myId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`rounded-2xl px-3 py-2 text-xs max-w-sm ${
                            isMe
                              ? 'bg-purple-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          <div>{msg.message}</div>
                        </div>
                        {!isMe && !msg.isFlagged && (
                          <button
                            onClick={() => onFlagCircleMessage(msg.id)}
                            className="text-[9px] text-slate-500 hover:text-rose-400 mt-0.5 flex items-center gap-0.5"
                          >
                            <Flag className="h-2.5 w-2.5" /> Report
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!anonChatMsg.trim()) return;
                    onSendCircleMessage(activeChatConnId, anonChatMsg.trim());
                    setAnonChatMsg('');
                  }}
                  className="p-3 border-t border-slate-800 flex gap-2"
                >
                  <input
                    type="text"
                    value={anonChatMsg}
                    onChange={(e) => setAnonChatMsg(e.target.value)}
                    placeholder="Type an encrypted anonymous message..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 flex items-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 my-auto">
                Select an active conversation on the left to start chatting.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Discussion Modal */}
      {newPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <button
              onClick={() => setNewPostOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-purple-400" />
              Publish Anonymous Topic
            </h2>

            <form onSubmit={handleCreatePostSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Topic Area</label>
                <select
                  value={postTopic}
                  onChange={(e) => setPostTopic(e.target.value as CommunityTopic)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Discussion Title</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Any teammates for SIH 2027 Edge AI track?"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Content / Details</label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share problem statements, tech stack requirements, or questions..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewPostOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
