import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  CONTACT_THREADS,
  DEFAULT_COMMUNITY_ALIAS,
  DEFAULT_STUDENT_PROFILE,
  SEED_ANNOUNCEMENTS,
  SEED_APPLICATIONS,
  SEED_ATTENDANCE_RECORDS,
  SEED_COMMUNITY_POLLS,
  SEED_COMMUNITY_POSTS,
  SEED_COMMUNITY_REPORTS,
  SEED_EVENTS,
  SEED_LEARNING_GROUPS,
  SEED_NOTIFICATIONS,
  SEED_OPPORTUNITIES,
  SEED_PEER_MATCHES,
  SEED_RECOGNITION_BADGES,
  DEFAULT_AUTH_USER,
  SEED_AUTH_USERS,
  SEED_CIRCLE_PROFILES,
  SEED_CIRCLE_CONNECTIONS,
  SEED_CIRCLE_MESSAGES,
  SEED_OPPORTUNITY_APPLICATIONS,
  SEED_SAVED_OPPS,
  SEED_RECOGNITIONS,
  SEED_EXTERNAL_EVENTS,
  SEED_VOLUNTEER_OPTINS,
} from '../data/seedData';
import type {
  ApplicationRecord,
  ApplicationStatus,
  AttendanceRecord,
  CampusAnnouncement,
  CommunityAlias,
  CommunityComment,
  CommunityPoll,
  CommunityPost,
  CommunityReport,
  CommunityTopic,
  DirectMessage,
  EncryptedVaultDoc,
  EngagementEvent,
  LearningGroup,
  NotificationItem,
  Opportunity,
  PeerMatch,
  StudentProfile,
  StudentRecognitionBadge,
  UserRole,
  AuthUser,
  CircleProfile,
  CircleConnection,
  CircleMessage,
  OpportunityApplication,
  OpportunityApplicationStatus,
  SavedOpportunity,
  Recognition,
  RecognitionType,
  LeaderboardEntry,
  EventSource,
  ExternalEventImport,
  VolunteerOptin,
  FeedbackAction,
  OpportunityFeedback,
  ConnectionIntent,
} from '../types/ncet';
import { decryptPayload, encryptPayload } from '../utils/crypto';
import { rankRecommendations } from '../utils/recommender';

const CACHE_KEY = 'ncet_connect_offline_state_v3';

interface CachedState {
  profile: StudentProfile;
  opportunities: Opportunity[];
  applications: ApplicationRecord[];
  events: EngagementEvent[];
  notifications: NotificationItem[];
  messages: DirectMessage[];
  vaultDocs: EncryptedVaultDoc[];
  alias?: CommunityAlias;
  posts?: CommunityPost[];
  polls?: CommunityPoll[];
  peerMatches?: PeerMatch[];
  groups?: LearningGroup[];
  announcements?: CampusAnnouncement[];
  badges?: StudentRecognitionBadge[];
  attendanceRecords?: AttendanceRecord[];
  reports?: CommunityReport[];
  authUser?: AuthUser | null;
  circleProfiles?: CircleProfile[];
  circleConnections?: CircleConnection[];
  circleMessages?: CircleMessage[];
  myCircleProfile?: CircleProfile | null;
  opportunityApplications?: OpportunityApplication[];
  savedOpportunities?: SavedOpportunity[];
  recognitions?: Recognition[];
  externalEventImports?: ExternalEventImport[];
  volunteerOptins?: VolunteerOptin[];
  opportunityFeedback?: OpportunityFeedback[];
}

function loadCachedState(): CachedState {
  const fallback: CachedState = {
    profile: DEFAULT_STUDENT_PROFILE,
    opportunities: SEED_OPPORTUNITIES,
    applications: SEED_APPLICATIONS,
    events: SEED_EVENTS,
    notifications: SEED_NOTIFICATIONS,
    messages: [],
    vaultDocs: [],
    alias: DEFAULT_COMMUNITY_ALIAS,
    posts: SEED_COMMUNITY_POSTS,
    polls: SEED_COMMUNITY_POLLS,
    peerMatches: SEED_PEER_MATCHES,
    groups: SEED_LEARNING_GROUPS,
    announcements: SEED_ANNOUNCEMENTS,
    badges: SEED_RECOGNITION_BADGES,
    attendanceRecords: SEED_ATTENDANCE_RECORDS,
    reports: SEED_COMMUNITY_REPORTS,
    authUser: DEFAULT_AUTH_USER,
    circleProfiles: SEED_CIRCLE_PROFILES,
    circleConnections: SEED_CIRCLE_CONNECTIONS,
    circleMessages: SEED_CIRCLE_MESSAGES,
    myCircleProfile: SEED_CIRCLE_PROFILES[0],
    opportunityApplications: SEED_OPPORTUNITY_APPLICATIONS,
    savedOpportunities: SEED_SAVED_OPPS,
    recognitions: SEED_RECOGNITIONS,
    externalEventImports: SEED_EXTERNAL_EVENTS,
    volunteerOptins: SEED_VOLUNTEER_OPTINS,
    opportunityFeedback: [],
  };

  if (typeof localStorage === 'undefined') {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CachedState>;
      return {
        profile: parsed.profile ?? fallback.profile,
        opportunities:
          parsed.opportunities && parsed.opportunities.length > 0
            ? parsed.opportunities
            : fallback.opportunities,
        applications: parsed.applications ?? fallback.applications,
        events: parsed.events ?? fallback.events,
        notifications: parsed.notifications ?? fallback.notifications,
        messages: parsed.messages ?? [],
        vaultDocs: parsed.vaultDocs ?? [],
        alias: parsed.alias ?? fallback.alias,
        posts: parsed.posts && parsed.posts.length > 0 ? parsed.posts : fallback.posts,
        polls: parsed.polls && parsed.polls.length > 0 ? parsed.polls : fallback.polls,
        peerMatches: parsed.peerMatches && parsed.peerMatches.length > 0 ? parsed.peerMatches : fallback.peerMatches,
        groups: parsed.groups && parsed.groups.length > 0 ? parsed.groups : fallback.groups,
        announcements: parsed.announcements && parsed.announcements.length > 0 ? parsed.announcements : fallback.announcements,
        badges: parsed.badges && parsed.badges.length > 0 ? parsed.badges : fallback.badges,
        attendanceRecords: parsed.attendanceRecords && parsed.attendanceRecords.length > 0 ? parsed.attendanceRecords : fallback.attendanceRecords,
        reports: parsed.reports && parsed.reports.length > 0 ? parsed.reports : fallback.reports,
        authUser: parsed.authUser !== undefined ? parsed.authUser : fallback.authUser,
        circleProfiles: parsed.circleProfiles && parsed.circleProfiles.length > 0 ? parsed.circleProfiles : fallback.circleProfiles,
        circleConnections: parsed.circleConnections && parsed.circleConnections.length > 0 ? parsed.circleConnections : fallback.circleConnections,
        circleMessages: parsed.circleMessages && parsed.circleMessages.length > 0 ? parsed.circleMessages : fallback.circleMessages,
        myCircleProfile: parsed.myCircleProfile ?? fallback.myCircleProfile,
        opportunityApplications: parsed.opportunityApplications && parsed.opportunityApplications.length > 0 ? parsed.opportunityApplications : fallback.opportunityApplications,
        savedOpportunities: parsed.savedOpportunities && parsed.savedOpportunities.length > 0 ? parsed.savedOpportunities : fallback.savedOpportunities,
        recognitions: parsed.recognitions && parsed.recognitions.length > 0 ? parsed.recognitions : fallback.recognitions,
        externalEventImports: parsed.externalEventImports && parsed.externalEventImports.length > 0 ? parsed.externalEventImports : fallback.externalEventImports,
        volunteerOptins: parsed.volunteerOptins && parsed.volunteerOptins.length > 0 ? parsed.volunteerOptins : fallback.volunteerOptins,
        opportunityFeedback: parsed.opportunityFeedback ?? [],
      };
    }
  } catch {
    // Fallback to clean seed
  }
  return fallback;
}

export function useNcetStore() {
  const initial = useMemo(() => loadCachedState(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [profile, setProfile] = useState<StudentProfile>(initial.profile);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initial.opportunities);
  const [applications, setApplications] = useState<ApplicationRecord[]>(initial.applications);
  const [events, setEvents] = useState<EngagementEvent[]>(initial.events);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initial.notifications);
  const [messages, setMessages] = useState<DirectMessage[]>(initial.messages);
  const [vaultDocs, setVaultDocs] = useState<EncryptedVaultDoc[]>(initial.vaultDocs);
  const [authError, setAuthError] = useState<string | null>(null);
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);
  const [alias, setAlias] = useState<CommunityAlias>(initial.alias ?? DEFAULT_COMMUNITY_ALIAS);
  const [posts, setPosts] = useState<CommunityPost[]>(initial.posts ?? SEED_COMMUNITY_POSTS);
  const [polls, setPolls] = useState<CommunityPoll[]>(initial.polls ?? SEED_COMMUNITY_POLLS);
  const [peerMatches, setPeerMatches] = useState<PeerMatch[]>(initial.peerMatches ?? SEED_PEER_MATCHES);
  const [groups, setGroups] = useState<LearningGroup[]>(initial.groups ?? SEED_LEARNING_GROUPS);
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>(initial.announcements ?? SEED_ANNOUNCEMENTS);
  const [badges, setBadges] = useState<StudentRecognitionBadge[]>(initial.badges ?? SEED_RECOGNITION_BADGES);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initial.attendanceRecords ?? SEED_ATTENDANCE_RECORDS);
  const [reports, setReports] = useState<CommunityReport[]>(initial.reports ?? SEED_COMMUNITY_REPORTS);

  // New modules state
  const [authUser, setAuthUser] = useState<AuthUser | null>(initial.authUser ?? DEFAULT_AUTH_USER);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [circleProfiles, setCircleProfiles] = useState<CircleProfile[]>(initial.circleProfiles ?? SEED_CIRCLE_PROFILES);
  const [circleConnections, setCircleConnections] = useState<CircleConnection[]>(initial.circleConnections ?? SEED_CIRCLE_CONNECTIONS);
  const [circleMessages, setCircleMessages] = useState<CircleMessage[]>(initial.circleMessages ?? SEED_CIRCLE_MESSAGES);
  const [myCircleProfile, setMyCircleProfile] = useState<CircleProfile | null>(initial.myCircleProfile ?? SEED_CIRCLE_PROFILES[0]);
  const [opportunityApplications, setOpportunityApplications] = useState<OpportunityApplication[]>(initial.opportunityApplications ?? SEED_OPPORTUNITY_APPLICATIONS);
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>(initial.savedOpportunities ?? SEED_SAVED_OPPS);
  const [recognitions, setRecognitions] = useState<Recognition[]>(initial.recognitions ?? SEED_RECOGNITIONS);
  const [externalEventImports, setExternalEventImports] = useState<ExternalEventImport[]>(initial.externalEventImports ?? SEED_EXTERNAL_EVENTS);
  const [volunteerOptins, setVolunteerOptins] = useState<VolunteerOptin[]>(initial.volunteerOptins ?? SEED_VOLUNTEER_OPTINS);
  const [opportunityFeedback, setOpportunityFeedback] = useState<OpportunityFeedback[]>(initial.opportunityFeedback ?? []);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [opportunityTypeFilter, setOpportunityTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');

  // Persist offline cache for PWA / multi-device continuity
  useEffect(() => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          profile,
          opportunities,
          applications,
          events,
          notifications,
          messages,
          vaultDocs,
          alias,
          posts,
          polls,
          peerMatches,
          groups,
          announcements,
          badges,
          attendanceRecords,
          reports,
          authUser,
          circleProfiles,
          circleConnections,
          circleMessages,
          myCircleProfile,
          opportunityApplications,
          savedOpportunities,
          recognitions,
          externalEventImports,
          volunteerOptins,
          opportunityFeedback,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    profile,
    opportunities,
    applications,
    events,
    notifications,
    messages,
    vaultDocs,
    alias,
    posts,
    polls,
    peerMatches,
    groups,
    announcements,
    badges,
    attendanceRecords,
    reports,
  ]);

  // Seed encrypted starter message & vault doc once if empty
  useEffect(() => {
    let active = true;
    async function seedEncryptedSamples() {
      if (initial.messages.length === 0) {
        const seedThread = CONTACT_THREADS[0];
        const msg1 = await encryptPayload(
          'Hi Priya, we reviewed your ReactJS + TypeScript GitHub portfolio. Would Tuesday 11:00 AM work for your Atlassian SDE Intern screen?',
          `ncet-e2ee-${seedThread.threadId}`
        );
        if (active) {
          setMessages([
            {
              id: 'msg-seed-1',
              threadId: seedThread.threadId,
              senderId: seedThread.peerId,
              recipientId: DEFAULT_STUDENT_PROFILE.uid,
              senderName: seedThread.peerName,
              ciphertext: msg1.ciphertext,
              iv: msg1.iv,
              algorithm: msg1.algorithm,
              plaintextPreview:
                'Hi Priya, we reviewed your ReactJS + TypeScript GitHub portfolio. Would Tuesday 11:00 AM work for your Atlassian SDE Intern screen?',
              createdAt: '2026-11-12T10:15:00Z',
            },
          ]);
        }
      }
      if (initial.vaultDocs.length === 0) {
        const resumeEnc = await encryptPayload(
          'PRIYA NAIR | B.E. CSE (NCET) | CGPA 9.18 | Skills: ReactJS, TypeScript, Node.js, Python, PostgreSQL',
          `ncet-vault-${DEFAULT_STUDENT_PROFILE.uid}`
        );
        if (active) {
          setVaultDocs([
            {
              id: 'vault-seed-1',
              ownerId: DEFAULT_STUDENT_PROFILE.uid,
              title: 'Priya_Nair_CSE_Resume_2026.txt',
              docType: 'Resume',
              ciphertext: resumeEnc.ciphertext,
              iv: resumeEnc.iv,
              sizeBytes: 1842,
              createdAt: '2026-11-10T09:00:00Z',
            },
          ]);
        }
      }
    }
    void seedEncryptedSamples();
    return () => {
      active = false;
    };
  }, [initial.messages.length, initial.vaultDocs.length]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        setProfile((prev) => ({
          ...prev,
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || prev.displayName,
          avatarUrl: firebaseUser.photoURL || prev.avatarUrl,
        }));
      }
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners (only when authenticated)
  useEffect(() => {
    if (!authReady || !user) return;

    const uid = user.uid;

    // Ensure user private account doc & public profile exist
    const ensureProfileDocs = async () => {
      try {
        await setDoc(
          doc(db, 'users', uid),
          {
            uid,
            email: user.email || 'student@ncet.edu',
            role: role === 'admin' ? 'student' : role,
            biometricEnabled: biometricUnlocked,
            emailDigestEnabled: true,
            pushRemindersEnabled: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // Ignore merge errors on existing immutable createdAt
      }
    };
    void ensureProfileDocs();

    const oppQuery = query(
      collection(db, 'opportunities'),
      where('status', '==', 'published')
    );
    const unsubOpps = onSnapshot(
      oppQuery,
      (snap) => {
        if (!snap.empty) {
          const remote = snap.docs.map((d) => d.data() as Opportunity);
          setOpportunities((prev) => {
            const byId = new Map(prev.map((o) => [o.id, o]));
            for (const r of remote) byId.set(r.id, r);
            return Array.from(byId.values());
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'opportunities')
    );

    const appQuery = query(
      collection(db, 'applications'),
      where('studentId', '==', uid)
    );
    const unsubApps = onSnapshot(
      appQuery,
      (snap) => {
        if (!snap.empty) {
          const remoteApps = snap.docs.map((d) => d.data() as ApplicationRecord);
          setApplications((prev) => {
            const byId = new Map(prev.map((a) => [a.id, a]));
            for (const r of remoteApps) byId.set(r.id, r);
            return Array.from(byId.values());
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
    );

    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', uid)
    );
    const unsubNotifs = onSnapshot(
      notifQuery,
      (snap) => {
        if (!snap.empty) {
          const remoteNotifs = snap.docs.map((d) => d.data() as NotificationItem);
          setNotifications((prev) => {
            const byId = new Map(prev.map((n) => [n.id, n]));
            for (const n of remoteNotifs) byId.set(n.id, n);
            return Array.from(byId.values());
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    return () => {
      unsubOpps();
      unsubApps();
      unsubNotifs();
    };
  }, [authReady, user, role, biometricUnlocked]);

  const activeUid = user?.uid ?? profile.uid;

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in was cancelled.');
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setBiometricUnlocked(false);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to sign out.');
    }
  }, []);

  const logEvent = useCallback(
    async (opportunityId: string, eventType: EngagementEvent['eventType'], domain: string) => {
      const id = `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const ev: EngagementEvent = {
        id,
        userId: activeUid,
        opportunityId,
        eventType,
        domain,
        createdAt: new Date().toISOString(),
      };
      setEvents((prev) => [ev, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'engagementEvents', id), {
            ...ev,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `engagementEvents/${id}`);
        }
      }
    },
    [activeUid, user]
  );

  const addNotification = useCallback(
    async (title: string, body: string, channel: NotificationItem['channel'] = 'in_app') => {
      const id = `notif-${Date.now().toString(36)}`;
      const item: NotificationItem = {
        id,
        userId: activeUid,
        title,
        body,
        channel,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [item, ...prev]);

      if (
        channel === 'push' &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, { body });
        } catch {
          // Ignore browser notification exceptions in headless mode
        }
      }

      if (user) {
        try {
          await setDoc(doc(db, 'notifications', id), {
            ...item,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `notifications/${id}`);
        }
      }
    },
    [activeUid, user]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      if (user) {
        try {
          await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch {
          // Seeded local notifications may not exist in Firestore yet
        }
      }
    },
    [user]
  );

  const saveOrApplyOpportunity = useCallback(
    async (opp: Opportunity, targetStatus: 'Saved' | 'Applied') => {
      const existing = applications.find((a) => a.opportunityId === opp.id);
      const nowIso = new Date().toISOString();

      if (existing) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === existing.id ? { ...a, status: targetStatus, updatedAt: nowIso } : a
          )
        );
        if (user) {
          try {
            await updateDoc(doc(db, 'applications', existing.id), {
              status: targetStatus,
              updatedAt: serverTimestamp(),
            });
          } catch {
            // Seeded local record
          }
        }
      } else {
        const id = `app-${Date.now().toString(36)}`;
        const record: ApplicationRecord = {
          id,
          studentId: activeUid,
          organizerId: opp.organizerId,
          opportunityId: opp.id,
          opportunityTitle: opp.title,
          organization: opp.organization,
          domain: opp.domain,
          status: targetStatus,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        setApplications((prev) => [record, ...prev]);
        if (user) {
          try {
            await setDoc(doc(db, 'applications', id), {
              ...record,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `applications/${id}`);
          }
        }
      }

      await logEvent(opp.id, targetStatus === 'Saved' ? 'save' : 'register', opp.domain);
      await addNotification(
        targetStatus === 'Saved' ? `Saved: ${opp.title}` : `Registered: ${opp.title}`,
        targetStatus === 'Saved'
          ? `Bookmarked for deadline ${opp.deadline}.`
          : `Application submitted to ${opp.organization}. Check Tracker for interview updates.`,
        'in_app'
      );
    },
    [activeUid, addNotification, applications, logEvent, user]
  );

  const updateApplicationStatus = useCallback(
    async (
      appId: string,
      status: ApplicationStatus,
      interviewAt?: string,
      notes?: string
    ) => {
      const nowIso = new Date().toISOString();
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                status,
                interviewAt: interviewAt !== undefined ? interviewAt : a.interviewAt,
                notes: notes !== undefined ? notes : a.notes,
                updatedAt: nowIso,
              }
            : a
        )
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'applications', appId), {
            status,
            ...(interviewAt !== undefined ? { interviewAt } : {}),
            ...(notes !== undefined ? { notes } : {}),
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Local seed fallback
        }
      }

      if (status === 'Interview Scheduled' && interviewAt) {
        await addNotification(
          'Interview Reminder Scheduled',
          `Interview slot set for ${interviewAt.replace('T', ' ')}. Email & push reminder armed.`,
          'email'
        );
      }
    },
    [addNotification, user]
  );

  const createOpportunity = useCallback(
    async (
      draft: Omit<
        Opportunity,
        'id' | 'organizerId' | 'createdAt' | 'updatedAt' | 'status'
      >,
      status: Opportunity['status'] = 'published'
    ) => {
      const id = `opp-${Date.now().toString(36)}`;
      const nowIso = new Date().toISOString();
      const opp: Opportunity = {
        ...draft,
        id,
        organizerId: activeUid,
        status,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setOpportunities((prev) => [opp, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'opportunities', id), {
            ...opp,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `opportunities/${id}`);
        }
      }

      if (status === 'published') {
        await addNotification(
          `New Opportunity Posted: ${opp.title}`,
          `${opp.organization} targeted ${opp.departments.join(', ')} (${opp.mode}).`,
          'push'
        );
      }
      return opp;
    },
    [activeUid, addNotification, user]
  );

  const moderateOpportunity = useCallback(
    async (oppId: string, nextStatus: 'published' | 'archived') => {
      const nowIso = new Date().toISOString();
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, status: nextStatus, updatedAt: nowIso } : o))
      );
      if (user) {
        try {
          await updateDoc(doc(db, 'opportunities', oppId), {
            status: nextStatus,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Local seed item
        }
      }
    },
    [user]
  );

  const sendEncryptedMessage = useCallback(
    async (threadId: string, recipientId: string, plaintext: string) => {
      const enc = await encryptPayload(plaintext, `ncet-e2ee-${threadId}`);
      const id = `msg-${Date.now().toString(36)}`;
      const nowIso = new Date().toISOString();
      const msg: DirectMessage = {
        id,
        threadId,
        senderId: activeUid,
        recipientId,
        senderName: profile.displayName,
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        algorithm: enc.algorithm,
        plaintextPreview: plaintext,
        createdAt: nowIso,
      };
      setMessages((prev) => [...prev, msg]);

      if (user) {
        try {
          await setDoc(doc(db, 'messages', id), {
            id,
            threadId,
            senderId: activeUid,
            recipientId,
            senderName: profile.displayName,
            ciphertext: enc.ciphertext,
            iv: enc.iv,
            algorithm: enc.algorithm,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `messages/${id}`);
        }
      }
      return msg;
    },
    [activeUid, profile.displayName, user]
  );

  const decryptThreadMessage = useCallback(
    async (msg: DirectMessage): Promise<string> => {
      if (msg.plaintextPreview) return msg.plaintextPreview;
      return decryptPayload(msg.ciphertext, msg.iv, `ncet-e2ee-${msg.threadId}`);
    },
    []
  );

  const addVaultDocument = useCallback(
    async (
      title: string,
      docType: EncryptedVaultDoc['docType'],
      rawContent: string
    ) => {
      const enc = await encryptPayload(rawContent, `ncet-vault-${activeUid}`);
      const id = `vault-${Date.now().toString(36)}`;
      const nowIso = new Date().toISOString();
      const docItem: EncryptedVaultDoc = {
        id,
        ownerId: activeUid,
        title,
        docType,
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        sizeBytes: new TextEncoder().encode(rawContent).length,
        createdAt: nowIso,
      };
      setVaultDocs((prev) => [docItem, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'vaultDocs', id), {
            ...docItem,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `vaultDocs/${id}`);
        }
      }
      return docItem;
    },
    [activeUid, user]
  );

  const decryptVaultDocument = useCallback(
    async (docItem: EncryptedVaultDoc): Promise<string> => {
      return decryptPayload(docItem.ciphertext, docItem.iv, `ncet-vault-${docItem.ownerId}`);
    },
    []
  );

  const deleteVaultDocument = useCallback(
    async (docId: string) => {
      setVaultDocs((prev) => prev.filter((d) => d.id !== docId));
      if (user) {
        try {
          await deleteDoc(doc(db, 'vaultDocs', docId));
        } catch {
          // Local seed fallback
        }
      }
    },
    [user]
  );

  const updateProfile = useCallback(
    async (next: StudentProfile) => {
      const updated = { ...next, updatedAt: new Date().toISOString() };
      setProfile(updated);
      if (user) {
        try {
          await setDoc(
            doc(db, 'publicProfiles', user.uid),
            {
              uid: user.uid,
              displayName: updated.displayName,
              department: updated.department,
              year: updated.year,
              skills: updated.skills,
              interests: updated.interests,
              availability: updated.availability,
              careerGoals: updated.careerGoals,
              bio: updated.bio,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `publicProfiles/${user.uid}`);
        }
      }
    },
    [user]
  );

  // Anonymous Connect: Alias regeneration
  const regenerateAlias = useCallback(() => {
    const prefixes = [
      'Quantum',
      'Cyber',
      'Silicon',
      'Neon',
      'Pixel',
      'Binary',
      'Hyperion',
      'Aero',
      'Vector',
      'Cosmic',
      'Apex',
      'Neural',
    ];
    const animals = [
      'Badger',
      'Falcon',
      'Sphinx',
      'Otter',
      'Eagle',
      'Phoenix',
      'Lynx',
      'Fox',
      'Wolf',
      'Hawk',
      'Panther',
      'Tiger',
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const tag = Math.floor(100 + Math.random() * 900);
    const newName = `${prefix} ${animal} #${tag}`;
    const newAlias: CommunityAlias = {
      id: `alias-${Date.now()}`,
      userId: profile.uid,
      aliasName: newName,
      avatarSeed: `${prefix.toLowerCase()}-${animal.toLowerCase()}`,
      reputationPoints: alias.reputationPoints,
      createdAt: new Date().toISOString(),
    };
    setAlias(newAlias);
    setProfile((prev) => ({ ...prev, anonymousAliasId: newAlias.id }));
    addNotification(
      'Pseudonymous Identity Updated',
      `Your new community alias is ${newName}. Your institutional @ncet.ac.in identity is protected.`,
      'in_app'
    );
    return newAlias;
  }, [addNotification, alias.reputationPoints, profile.uid]);

  // Anonymous Connect: Posts & Interactions
  const createCommunityPost = useCallback(
    (topic: CommunityTopic, title: string, content: string, tags: string[]) => {
      const newPost: CommunityPost = {
        id: `cpost-${Date.now()}`,
        authorAliasId: alias.id,
        authorAliasName: alias.aliasName,
        topic,
        title,
        content,
        tags,
        upvotes: 1,
        hasUpvoted: true,
        commentCount: 0,
        comments: [],
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) => [newPost, ...prev]);
      setAlias((prev) => ({ ...prev, reputationPoints: prev.reputationPoints + 5 }));
      addNotification(
        'Community Topic Published',
        `Your post "${title}" is live in #${topic} under your alias ${alias.aliasName}.`,
        'in_app'
      );
      return newPost;
    },
    [addNotification, alias]
  );

  const upvoteCommunityPost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const already = p.hasUpvoted ?? false;
        return {
          ...p,
          hasUpvoted: !already,
          upvotes: already ? p.upvotes - 1 : p.upvotes + 1,
        };
      })
    );
  }, []);

  const addCommunityComment = useCallback(
    (postId: string, content: string) => {
      const comment: CommunityComment = {
        id: `ccom-${Date.now()}`,
        postId,
        authorAliasName: alias.aliasName,
        content,
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            commentCount: p.commentCount + 1,
            comments: [...(p.comments || []), comment],
          };
        })
      );
      setAlias((prev) => ({ ...prev, reputationPoints: prev.reputationPoints + 2 }));
      return comment;
    },
    [alias.aliasName]
  );

  // Anonymous Connect: Polls
  const votePoll = useCallback((pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        if (poll.userVotedOptionId === optionId) return poll;
        const prevVote = poll.userVotedOptionId;
        const updatedOptions = poll.options.map((opt) => {
          if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
          if (opt.id === prevVote) return { ...opt, votes: Math.max(0, opt.votes - 1) };
          return opt;
        });
        const total = updatedOptions.reduce((acc, curr) => acc + curr.votes, 0);
        return {
          ...poll,
          options: updatedOptions,
          totalVotes: total,
          userVotedOptionId: optionId,
        };
      })
    );
  }, []);

  const createPoll = useCallback(
    (topic: string, question: string, optionTexts: string[]) => {
      const newPoll: CommunityPoll = {
        id: `cpoll-${Date.now()}`,
        topic,
        question,
        authorAliasName: alias.aliasName,
        options: optionTexts.map((text, idx) => ({
          id: `opt-${idx + 1}-${Date.now()}`,
          text,
          votes: 1,
        })),
        totalVotes: optionTexts.length,
        createdAt: new Date().toISOString(),
      };
      setPolls((prev) => [newPoll, ...prev]);
      return newPoll;
    },
    [alias.aliasName]
  );

  // Anonymous Connect: Like-Minded Peer Matches & Mutual Consent
  const requestPeerConnection = useCallback(
    (matchId: string) => {
      setPeerMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: 'pending_approval' } : m))
      );
      addNotification(
        'Peer Connection Request Sent',
        'Your pseudonymous request was delivered. Real identities remain protected until mutual consent.',
        'in_app'
      );
    },
    [addNotification]
  );

  const acceptPeerConnection = useCallback(
    (matchId: string) => {
      setPeerMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: 'connected' } : m))
      );
      addNotification(
        'Peer Connection Accepted',
        'You are now connected with your peer. You can unlock mutual identity verification whenever you choose.',
        'in_app'
      );
    },
    [addNotification]
  );

  const revealMutualIdentity = useCallback(
    (matchId: string) => {
      setPeerMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, mutualConsentRevealed: true } : m))
      );
      addNotification(
        'Mutual Consent Verified: Identity Revealed',
        'Both parties agreed to connect. Institutional credentials and contact information are now visible.',
        'in_app'
      );
    },
    [addNotification]
  );

  // Groups
  const toggleGroupMembership = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const nextIsMember = !g.isMember;
        return {
          ...g,
          isMember: nextIsMember,
          membersCount: nextIsMember ? g.membersCount + 1 : Math.max(1, g.membersCount - 1),
        };
      })
    );
  }, []);

  const createLearningGroup = useCallback(
    (
      name: string,
      topic: string,
      description: string,
      meetingMode: 'Campus Innovation Lab' | 'Virtual Room' | 'Library Discussion Hub',
      tags: string[]
    ) => {
      const newGroup: LearningGroup = {
        id: `group-${Date.now()}`,
        name,
        topic,
        description,
        membersCount: 1,
        maxMembers: 30,
        creatorAlias: alias.aliasName,
        meetingMode,
        tags,
        isMember: true,
        resourcesCount: 1,
      };
      setGroups((prev) => [newGroup, ...prev]);
      return newGroup;
    },
    [alias.aliasName]
  );

  // Reporting & Moderation
  const reportCommunityContent = useCallback(
    (
      targetType: 'post' | 'comment' | 'user',
      targetId: string,
      targetTitle: string,
      reason: string
    ) => {
      const newReport: CommunityReport = {
        id: `rep-${Date.now()}`,
        targetType,
        targetId,
        targetTitle,
        reason,
        reportedByAlias: alias.aliasName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setReports((prev) => [newReport, ...prev]);
      addNotification(
        'Report Received',
        'Thank you for protecting our campus community. Content moderators have been alerted.',
        'in_app'
      );
      return newReport;
    },
    [addNotification, alias.aliasName]
  );

  const resolveReport = useCallback((reportId: string, status: 'resolved' | 'dismissed') => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
  }, []);

  // Event Attendance & Verification
  const checkInAttendance = useCallback(
    (opportunityId: string, passcode: string) => {
      const targetOpp = opportunities.find((o) => o.id === opportunityId);
      if (!targetOpp) return { success: false, message: 'Event not found.' };

      const validCode = targetOpp.checkInCode || 'NCET2026';
      if (passcode.trim().toUpperCase() !== validCode.toUpperCase()) {
        return {
          success: false,
          message: 'Invalid check-in passcode. Please verify with the event organizer registration desk.',
        };
      }

      const existing = attendanceRecords.find(
        (a) => a.opportunityId === opportunityId && a.studentId === profile.uid
      );
      if (existing) {
        return { success: false, message: 'You have already checked in to this event!' };
      }

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        opportunityId,
        opportunityTitle: targetOpp.title,
        studentId: profile.uid,
        studentName: profile.displayName,
        studentEmail: profile.institutionalEmail || `${profile.uid}@ncet.ac.in`,
        department: profile.department,
        year: profile.year,
        markedAt: new Date().toISOString(),
        method: 'passcode',
        verified: true,
      };

      setAttendanceRecords((prev) => [newRecord, ...prev]);
      setProfile((prev) => ({
        ...prev,
        attendanceCount: (prev.attendanceCount || 0) + 1,
      }));

      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunityId ? { ...o, attendedCount: (o.attendedCount || 0) + 1 } : o
        )
      );

      addNotification(
        'Verified Attendance Recorded! 🎖️',
        `You checked into "${targetOpp.title}". Verified participation record added to your portfolio.`,
        'push'
      );

      return { success: true, message: 'Attendance recorded and verified!' };
    },
    [addNotification, attendanceRecords, opportunities, profile]
  );

  const organizerMarkAttendance = useCallback(
    (recordId: string, present: boolean) => {
      setAttendanceRecords((prev) =>
        prev.map((rec) => (rec.id === recordId ? { ...rec, verified: present } : rec))
      );
    },
    []
  );

  const toggleInterestInExternal = useCallback(
    (oppId: string) => {
      setOpportunities((prev) =>
        prev.map((o) => {
          if (o.id !== oppId) return o;
          return {
            ...o,
            interestedPeerCount: (o.interestedPeerCount || 0) + 1,
          };
        })
      );
      addNotification(
        'Attendance Interest Noted',
        'We will suggest anonymous peers from NCET planning to attend without exposing your identity.',
        'in_app'
      );
    },
    [addNotification]
  );

  const reviewOpportunity = useCallback(
    (oppId: string, decision: 'published' | 'rejected', reason?: string) => {
      setOpportunities((prev) =>
        prev.map((o) => {
          if (o.id !== oppId) return o;
          return {
            ...o,
            status: decision === 'published' ? 'published' : 'archived',
            approvalStatus: decision,
            rejectionReason: reason,
          };
        })
      );
    },
    []
  );

  const postAnnouncement = useCallback(
    (announcement: Omit<CampusAnnouncement, 'id' | 'createdAt'>) => {
      const newAnn: CampusAnnouncement = {
        ...announcement,
        id: `ann-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
      addNotification(
        'Campus Announcement Broadcasted',
        `"${announcement.title}" sent to ${announcement.targetDept}.`,
        'in_app'
      );
      return newAnn;
    },
    [addNotification]
  );

  const recommendations = useMemo(
    () =>
      rankRecommendations(
        opportunities,
        profile,
        applications,
        events,
        new Date().toISOString().slice(0, 10)
      ),
    [applications, events, opportunities, profile]
  );

  // ============================================================
  // FINAL IMPLEMENTATION — ACTIONS & COMPUTED HELPERS
  // ============================================================

  const currentStudentId = authUser?.id ?? 'user-priya-001';

  const login = useCallback(
    (email: string, targetRole: UserRole = 'student') => {
      const existing = SEED_AUTH_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      const userToSet: AuthUser = existing ?? {
        id: `user-${Date.now()}`,
        email,
        role: targetRole,
        isVerified: email.toLowerCase().endsWith('@ncetmail.com'),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setAuthUser(userToSet);
      setRole(userToSet.role);
      setLoginModalOpen(false);
      addNotification(
        'Signed In Successfully',
        `Welcome to NCET Connect (${userToSet.email} • ${userToSet.role}).`,
        'in_app'
      );
    },
    [addNotification]
  );

  const logout = useCallback(() => {
    setAuthUser(null);
    setRole('student');
    setLoginModalOpen(false);
    addNotification('Signed Out', 'You have been signed out of NCET Connect.', 'in_app');
  }, [addNotification]);

  const applyToOpportunity = useCallback(
    (opportunityId: string, notes?: string) => {
      setOpportunityApplications((prev) => {
        const existing = prev.find(
          (a) => a.opportunityId === opportunityId && a.studentId === currentStudentId
        );
        if (existing) {
          addNotification('Already Applied', 'You have already submitted an application for this opportunity.', 'in_app');
          return prev;
        }
        const newApp: OpportunityApplication = {
          id: `oppapp-${Date.now()}`,
          studentId: currentStudentId,
          opportunityId,
          status: 'applied',
          appliedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: notes ?? 'Applied via NCET Connect Student Portal.',
        };
        addNotification('Application Submitted', 'Your application is now under review by the organizer.', 'in_app');
        return [newApp, ...prev];
      });

      // Increment registered count on opportunity
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === opportunityId
            ? { ...opp, registeredCount: (opp.registeredCount ?? 0) + 1 }
            : opp
        )
      );
    },
    [addNotification, currentStudentId]
  );

  const updateOpportunityApplicationStatus = useCallback(
    (applicationId: string, status: OpportunityApplicationStatus) => {
      setOpportunityApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status, updatedAt: new Date().toISOString() }
            : app
        )
      );
      addNotification('Application Updated', `Application ${applicationId} status set to ${status}.`, 'in_app');
    },
    [addNotification]
  );

  const withdrawApplication = useCallback(
    (applicationId: string) => {
      setOpportunityApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: 'withdrawn', updatedAt: new Date().toISOString() }
            : app
        )
      );
      addNotification('Application Withdrawn', 'Your application has been safely withdrawn.', 'in_app');
    },
    [addNotification]
  );

  const toggleSaveOpportunity = useCallback(
    (opportunityId: string) => {
      setSavedOpportunities((prev) => {
        const idx = prev.findIndex(
          (s) => s.opportunityId === opportunityId && s.studentId === currentStudentId
        );
        if (idx >= 0) {
          addNotification('Opportunity Unsaved', 'Removed from your bookmarks.', 'in_app');
          return prev.filter((_, i) => i !== idx);
        } else {
          addNotification('Opportunity Bookmarked', 'Saved to your opportunity collection.', 'in_app');
          return [
            {
              id: `saved-${Date.now()}`,
              studentId: currentStudentId,
              opportunityId,
              savedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
      });
    },
    [addNotification, currentStudentId]
  );

  const isOpportunitySaved = useCallback(
    (opportunityId: string) => {
      return savedOpportunities.some(
        (s) => s.opportunityId === opportunityId && s.studentId === currentStudentId
      );
    },
    [currentStudentId, savedOpportunities]
  );

  const sendCircleConnectionRequest = useCallback(
    (receiverCircleProfileId: string) => {
      const myId = myCircleProfile?.id ?? 'circle-priya-001';
      setCircleConnections((prev) => {
        const exists = prev.find(
          (c) =>
            (c.senderId === myId && c.receiverId === receiverCircleProfileId) ||
            (c.senderId === receiverCircleProfileId && c.receiverId === myId)
        );
        if (exists) {
          addNotification('Connection Exists', 'A request with this peer is already active.', 'in_app');
          return prev;
        }
        const newConn: CircleConnection = {
          id: `cconn-${Date.now()}`,
          senderId: myId,
          receiverId: receiverCircleProfileId,
          status: 'pending',
          identityRevealed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addNotification('Connection Sent', 'Anonymous connect invitation dispatched.', 'in_app');
        return [newConn, ...prev];
      });
    },
    [addNotification, myCircleProfile]
  );

  const acceptCircleConnection = useCallback(
    (connectionId: string) => {
      setCircleConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, status: 'accepted', updatedAt: new Date().toISOString() }
            : c
        )
      );
      addNotification('Connection Accepted', 'You can now chat anonymously in Campus Circles.', 'in_app');
    },
    [addNotification]
  );

  const rejectCircleConnection = useCallback(
    (connectionId: string) => {
      setCircleConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, status: 'rejected', updatedAt: new Date().toISOString() }
            : c
        )
      );
      addNotification('Connection Declined', 'Request has been declined.', 'in_app');
    },
    [addNotification]
  );

  const unmatchCircleConnection = useCallback(
    (connectionId: string) => {
      setCircleConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, status: 'unmatched', updatedAt: new Date().toISOString() }
            : c
        )
      );
      addNotification('Peer Unmatched', 'Connection closed.', 'in_app');
    },
    [addNotification]
  );

  const sendCircleMessage = useCallback(
    (connectionId: string, message: string) => {
      const myId = myCircleProfile?.id ?? 'circle-priya-001';
      const newMsg: CircleMessage = {
        id: `cmsg-${Date.now()}`,
        connectionId,
        senderId: myId,
        message,
        isFlagged: false,
        createdAt: new Date().toISOString(),
      };
      setCircleMessages((prev) => [...prev, newMsg]);
    },
    [myCircleProfile]
  );

  const flagCircleMessage = useCallback(
    (messageId: string) => {
      setCircleMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isFlagged: true } : m))
      );
      addNotification('Message Flagged', 'Our moderation team will review this interaction.', 'in_app');
    },
    [addNotification]
  );

  const updateMyCircleProfile = useCallback(
    (updates: Partial<CircleProfile>) => {
      setMyCircleProfile((prev) => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        setCircleProfiles((list) => list.map((p) => (p.id === prev.id ? updated : p)));
        return updated;
      });
      addNotification('Anonymous Profile Updated', 'Your Campus Circle identity preferences are saved.', 'in_app');
    },
    [addNotification]
  );

  const submitExternalEventImport = useCallback(
    (event: Omit<ExternalEventImport, 'id' | 'importedAt' | 'status'>) => {
      const newImport: ExternalEventImport = {
        ...event,
        id: `ext-${Date.now()}`,
        status: 'pending',
        importedAt: new Date().toISOString(),
      };
      setExternalEventImports((prev) => [newImport, ...prev]);
      addNotification('Event Import Submitted', `"${event.title}" queued for admin review.`, 'in_app');
    },
    [addNotification]
  );

  const reviewExternalEvent = useCallback(
    (eventId: string, decision: 'approved' | 'rejected') => {
      setExternalEventImports((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, status: decision } : ev))
      );
      addNotification('Event Reviewed', `External event ${decision}.`, 'in_app');
    },
    [addNotification]
  );

  const toggleVolunteerOptin = useCallback(
    (opportunityId: string) => {
      setVolunteerOptins((prev) => {
        const exists = prev.some(
          (v) => v.opportunityId === opportunityId && v.studentId === currentStudentId
        );
        if (exists) {
          addNotification('Volunteer Opt-Out', 'Removed from volunteer roster.', 'in_app');
          return prev.filter(
            (v) => !(v.opportunityId === opportunityId && v.studentId === currentStudentId)
          );
        } else {
          addNotification('Volunteer Registered!', 'Thank you for volunteering! Organizers have been notified.', 'in_app');
          return [
            {
              id: `vol-${Date.now()}`,
              studentId: currentStudentId,
              opportunityId,
              skills: profile.skills,
              availability: ['Weekends'],
              optedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
      });
    },
    [addNotification, currentStudentId, profile.skills]
  );

  const trackFeedback = useCallback(
    (opportunityId: string, action: FeedbackAction) => {
      setOpportunityFeedback((prev) => [
        {
          id: `fb-${Date.now()}`,
          studentId: currentStudentId,
          opportunityId,
          action,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [currentStudentId]
  );

  const awardRecognition = useCallback(
    (studentId: string, type: RecognitionType, points: number, reason: string) => {
      const newRec: Recognition = {
        id: `rec-${Date.now()}`,
        studentId,
        recognitionType: type,
        points,
        awardedAt: new Date().toISOString(),
        reason,
      };
      setRecognitions((prev) => [newRec, ...prev]);
      addNotification('Recognition Awarded', `+${points} pts (${type}) awarded to student.`, 'in_app');
    },
    [addNotification]
  );

  const getLeaderboard = useCallback((): LeaderboardEntry[] => {
    const studentMap = new Map<string, { totalPoints: number; badges: Set<RecognitionType> }>();
    recognitions.forEach((r) => {
      const cur = studentMap.get(r.studentId) ?? { totalPoints: 0, badges: new Set<RecognitionType>() };
      cur.totalPoints += r.points;
      cur.badges.add(r.recognitionType);
      studentMap.set(r.studentId, cur);
    });

    const entries: LeaderboardEntry[] = [];
    studentMap.forEach((val, sId) => {
      const userObj = SEED_AUTH_USERS.find((u) => u.id === sId);
      const circleObj = circleProfiles.find((c) => c.userId === sId);
      entries.push({
        studentId: sId,
        anonymousName: circleObj?.anonymousName,
        displayName: sId === currentStudentId ? `${profile.displayName} (You)` : userObj?.email.split('@')[0] ?? `Student #${sId.slice(-3)}`,
        department: circleObj?.department ?? 'CSE',
        totalPoints: val.totalPoints,
        badges: Array.from(val.badges),
        rank: 0,
      });
    });

    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return entries;
  }, [circleProfiles, currentStudentId, profile.displayName, recognitions]);

  const getMyApplications = useCallback((): OpportunityApplication[] => {
    return opportunityApplications.filter((a) => a.studentId === currentStudentId);
  }, [currentStudentId, opportunityApplications]);

  const getMySavedOpportunities = useCallback((): SavedOpportunity[] => {
    return savedOpportunities.filter((s) => s.studentId === currentStudentId);
  }, [currentStudentId, savedOpportunities]);

  const getFilteredOpportunities = useCallback((): Opportunity[] => {
    return opportunities.filter((opp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesDesc = opp.description.toLowerCase().includes(q);
        const matchesOrg = opp.organization.toLowerCase().includes(q);
        const matchesSkills = (opp.tags || []).some((s: string) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesOrg && !matchesSkills) return false;
      }
      if (opportunityTypeFilter !== 'All' && opp.type !== opportunityTypeFilter) {
        return false;
      }
      if (locationFilter !== 'All') {
        if (locationFilter === 'On campus' && !opp.venue?.toLowerCase().includes('campus') && opp.isExternal) return false;
        if (locationFilter === 'Bengaluru' && !opp.venue?.toLowerCase().includes('bengaluru') && !opp.venue?.toLowerCase().includes('blr')) return false;
        if (locationFilter === 'Remote / Online' && opp.venue?.toLowerCase().includes('in-person')) return false;
      }
      if (departmentFilter !== 'All') {
        const depts = opp.eligibleDepartments || opp.departments || [];
        if (depts.length > 0 && !depts.includes(departmentFilter)) {
          return false;
        }
      }
      if (modeFilter !== 'All') {
        if (opp.mode !== modeFilter) return false;
      }
      return true;
    });
  }, [departmentFilter, locationFilter, modeFilter, opportunities, opportunityTypeFilter, searchQuery]);

  const getPeerMatches = useCallback((): Array<CircleProfile & { matchScore: number; explanation: string }> => {
    const myProfile = myCircleProfile;
    if (!myProfile) return [];

    return circleProfiles
      .filter((p) => p.id !== myProfile.id && p.isActive)
      .map((peer) => {
        // Interest overlap (Jaccard)
        const myInterests = new Set(myProfile.interests);
        const sharedInterests = peer.interests.filter((i) => myInterests.has(i));
        const unionInterests = new Set([...myProfile.interests, ...peer.interests]);
        const interestOverlap = unionInterests.size > 0 ? sharedInterests.length / unionInterests.size : 0;

        // Skill complement / overlap
        const mySkills = new Set(myProfile.skills);
        const sharedSkills = peer.skills.filter((s) => mySkills.has(s));
        const skillComplement = Math.min(1, (sharedSkills.length * 0.4) + (peer.skills.length * 0.2));

        // Intent match
        const intentMatch = myProfile.connectionIntent === peer.connectionIntent ? 1 : 0.4;

        // Availability match
        const myAvail = new Set(myProfile.availability);
        const sharedAvail = peer.availability.filter((a) => myAvail.has(a));
        const availabilityMatch = sharedAvail.length > 0 ? 1 : 0.3;

        // Formula: 0.30 Interest + 0.25 Skill + 0.20 Intent + 0.15 Availability + 0.10 Activity
        const score = Math.round(
          (0.30 * interestOverlap +
            0.25 * skillComplement +
            0.20 * intentMatch +
            0.15 * availabilityMatch +
            0.10 * (peer.profileScore / 100)) *
            100
        );

        let explanation = '';
        if (sharedInterests.length > 0 && myProfile.connectionIntent === peer.connectionIntent) {
          explanation = `Both seek a ${myProfile.connectionIntent} and share interest in ${sharedInterests.slice(0, 2).join(', ')}.`;
        } else if (sharedInterests.length > 0) {
          explanation = `Strong synergy in ${sharedInterests.slice(0, 2).join(', ')} with complementary tech skills.`;
        } else {
          explanation = `Compatible weekend availability and cross-functional ${peer.department} background.`;
        }

        return {
          ...peer,
          matchScore: Math.min(99, Math.max(65, score)),
          explanation,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [circleProfiles, myCircleProfile]);

  const getRecommendedOpportunities = useCallback((): Array<Opportunity & { recommendScore: number; explanation: string }> => {
    return opportunities
      .filter((opp) => opp.approvalStatus === 'published' || opp.approvalStatus === undefined)
      .map((opp) => {
        // Skill fit
        const mySkills = new Set(profile.skills.map((s) => s.toLowerCase()));
        const tags = opp.tags || [];
        const matchedSkills = tags.filter((s: string) => mySkills.has(s.toLowerCase()));
        const skillFit = tags.length > 0 ? matchedSkills.length / tags.length : 0.5;

        // Interest fit
        const myInterests = new Set(profile.interests.map((i) => i.toLowerCase()));
        const matchedInterests = tags.filter((i: string) => myInterests.has(i.toLowerCase()));
        const interestFit = tags.length > 0 ? matchedInterests.length / tags.length : 0.5;

        // Department fit
        const depts = opp.eligibleDepartments || opp.departments || [];
        const deptFit = depts.length === 0 || depts.includes(profile.department) ? 1 : 0.4;

        // Score calculation: 0.30 Skill + 0.20 Interest + 0.15 Dept + 0.15 Availability + 0.10 Location + 0.10 Urgency
        const score = Math.round(
          (0.30 * skillFit +
            0.20 * interestFit +
            0.15 * deptFit +
            0.15 * 0.8 +
            0.10 * (opp.isExternal ? 0.85 : 1.0) +
            0.10 * 0.9) *
            100
        );

        let explanation = '';
        if (matchedSkills.length > 0 && matchedInterests.length > 0) {
          explanation = `Matches your ${matchedSkills.slice(0, 2).join(', ')} skills and ${matchedInterests[0]} interest.`;
        } else if (matchedSkills.length > 0) {
          explanation = `Matches required skills: ${matchedSkills.slice(0, 2).join(', ')}.`;
        } else if (matchedInterests.length > 0) {
          explanation = `Aligns with your interest in ${matchedInterests.slice(0, 2).join(', ')}.`;
        } else {
          explanation = `High demand opportunity for ${profile.department} students.`;
        }

        return {
          ...opp,
          recommendScore: Math.min(99, Math.max(70, score)),
          explanation,
        };
      })
      .sort((a, b) => b.recommendScore - a.recommendScore);
  }, [opportunities, profile.department, profile.interests, profile.skills]);

  return {
    user,
    authReady,
    authError,
    role,
    setRole,
    profile,
    updateProfile,
    opportunities,
    recommendations,
    applications,
    events,
    notifications,
    messages,
    vaultDocs,
    biometricUnlocked,
    setBiometricUnlocked,
    signInWithGoogle,
    signOutUser,
    saveOrApplyOpportunity,
    updateApplicationStatus,
    createOpportunity,
    moderateOpportunity,
    sendEncryptedMessage,
    decryptThreadMessage,
    addVaultDocument,
    decryptVaultDocument,
    deleteVaultDocument,
    logEvent,
    addNotification,
    markNotificationRead,
    // Anonymous Connect & Campus Modules
    alias,
    regenerateAlias,
    posts,
    createCommunityPost,
    upvoteCommunityPost,
    addCommunityComment,
    polls,
    votePoll,
    createPoll,
    peerMatches,
    requestPeerConnection,
    acceptPeerConnection,
    revealMutualIdentity,
    groups,
    toggleGroupMembership,
    createLearningGroup,
    announcements,
    postAnnouncement,
    badges,
    attendanceRecords,
    checkInAttendance,
    organizerMarkAttendance,
    reports,
    reportCommunityContent,
    resolveReport,
    toggleInterestInExternal,
    reviewOpportunity,
    // Final Implementation additions
    authUser,
    loginModalOpen,
    setLoginModalOpen,
    login,
    logout,
    circleProfiles,
    circleConnections,
    circleMessages,
    myCircleProfile,
    opportunityApplications,
    savedOpportunities,
    recognitions,
    externalEventImports,
    volunteerOptins,
    opportunityFeedback,
    searchQuery,
    setSearchQuery,
    opportunityTypeFilter,
    setOpportunityTypeFilter,
    locationFilter,
    setLocationFilter,
    departmentFilter,
    setDepartmentFilter,
    modeFilter,
    setModeFilter,
    applyToOpportunity,
    updateOpportunityApplicationStatus,
    withdrawApplication,
    toggleSaveOpportunity,
    isOpportunitySaved,
    sendCircleConnectionRequest,
    acceptCircleConnection,
    rejectCircleConnection,
    unmatchCircleConnection,
    sendCircleMessage,
    flagCircleMessage,
    updateMyCircleProfile,
    submitExternalEventImport,
    reviewExternalEvent,
    toggleVolunteerOptin,
    trackFeedback,
    awardRecognition,
    getLeaderboard,
    getMyApplications,
    getMySavedOpportunities,
    getFilteredOpportunities,
    getPeerMatches,
    getRecommendedOpportunities,
  };
}
