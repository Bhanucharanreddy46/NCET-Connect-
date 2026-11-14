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
} from '../types/ncet';
import { decryptPayload, encryptPayload } from '../utils/crypto';
import { rankRecommendations } from '../utils/recommender';

const CACHE_KEY = 'ncet_connect_offline_state_v2';

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
}

function loadCachedState(): CachedState {
  if (typeof localStorage === 'undefined') {
    return {
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
    };
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CachedState>;
      return {
        profile: parsed.profile ?? DEFAULT_STUDENT_PROFILE,
        opportunities:
          parsed.opportunities && parsed.opportunities.length > 0
            ? parsed.opportunities
            : SEED_OPPORTUNITIES,
        applications: parsed.applications ?? SEED_APPLICATIONS,
        events: parsed.events ?? SEED_EVENTS,
        notifications: parsed.notifications ?? SEED_NOTIFICATIONS,
        messages: parsed.messages ?? [],
        vaultDocs: parsed.vaultDocs ?? [],
        alias: parsed.alias ?? DEFAULT_COMMUNITY_ALIAS,
        posts: parsed.posts && parsed.posts.length > 0 ? parsed.posts : SEED_COMMUNITY_POSTS,
        polls: parsed.polls && parsed.polls.length > 0 ? parsed.polls : SEED_COMMUNITY_POLLS,
        peerMatches: parsed.peerMatches && parsed.peerMatches.length > 0 ? parsed.peerMatches : SEED_PEER_MATCHES,
        groups: parsed.groups && parsed.groups.length > 0 ? parsed.groups : SEED_LEARNING_GROUPS,
        announcements: parsed.announcements && parsed.announcements.length > 0 ? parsed.announcements : SEED_ANNOUNCEMENTS,
        badges: parsed.badges && parsed.badges.length > 0 ? parsed.badges : SEED_RECOGNITION_BADGES,
        attendanceRecords: parsed.attendanceRecords && parsed.attendanceRecords.length > 0 ? parsed.attendanceRecords : SEED_ATTENDANCE_RECORDS,
        reports: parsed.reports && parsed.reports.length > 0 ? parsed.reports : SEED_COMMUNITY_REPORTS,
      };
    }
  } catch {
    // Fallback to clean seed
  }
  return {
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
  };
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
  };
}
