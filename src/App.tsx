import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Compass,
  Fingerprint,
  Lock,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PlusSquare,
  Shield,
  Sun,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AnonymousConnectView } from './components/AnonymousConnectView';
import { MessagingView } from './components/MessagingView';
import { OrganizerPortalView } from './components/OrganizerPortalView';
import { OfflineIndicator, PWAInstallButton } from './components/PWAControls';
import { ProfileAdvisorView } from './components/ProfileAdvisorView';
import { StudentFeedView } from './components/StudentFeedView';
import { TrackerAnalyticsView } from './components/TrackerAnalyticsView';
import { VaultView } from './components/VaultView';
import { useNcetStore } from './hooks/useNcetStore';
import type { UserRole } from './types/ncet';
import { getEnrolledBiometricId, verifyBiometricPasskey } from './utils/biometric';

type NavTab =
  | 'feed'
  | 'tracker'
  | 'anonymous'
  | 'messages'
  | 'vault'
  | 'profile'
  | 'organizer'
  | 'admin';

const TAB_LABELS: Record<NavTab, string> = {
  feed: 'Opportunity Feed',
  tracker: 'Tracker & Analytics',
  anonymous: 'Anonymous Connect',
  messages: 'Recruiter Messages',
  vault: 'Document Vault',
  profile: 'Profile & AI Advisor',
  organizer: 'Organizer Portal',
  admin: 'Admin Insights',
};

export default function App() {
  const store = useNcetStore();
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('ncet_dark_mode') === 'true';
    }
    return false;
  });

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
    else setActiveTab('feed');
  };

  const handleQuickBiometric = async () => {
    const res = await verifyBiometricPasskey();
    store.setBiometricUnlocked(res.verified);
  };

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    section: 'student' | 'portal';
  }> = [
    { id: 'feed', label: 'Opportunity Feed', icon: Compass, section: 'student' },
    { id: 'anonymous', label: 'Anonymous Connect', icon: Users, section: 'student' },
    { id: 'tracker', label: 'Tracker & Analytics', icon: BarChart3, section: 'student' },
    { id: 'messages', label: 'Direct Messages', icon: MessageSquare, section: 'student' },
    { id: 'vault', label: 'Document Vault', icon: Lock, section: 'student' },
    { id: 'profile', label: 'Profile & Advisor', icon: UserCircle, section: 'student' },
    { id: 'organizer', label: 'Organizer Portal', icon: PlusSquare, section: 'portal' },
    { id: 'admin', label: 'Admin Insights', icon: Shield, section: 'portal' },
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
              setActiveTab('feed');
              setMobileMenuOpen(false);
            }}
            className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            NCET CONNECT
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
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 px-1">
            Client Workspace
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['student', 'organizer', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  handleRoleChange(r);
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                  store.role === r
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main navigation" className="space-y-5">
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Student App
            </div>
            {navItems
              .filter((item) => item.section === 'student')
              .map((item) => {
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>

          <div className="space-y-1">
            <div className="px-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Campus Portals
            </div>
            {navItems
              .filter((item) => item.section === 'portal')
              .map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      store.setRole(item.id === 'organizer' ? 'organizer' : 'admin');
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>
        </nav>
      </div>

      {/* Bottom Profile & Auth Summary */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-1">
          {store.profile.avatarUrl ? (
            <img
              src={store.profile.avatarUrl}
              alt={store.profile.displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold">
              PN
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {store.profile.displayName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {store.user ? store.user.email : `${store.profile.department} · ${store.profile.year}`}
            </div>
          </div>
        </div>

        {store.user ? (
          <button
            type="button"
            onClick={() => void store.signOutUser()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Sign Out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void store.signInWithGoogle()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 py-2 text-xs font-semibold text-white transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            Google Sign-In
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div id="top" className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F1F5F9]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar (Clean single-row header) */}
        <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-bold text-slate-900 dark:text-white lg:hidden whitespace-nowrap">
                NCET CONNECT
              </span>
              <span className="hidden lg:inline text-slate-400">NCET CONNECT</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {TAB_LABELS[activeTab]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            {hasBiometric && (
              <button
                type="button"
                onClick={() => void handleQuickBiometric()}
                aria-label="Verify biometric passkey"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  store.biometricUnlocked
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {store.biometricUnlocked ? 'Passkey Verified' : 'Passkey'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={`Notifications (${unreadCount} unread)`}
                aria-expanded={notifOpen}
                className="relative rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Real-Time Alerts & Reminders
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
          <div className="mx-4 sm:mx-6 mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            {store.authError}
          </div>
        )}

        {/* Active View Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'feed' && (
            <StudentFeedView
              profile={store.profile}
              recommendations={store.recommendations}
              allOpportunities={store.opportunities}
              applications={store.applications}
              announcements={store.announcements}
              onSave={(opp) => void store.saveOrApplyOpportunity(opp, 'Saved')}
              onRegister={(opp) => void store.saveOrApplyOpportunity(opp, 'Applied')}
              onShare={(opp) => void store.logEvent(opp.id, 'share', opp.domain)}
              onInspect={(opp) => void store.logEvent(opp.id, 'click', opp.domain)}
              onCheckIn={store.checkInAttendance}
              onToggleInterest={store.toggleInterestInExternal}
            />
          )}

          {activeTab === 'anonymous' && (
            <AnonymousConnectView
              alias={store.alias}
              profile={store.profile}
              posts={store.posts}
              polls={store.polls}
              peerMatches={store.peerMatches}
              groups={store.groups}
              onRegenerateAlias={store.regenerateAlias}
              onCreatePost={store.createCommunityPost}
              onUpvotePost={store.upvoteCommunityPost}
              onAddComment={store.addCommunityComment}
              onVotePoll={store.votePoll}
              onCreatePoll={store.createPoll}
              onRequestPeerConnection={store.requestPeerConnection}
              onAcceptPeerConnection={store.acceptPeerConnection}
              onRevealMutualIdentity={store.revealMutualIdentity}
              onToggleGroupMembership={store.toggleGroupMembership}
              onCreateLearningGroup={store.createLearningGroup}
              onReportContent={store.reportCommunityContent}
            />
          )}

          {activeTab === 'tracker' && (
            <TrackerAnalyticsView
              profile={store.profile}
              applications={store.applications}
              onUpdateStatus={(id, status, interviewAt, notes) =>
                void store.updateApplicationStatus(id, status, interviewAt, notes)
              }
            />
          )}

          {activeTab === 'messages' && (
            <MessagingView
              currentUserId={store.user?.uid ?? store.profile.uid}
              messages={store.messages}
              onSendMessage={store.sendEncryptedMessage}
              onDecryptMessage={store.decryptThreadMessage}
            />
          )}

          {activeTab === 'vault' && (
            <VaultView
              docs={store.vaultDocs}
              onAddDoc={store.addVaultDocument}
              onDecryptDoc={store.decryptVaultDocument}
              onDeleteDoc={(id) => void store.deleteVaultDocument(id)}
            />
          )}

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
              onNavigateToAnonymous={() => setActiveTab('anonymous')}
            />
          )}

          {activeTab === 'organizer' && (
            <OrganizerPortalView
              opportunities={store.opportunities}
              attendanceRecords={store.attendanceRecords}
              onCreateOpportunity={(draft) => store.createOpportunity(draft, 'published')}
              onOrganizerMarkAttendance={store.organizerMarkAttendance}
              onPostAnnouncement={store.postAnnouncement}
            />
          )}

          {activeTab === 'admin' && (
            <AdminDashboardView
              opportunities={store.opportunities}
              applications={store.applications}
              events={store.events}
              profile={store.profile}
              attendanceRecords={store.attendanceRecords}
              reports={store.reports}
              announcements={store.announcements}
              onModerate={store.moderateOpportunity}
              onCreateIngested={store.createOpportunity}
              onResolveReport={store.resolveReport}
              onPostAnnouncement={store.postAnnouncement}
            />
          )}
        </main>
      </div>

      <OfflineIndicator />
    </div>
  );
}
