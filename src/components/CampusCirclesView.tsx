import React, { useState } from 'react';
import {
  Users,
  MessageCircle,
  Shield,
  Sparkles,
  UserCheck,
  Check,
  X,
  Send,
  Flag,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  AlertTriangle,
  UserPlus,
  Compass,
  Code2,
  Calendar,
  CheckCircle2,
  Heart,
  Eye,
  EyeOff,
} from 'lucide-react';
import type {
  CircleProfile,
  CircleConnection,
  CircleMessage,
  ConnectionIntent,
} from '../types/ncet';

interface CampusCirclesViewProps {
  myProfile: CircleProfile | null;
  profiles: CircleProfile[];
  connections: CircleConnection[];
  messages: CircleMessage[];
  peerMatches: Array<CircleProfile & { matchScore: number; explanation: string }>;
  onSendConnection: (receiverId: string) => void;
  onAcceptConnection: (connectionId: string) => void;
  onRejectConnection: (connectionId: string) => void;
  onUnmatchConnection: (connectionId: string) => void;
  onSendMessage: (connectionId: string, message: string) => void;
  onFlagMessage: (messageId: string) => void;
  onUpdateMyProfile: (updates: Partial<CircleProfile>) => void;
}

export const CampusCirclesView: React.FC<CampusCirclesViewProps> = ({
  myProfile,
  profiles,
  connections,
  messages,
  peerMatches,
  onSendConnection,
  onAcceptConnection,
  onRejectConnection,
  onUnmatchConnection,
  onSendMessage,
  onFlagMessage,
  onUpdateMyProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'connections' | 'chat' | 'profile' | 'safety'>('discover');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [intentFilter, setIntentFilter] = useState<string>('All');
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealAgreed, setRevealAgreed] = useState(false);

  // Profile Edit State
  const [bioInput, setBioInput] = useState(myProfile?.bio || '');
  const [intentInput, setIntentInput] = useState<ConnectionIntent>(
    myProfile?.connectionIntent || 'Hackathon teammate'
  );
  const [isActiveToggle, setIsActiveToggle] = useState(myProfile?.isActive ?? true);

  const myId = myProfile?.id || 'circle-priya-001';

  // Sent connection receiver IDs
  const pendingSentSet = new Set(
    connections
      .filter((c) => c.senderId === myId && c.status === 'pending')
      .map((c) => c.receiverId)
  );

  // Accepted connections
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');

  // Pending received requests
  const pendingReceived = connections.filter(
    (c) => c.receiverId === myId && c.status === 'pending'
  );

  // Pending sent requests
  const pendingSent = connections.filter(
    (c) => c.senderId === myId && c.status === 'pending'
  );

  // Selected chat connection
  const activeChatConnection = connections.find((c) => c.id === selectedConnectionId);
  const partnerProfileId = activeChatConnection
    ? activeChatConnection.senderId === myId
      ? activeChatConnection.receiverId
      : activeChatConnection.senderId
    : null;
  const partnerProfile = profiles.find((p) => p.id === partnerProfileId);

  // Active chat messages
  const activeMessages = messages.filter((m) => m.connectionId === selectedConnectionId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedConnectionId) return;
    onSendMessage(selectedConnectionId, chatInput.trim());
    setChatInput('');
  };

  const handleRegenerateName = () => {
    const adjectives = ['Quantum', 'Neural', 'Cyber', 'Silicon', 'Binary', 'Solar', 'Hyper', 'Prism'];
    const nouns = ['Falcon', 'Phoenix', 'Badger', 'Sphinx', 'Panda', 'Eagle', 'Titan', 'Viper'];
    const num = Math.floor(100 + Math.random() * 900);
    const newName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]} #${num}`;
    onUpdateMyProfile({ anonymousName: newName });
  };

  const handleSaveProfile = () => {
    onUpdateMyProfile({
      bio: bioInput,
      connectionIntent: intentInput,
      isActive: isActiveToggle,
    });
  };

  const intents: ConnectionIntent[] = [
    'Hackathon teammate',
    'Project partner',
    'Study group',
    'Volunteer opportunity',
    'Internship preparation',
    'Club collaboration',
    'Mentorship',
    'Open-source contribution',
    'Community project',
  ];

  const filteredMatches = peerMatches.filter((p) => {
    if (intentFilter !== 'All' && p.connectionIntent !== intentFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
              <Shield className="h-3.5 w-3.5" />
              Campus Circles • Zero-Knowledge Anonymous Peer Discovery
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Connect by Interests, Not Identities
            </h1>
            <p className="mt-1 text-xs text-slate-400 max-w-xl">
              Verified NCET students connect for hackathons, study sprints, open-source projects,
              and volunteer teams without exposing institutional emails or names until mutual consent.
            </p>
          </div>

          {/* Current User Alias Card */}
          <div className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-slate-950/80 p-3.5">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
              🎭
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Your Anonymous Alias</div>
              <div className="text-sm font-bold text-white">
                {myProfile?.anonymousName || 'Quantum Badger #482'}
              </div>
              <div className="text-[10px] text-purple-300 font-medium">
                {myProfile?.department} • {myProfile?.connectionIntent}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'discover'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Discover Peers ({peerMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'connections'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            My Connections ({acceptedConnections.length})
            {pendingReceived.length > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-black font-bold">
                {pendingReceived.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Anonymous Chat
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            My Circle Identity
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'safety'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Safety & Disclosure
          </button>
        </div>
      </div>

      {/* TAB 1: DISCOVER PEERS */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          {/* Intent Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1">Looking for:</span>
            <button
              onClick={() => setIntentFilter('All')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                intentFilter === 'All'
                  ? 'bg-purple-600 text-white'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              All Intents
            </button>
            {intents.slice(0, 6).map((intent) => (
              <button
                key={intent}
                onClick={() => setIntentFilter(intent)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  intentFilter === intent
                    ? 'bg-purple-600 text-white'
                    : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                {intent}
              </button>
            ))}
          </div>

          {/* Peers Match Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((peer) => {
              const isPending = pendingSentSet.has(peer.id);
              const isConnected = acceptedConnections.some(
                (c) =>
                  (c.senderId === myId && c.receiverId === peer.id) ||
                  (c.senderId === peer.id && c.receiverId === myId)
              );

              return (
                <div
                  key={peer.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 transition-all hover:border-purple-500/40 hover:bg-slate-900/90"
                >
                  <div>
                    {/* Header: Anonymous Handle + Score Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{peer.anonymousName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {peer.department} • {peer.academicYear}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          peer.matchScore >= 85
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {peer.matchScore}% Match
                      </span>
                    </div>

                    {/* Intent Tag */}
                    <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                      🎯 Seeking: {peer.connectionIntent}
                    </div>

                    {/* Bio */}
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed italic">
                      "{peer.bio}"
                    </p>

                    {/* Skills Chips */}
                    <div className="mt-3">
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Skills
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {peer.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="mt-2 text-[10px] text-slate-400">
                      ⏱ Available: {peer.availability.join(', ')}
                    </div>

                    {/* Transparent Match Explanation */}
                    <div className="mt-3 rounded-lg bg-slate-950 p-2 text-[10px] text-purple-200/90 border border-purple-500/10">
                      ⚡ <strong>Why recommended:</strong> {peer.explanation}
                    </div>
                  </div>

                  {/* Connect Action Button */}
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    {isConnected ? (
                      <button
                        onClick={() => {
                          const conn = connections.find(
                            (c) =>
                              (c.senderId === myId && c.receiverId === peer.id) ||
                              (c.senderId === peer.id && c.receiverId === myId)
                          );
                          if (conn) {
                            setSelectedConnectionId(conn.id);
                            setActiveTab('chat');
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-1.5 text-xs font-bold text-emerald-400 hover:bg-slate-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Connected • Open Chat
                      </button>
                    ) : isPending ? (
                      <button
                        disabled
                        className="w-full rounded-lg bg-slate-800/80 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
                      >
                        Request Sent (Pending)
                      </button>
                    ) : (
                      <button
                        onClick={() => onSendConnection(peer.id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Send Anonymous Connect Request
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MY CONNECTIONS */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          {/* Pending Received */}
          {pendingReceived.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-4 space-y-3">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Pending Connection Requests Received ({pendingReceived.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingReceived.map((req) => {
                  const sender = profiles.find((p) => p.id === req.senderId);
                  return (
                    <div
                      key={req.id}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-white">
                          {sender?.anonymousName || 'Anonymous Peer'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sender?.department} • Seeking {sender?.connectionIntent}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onAcceptConnection(req.id)}
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onRejectConnection(req.id)}
                          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Connections List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Connections ({acceptedConnections.length})
            </h3>
            {acceptedConnections.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
                No active peer connections yet. Explore peers in the "Discover" tab and send requests!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {acceptedConnections.map((conn) => {
                  const partnerId = conn.senderId === myId ? conn.receiverId : conn.senderId;
                  const partner = profiles.find((p) => p.id === partnerId);
                  return (
                    <div
                      key={conn.id}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          {partner?.anonymousName || 'Anonymous Partner'}
                          {conn.identityRevealed && (
                            <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 font-bold">
                              Revealed
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {partner?.department} • {partner?.connectionIntent}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedConnectionId(conn.id);
                            setActiveTab('chat');
                          }}
                          className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Chat
                        </button>
                        <button
                          onClick={() => onUnmatchConnection(conn.id)}
                          className="rounded-lg border border-slate-800 p-1.5 text-slate-500 hover:text-red-400 hover:border-red-500/30"
                          title="Unmatch connection"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Sent */}
          {pendingSent.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-medium text-slate-500">
                Pending Requests Sent by You ({pendingSent.length})
              </h3>
              <div className="space-y-1.5">
                {pendingSent.map((req) => {
                  const partner = profiles.find((p) => p.id === req.receiverId);
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-xs border border-slate-800 text-slate-400"
                    >
                      <span>
                        Invitation sent to <strong>{partner?.anonymousName}</strong> ({partner?.department})
                      </span>
                      <button
                        onClick={() => onUnmatchConnection(req.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANONYMOUS CHAT */}
      {activeTab === 'chat' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 grid grid-cols-1 md:grid-cols-3 min-h-[480px]">
          {/* Left: Chat Connections List */}
          <div className="border-r border-slate-800 p-3 space-y-2">
            <div className="text-xs font-semibold text-slate-400 px-2 py-1">Conversations</div>
            {acceptedConnections.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">
                No active connections yet.
              </div>
            ) : (
              acceptedConnections.map((conn) => {
                const partnerId = conn.senderId === myId ? conn.receiverId : conn.senderId;
                const partner = profiles.find((p) => p.id === partnerId);
                const isSelected = conn.id === selectedConnectionId;
                return (
                  <button
                    key={conn.id}
                    onClick={() => setSelectedConnectionId(conn.id)}
                    className={`w-full text-left rounded-lg p-2.5 transition-colors ${
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

          {/* Right: Message Thread */}
          <div className="md:col-span-2 flex flex-col justify-between">
            {selectedConnectionId && activeChatConnection ? (
              <>
                {/* Header with reveal banner */}
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div>
                    <div className="font-bold text-xs text-white">
                      {partnerProfile?.anonymousName || 'Anonymous Peer'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {activeChatConnection.identityRevealed
                        ? '✅ Identities mutually revealed'
                        : '🔒 Identities hidden (zero real-world exposure)'}
                    </div>
                  </div>

                  {!activeChatConnection.identityRevealed ? (
                    <button
                      onClick={() => setShowRevealModal(true)}
                      className="flex items-center gap-1 rounded bg-purple-600/30 border border-purple-500/40 px-2 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-600/50"
                    >
                      <Unlock className="h-3 w-3" />
                      Request Identity Reveal
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mutually Revealed
                    </span>
                  )}
                </div>

                {/* Messages Feed */}
                <div className="p-4 space-y-3 overflow-y-auto max-h-72 flex-1">
                  {activeMessages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Say hello to {partnerProfile?.anonymousName}! Discuss hackathon ideas, skills, and availability.
                    </div>
                  ) : (
                    activeMessages.map((msg) => {
                      const isMe = msg.senderId === myId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`rounded-xl px-3 py-2 text-xs max-w-sm ${
                              isMe
                                ? 'bg-purple-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none'
                            } ${msg.isFlagged ? 'border border-red-500/40 opacity-70' : ''}`}
                          >
                            <div>{msg.message}</div>
                            {msg.isFlagged && (
                              <div className="text-[9px] text-red-300 mt-1">
                                ⚠️ Flagged for moderation
                              </div>
                            )}
                          </div>
                          {!isMe && !msg.isFlagged && (
                            <button
                              onClick={() => onFlagMessage(msg.id)}
                              className="text-[9px] text-slate-500 hover:text-red-400 mt-0.5 flex items-center gap-0.5"
                            >
                              <Flag className="h-2.5 w-2.5" />
                              Report
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type an anonymous message (never share phone numbers or passwords)..."
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 flex items-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 my-auto">
                Select a conversation on the left to start chatting.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MY CIRCLE IDENTITY */}
      {activeTab === 'profile' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Your Campus Circles Identity</h2>
              <p className="text-xs text-slate-400">
                Customize how your pseudonymous profile appears to peers during matching.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Profile Active:</span>
              <button
                onClick={() => setIsActiveToggle(!isActiveToggle)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isActiveToggle
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isActiveToggle ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Alias Handle & Regenerate */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Pseudonymous Handle</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={myProfile?.anonymousName || ''}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-purple-300"
              />
              <button
                type="button"
                onClick={handleRegenerateName}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          </div>

          {/* Intent */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Primary Collaboration Intent</label>
            <select
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value as ConnectionIntent)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              {intents.map((intent) => (
                <option key={intent} value={intent}>
                  {intent}
                </option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Short Collaboration Pitch (Max 200 characters)
            </label>
            <textarea
              maxLength={200}
              rows={3}
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <div className="text-right text-[10px] text-slate-500">{bioInput.length}/200</div>
          </div>

          {/* Profile Score Bar */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Your Peer Discovery Profile Score</span>
              <span className="font-bold text-emerald-400">{myProfile?.profileScore || 93}/100</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400"
                style={{ width: `${myProfile?.profileScore || 93}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Scored via: 30% Interest Overlap + 25% Skill Complement + 20% Intent Match + 15% Availability Match + 10% Activity Score.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            className="rounded-lg bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500"
          >
            Save Identity Preferences
          </button>
        </div>
      )}

      {/* TAB 5: SAFETY & RULES */}
      {activeTab === 'safety' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4 max-w-2xl text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Shield className="h-4 w-4 text-purple-400" />
            Campus Circles Privacy, Moderation & Trust Guidelines
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-purple-300">1. What Does "Anonymous" Mean?</h4>
            <p>
              Your official NCET student name, roll number, and institutional email (@ncetmail.com)
              are never exposed on public cards or chat headers. Other students see only your
              chosen handle (e.g., <em>Quantum Badger #482</em>), department, academic year, skills,
              and declared intent.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-purple-300">2. Mutual Identity Reveal Workflow</h4>
            <p>
              Real identities are revealed solely through an explicit, 2-step mutual consent
              agreement. If either party declines, identities remain permanently masked.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-purple-300">3. Moderation & Abuse Reporting</h4>
            <p>
              Hate speech, harassment, academic dishonesty, and unauthorized commercial solicitation
              are strictly prohibited. Administrators reserve audit capabilities over flagged
              interactions to protect campus community safety.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-purple-300">4. Community Guidelines</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Never solicit or share passwords or banking credentials.</li>
              <li>Respect fellow student collaborators regardless of branch or year.</li>
              <li>Report any abusive or non-consensual behavior immediately.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Mutual Consent Reveal Modal */}
      {showRevealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Unlock className="h-5 w-5 text-purple-400" />
              Request Mutual Identity Reveal
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Revealing your identity will disclose your verified institutional name and NCET email
              to <strong>{partnerProfile?.anonymousName}</strong>. This only takes effect if both
              of you click agree.
            </p>

            <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={revealAgreed}
                onChange={(e) => setRevealAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500"
              />
              <span>I voluntarily agree to disclose my verified NCET institutional identity.</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRevealModal(false);
                  setRevealAgreed(false);
                }}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!revealAgreed}
                onClick={() => {
                  setShowRevealModal(false);
                  setRevealAgreed(false);
                  alert('Mutual identity reveal request recorded. When both students accept, identities will be unveiled in the header.');
                }}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                  revealAgreed
                    ? 'bg-purple-600 text-white hover:bg-purple-500'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Confirm Mutual Reveal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
