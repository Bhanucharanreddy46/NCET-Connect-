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
  DEFAULT_STUDENT_PROFILE,
  SEED_APPLICATIONS,
  SEED_EVENTS,
  SEED_NOTIFICATIONS,
  SEED_OPPORTUNITIES,
} from '../data/seedData';
import type {
  ApplicationRecord,
  ApplicationStatus,
  DirectMessage,
  EncryptedVaultDoc,
  EngagementEvent,
  NotificationItem,
  Opportunity,
  StudentProfile,
  UserRole,
} from '../types/ncet';
import { decryptPayload, encryptPayload } from '../utils/crypto';
import { rankRecommendations } from '../utils/recommender';

const CACHE_KEY = 'ncet_connect_offline_state_v1';

interface CachedState {
  profile: StudentProfile;
  opportunities: Opportunity[];
  applications: ApplicationRecord[];
  events: EngagementEvent[];
  notifications: NotificationItem[];
  messages: DirectMessage[];
  vaultDocs: EncryptedVaultDoc[];
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
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [profile, opportunities, applications, events, notifications, messages, vaultDocs]);

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
  };
}
