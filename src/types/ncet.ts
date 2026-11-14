export type UserRole = 'student' | 'organizer' | 'admin';

export type OpportunityType =
  | 'Internship'
  | 'Hackathon'
  | 'Workshop'
  | 'Meetup'
  | 'Research'
  | 'Campus Drive';

export type OpportunityMode = 'Remote' | 'Hybrid' | 'On-Campus' | 'Offline';

export type SourceGroup = 'Campus' | 'Career' | 'Community';

export type OpportunityStatus = 'published' | 'pending_moderation' | 'archived';

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Interview Scheduled'
  | 'Offer'
  | 'Completed';

export interface UserAccount {
  uid: string;
  email: string;
  role: 'student' | 'organizer';
  biometricEnabled: boolean;
  emailDigestEnabled: boolean;
  pushRemindersEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  uid: string;
  displayName: string;
  department: string;
  year: string;
  skills: string[];
  interests: string[];
  availability: string[];
  careerGoals: string[];
  bio: string;
  avatarUrl?: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  organizerId: string;
  title: string;
  organization: string;
  type: OpportunityType;
  domain: string;
  industry: string;
  mode: OpportunityMode;
  departments: string[];
  eligibleYears: string[];
  tags: string[];
  availabilitySlot: string;
  goalMatch: string;
  deadline: string; // YYYY-MM-DD
  sourceGroup: SourceGroup;
  sourceName: string;
  status: OpportunityStatus;
  description: string;
  stipendOrPrize: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationBreakdown {
  semanticMatch: number;
  skillInterestOverlap: number;
  availabilityFit: number;
  goalAlignment: number;
  engagementHistory: number;
  totalScore: number;
}

export interface RecommendationResult {
  opportunity: Opportunity;
  breakdown: RecommendationBreakdown;
  explanation: string;
}

export interface ApplicationRecord {
  id: string;
  studentId: string;
  organizerId: string;
  opportunityId: string;
  opportunityTitle: string;
  organization: string;
  domain: string;
  status: ApplicationStatus;
  interviewAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  ciphertext: string;
  iv: string;
  algorithm: string;
  plaintextPreview?: string;
  createdAt: string;
}

export interface ContactThread {
  threadId: string;
  peerId: string;
  peerName: string;
  peerRole: string;
  peerOrg: string;
  avatarUrl?: string;
}

export interface EncryptedVaultDoc {
  id: string;
  ownerId: string;
  title: string;
  docType: 'Resume' | 'Transcript' | 'Offer Letter' | 'ID Verification' | 'Certificate';
  ciphertext: string;
  iv: string;
  sizeBytes: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  channel: 'push' | 'email' | 'in_app';
  read: boolean;
  createdAt: string;
}

export interface EngagementEvent {
  id: string;
  userId: string;
  opportunityId: string;
  eventType: 'click' | 'save' | 'register' | 'share';
  domain: string;
  createdAt: string;
}
