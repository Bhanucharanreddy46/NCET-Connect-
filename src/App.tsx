import React, { useEffect, useState } from 'react';
import {
  Compass,
  Fingerprint,
  Home,
  LogOut,
  Menu,
  Moon,
  PlusSquare,
  Shield,
  Sparkles,
  Sun,
  UserCircle,
  Users,
  X,
  Briefcase,
  Layers,
  Bell,
  Search,
} from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthView } from './components/AuthView';
import { CommunityHubView } from './components/CommunityHubView';
import { ExploreUnifiedView, type ExploreCategory } from './components/ExploreUnifiedView';
import { HomeDiscoveryView } from './components/HomeDiscoveryView';
import { JourneyView } from './components/JourneyView';
import { OnboardingModal } from './components/OnboardingModal';
import { OrganizerPortalView } from './components/OrganizerPortalView';
import { OfflineIndicator, PWAInstallButton } from './components/PWAControls';
import { ProfileAdvisorView } from './components/ProfileAdvisorView';
import { useNcetStore } from './hooks/useNcetStore';
import type { UserRole } from './types/ncet';
import { getEnrolledBiometricId, verifyBiometricPasskey } from './utils/biometric';

export type NavTab =
  | 'home'
  | 'explore'
  | 'community'
  | 'journey'
  | 'profile'
  | 'organizer'
  | 'admin';

const TAB_LABELS: Record<NavTab, string> = {
  home: 'Home & Highlights',
  explore: 'Explore Opportunities',
  community: 'Campus Community',
  journey: 'My Journey & Passport',
  profile: 'Student Profile & Badges',
  organizer: 'Organizer Desk',
  admin: 'Admin Console',
};

export default function App() {
  const store = useNcetStore();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [exploreCategory, setExploreCategory] = useState<ExploreCategory>('Opportunities');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('ncet_dark_mode') === 'true';
    }
    return false;
  });

  // Check if onboarding completed once
  useEffect(() => {
    try {
      const completed = localStorage.getItem('ncet_onboarding_completed');
      if (!completed && store.role === 'student') {
        // Optional gentle prompt
      }
    } catch {
      // ignore
    }
  }, [store.role]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('ncet_dark_mode', String(darkMode));
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  const unreadCount = store.notifications.filter((n) => !n.read).length;
  const hasBiometric = Boolean(getEnrolledBiometricId());

  const handleRoleChange = (nextRole: UserRole) => {
    store.setRole(nextRole);
    if (nextRole === 'organizer') setActiveTab('organizer');
    else if (nextRole === 'admin') setActiveTab('admin');
    else setActiveTab('home');
  };

  const handleQuickBiometric = async () => {
    const res = await verifyBiometricPasskey();
    store.setBiometricUnlocked(res.verified);
  };

  const handleNavigateTab = (tab: string, subCategory?: string) => {
    if (
      tab === 'home' ||
      tab === 'explore' ||
      tab === 'community' ||
      tab === 'journey' ||
      tab === 'profile' ||
      tab === 'organizer' ||
      tab === 'admin'
    ) {
      setActiveTab(tab as NavTab);
    }
    if (subCategory) {
      const validCategories: ExploreCategory[] = [
        'Opportunities',
        'Events',
        'People',
        'Communities',
        'Projects',
        'Learning',
      ];
      if (validCategories.includes(subCategory as ExploreCategory)) {
        setExploreCategory(subCategory as ExploreCategory);
      }
    }
  };

  const studentNavItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'community', label: 'Community', icon: Users, badgeCount: store.polls.length },
    { id: 'journey', label: 'My Journey', icon: Briefcase, badgeCount: store.opportunityApplications.length },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  const portalNavItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredRole: UserRole;
  }> = [
    { id: 'organizer', label: 'Organizer Portal', icon: PlusSquare, requiredRole: 'organizer' },
    { id: 'admin', label: 'Admin Console', icon: Shield, requiredRole: 'admin' },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Brand Mark */}
        <div className="px-2 pt-1 flex items-center justify-between">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 text-lg font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>NCET CONNECT</span>
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Workspace Role Switcher */}
        <div className="px-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 px-1">
            <span>Active Perspective</span>
            <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-semibold">
              {store.role}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
            {(['student', 'organizer', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  handleRoleChange(r);
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${
                  store.role === r
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Item Goal-Based Navigation */}
        <nav aria-label="Main student navigation" className="space-y-6">
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Student Space
            </div>
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    store.setRole('student');
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 translate-x-1'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {Boolean(item.badgeCount && item.badgeCount > 0) && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Management Portals
            </div>
            {portalNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    store.setRole(item.requiredRole);
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 translate-x-1'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Bottom Profile & Verified Auth Card */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div
          onClick={() => {
            setActiveTab('profile');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
        >
          {store.profile.avatarUrl ? (
            <img
              src={store.profile.avatarUrl}
              alt={store.profile.displayName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shrink-0 ring-2 ring-blue-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/30">
              {store.profile.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              <span>{store.profile.displayName}</span>
              {Boolean(store.authUser?.isVerified || store.profile.institutionalEmail) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Verified NCET Student" />
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {store.authUser ? store.authUser.email : `${store.profile.department} · ${store.profile.year}`}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => store.setLoginModalOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
          >
            <Shield className="w-3.5 h-3.5" />
            {store.authUser ? 'Switch Verified Account' : 'Sign In with @ncetmail.com'}
          </button>

          {store.authUser && (
            <button
              type="button"
              onClick={store.logout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sign Out ({store.authUser.role})
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div id="top" className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F1F5F9]">
      {/* Desktop Sidebar (Persistent left pane) */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen overflow-y-auto">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-6">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 lg:hidden whitespace-nowrap">
                NCET CONNECT
              </span>
              <span className="hidden lg:inline text-slate-400 font-medium">NCET Connect</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {TAB_LABELS[activeTab]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Onboarding Button */}
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Customize Profile</span>
            </button>

            <PWAInstallButton />

            {hasBiometric && (
              <button
                type="button"
                onClick={() => void handleQuickBiometric()}
                aria-label="Verify biometric passkey"
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  store.biometricUnlocked
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {store.biometricUnlocked ? 'Passkey Ready' : 'Passkey'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Tray */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={`Notifications (${unreadCount} unread)`}
                aria-expanded={notifOpen}
                className="relative rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Campus Alerts & Reminders
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {store.notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 space-y-1 ${
                          n.read ? 'opacity-70' : 'bg-blue-50/40 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </span>
                          {!n.read && (
                            <button
                              type="button"
                              onClick={() => void store.markNotificationRead(n.id)}
                              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{n.body}</p>
                        <div className="text-[10px] font-mono text-slate-400">
                          Channel: {n.channel} · {n.createdAt.slice(0, 10)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {store.authError && (
          <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <span>{store.authError}</span>
          </div>
        )}

        {/* Dynamic Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* 1. HOME: Personalized Discovery Homepage */}
          {activeTab === 'home' && (
            <HomeDiscoveryView
              profile={store.profile}
              recommendedOpportunities={store.getRecommendedOpportunities()}
              allOpportunities={store.opportunities}
              communityPosts={store.posts}
              communityPolls={store.polls}
              peerMatches={store.getPeerMatches()}
              savedOpportunities={store.savedOpportunities}
              applications={store.opportunityApplications}
              onNavigateTab={handleNavigateTab}
              onApply={(id) => store.applyToOpportunity(id)}
              onToggleSave={(id) => store.toggleSaveOpportunity(id)}
              onVotePoll={(pollId, optionId) => store.votePoll(pollId, optionId)}
              onOpenOnboarding={() => setOnboardingOpen(true)}
            />
          )}

          {/* 2. EXPLORE: Central 6-Category Discovery Engine */}
          {activeTab === 'explore' && (
            <ExploreUnifiedView
              initialCategory={exploreCategory}
              opportunities={store.opportunities}
              recommendedOpportunities={store.getRecommendedOpportunities()}
              savedOpportunities={store.savedOpportunities}
              applications={store.opportunityApplications}
              peerMatches={store.getPeerMatches()}
              learningGroups={store.groups}
              profile={store.profile}
              onApply={(id) => store.applyToOpportunity(id)}
              onToggleSave={(id) => store.toggleSaveOpportunity(id)}
              onConnectPeer={(peerId) => store.sendCircleConnectionRequest(peerId)}
              onJoinGroup={(groupId) => store.toggleGroupMembership(groupId)}
              onNavigateToCommunity={() => setActiveTab('community')}
            />
          )}

          {/* 3. COMMUNITY: Nova Mascot, Discussions, Polls, Campus Circles & Chat */}
          {activeTab === 'community' && (
            <CommunityHubView
              profile={store.profile}
              myCircleProfile={store.myCircleProfile}
              circleProfiles={store.circleProfiles}
              circleConnections={store.circleConnections}
              circleMessages={store.circleMessages}
              peerMatches={store.getPeerMatches()}
              posts={store.posts}
              polls={store.polls}
              groups={store.groups}
              directMessages={store.messages}
              onSendConnection={(receiverId) => store.sendCircleConnectionRequest(receiverId)}
              onAcceptConnection={(connId) => store.acceptCircleConnection(connId)}
              onRejectConnection={(connId) => store.rejectCircleConnection(connId)}
              onSendCircleMessage={(connId, text) => store.sendCircleMessage(connId, text)}
              onFlagCircleMessage={(msgId) => store.flagCircleMessage(msgId)}
              onCreatePost={(title, content, topic) =>
                store.createCommunityPost(topic, title, content, [topic])
              }
              onUpvotePost={(postId) => store.upvoteCommunityPost(postId)}
              onAddComment={(postId, comment) => store.addCommunityComment(postId, comment)}
              onVotePoll={(pollId, optionId) => store.votePoll(pollId, optionId)}
              onCreatePoll={(question, options, topic) =>
                store.createPoll(topic, question, options)
              }
              onToggleGroup={(groupId) => store.toggleGroupMembership(groupId)}
              onReportContent={(targetId, type, reason) =>
                store.reportCommunityContent(type, targetId, 'Community Content', reason)
              }
              onSendDirectMessage={async (receiverUid, plaintext) => {
                await store.sendEncryptedMessage(receiverUid, receiverUid, plaintext);
              }}
            />
          )}

          {/* 4. MY JOURNEY: Applications Tracker, Saved Items, Attendance Passport, Encrypted Safe */}
          {activeTab === 'journey' && (
            <JourneyView
              applications={store.opportunityApplications}
              savedOpportunities={store.savedOpportunities}
              allOpportunities={store.opportunities}
              attendanceRecords={store.attendanceRecords}
              vaultDocs={store.vaultDocs}
              recognitions={store.recognitions}
              leaderboard={store.getLeaderboard()}
              currentStudentId={store.profile.uid}
              biometricUnlocked={store.biometricUnlocked}
              onUnlockBiometric={store.setBiometricUnlocked}
              onWithdrawApplication={(appId) => store.withdrawApplication(appId)}
              onApplyOpportunity={(oppId) => store.applyToOpportunity(oppId)}
              onToggleSave={(oppId) => store.toggleSaveOpportunity(oppId)}
              onCheckInAttendance={(passcode) => {
                for (const opp of store.opportunities) {
                  const res = store.checkInAttendance(opp.id, passcode);
                  if (res.success) return res;
                }
                return {
                  success: false,
                  message: 'Invalid check-in passcode. Please verify with the event organizer registration desk.',
                };
              }}
              onAddVaultDoc={(title, docType, rawContent) =>
                store.addVaultDocument(title, docType, rawContent)
              }
              onDeleteVaultDoc={(id) => store.deleteVaultDocument(id)}
              onDecryptVaultDoc={(doc) => store.decryptVaultDocument(doc)}
            />
          )}

          {/* 5. PROFILE: Credentials, Skills, Badges, Advisor */}
          {activeTab === 'profile' && (
            <ProfileAdvisorView
              profile={store.profile}
              opportunities={store.opportunities}
              applications={store.applications}
              alias={store.alias}
              badges={store.badges}
              attendanceRecords={store.attendanceRecords}
              onSaveProfile={store.updateProfile}
              onUnlockBiometric={store.setBiometricUnlocked}
              onTriggerNotification={(title, body, channel) =>
                store.addNotification(title, body, channel)
              }
              onNavigateToAnonymous={() => setActiveTab('community')}
            />
          )}

          {/* ORGANIZER PORTAL */}
          {activeTab === 'organizer' && (
            <OrganizerPortalView
              opportunities={store.opportunities}
              attendanceRecords={store.attendanceRecords}
              onCreateOpportunity={(draft) => store.createOpportunity(draft, 'published')}
              onOrganizerMarkAttendance={store.organizerMarkAttendance}
              onPostAnnouncement={store.postAnnouncement}
            />
          )}

          {/* ADMIN CONSOLE */}
          {activeTab === 'admin' && (
            <AdminDashboardView
              opportunities={store.opportunities}
              applications={store.applications}
              events={store.events}
              profile={store.profile}
              attendanceRecords={store.attendanceRecords}
              reports={store.reports}
              announcements={store.announcements}
              opportunityApplications={store.opportunityApplications}
              onUpdateApplicationStatus={store.updateOpportunityApplicationStatus}
              externalEventImports={store.externalEventImports}
              onReviewExternalEvent={store.reviewExternalEvent}
              onSubmitExternalEvent={store.submitExternalEventImport}
              recognitions={store.recognitions}
              onAwardRecognition={store.awardRecognition}
              volunteerOptins={store.volunteerOptins}
              onModerate={store.moderateOpportunity}
              onCreateIngested={store.createOpportunity}
              onResolveReport={store.resolveReport}
              onPostAnnouncement={store.postAnnouncement}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb Access to 5 Student Spaces) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                store.setRole('student');
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                active
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {Boolean(item.badgeCount && item.badgeCount > 0) && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 4-Step Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        profile={store.profile}
        onClose={() => setOnboardingOpen(false)}
        onSave={(updates) => {
          store.updateProfile({ ...store.profile, ...updates });
          setOnboardingOpen(false);
          store.addNotification(
            'Personalized Feed Updated',
            'Your career preferences, technical skills, and semester goals have been saved to NCET Connect.',
            'in_app'
          );
        }}
      />

      {/* Official NCET Mail Verification & Login Modal */}
      <AuthView
        isOpen={store.loginModalOpen}
        onClose={() => store.setLoginModalOpen(false)}
        onLogin={store.login}
        currentEmail={store.authUser?.email}
      />

      <OfflineIndicator />
    </div>
  );
}
