export type UserRole = 'student' | 'organizer' | 'club_organizer' | 'faculty' | 'startup' | 'ngo' | 'admin';

export type OpportunityType =
  | 'Internship'
  | 'Hackathon'
  | 'Workshop'
  | 'Meetup'
  | 'Research'
  | 'Campus Drive'
  | 'Competition'
  | 'Fest'
  | 'Seminar';

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
  usn?: string;
  institutionalEmail?: string;
  anonymousAliasId?: string;
  badges?: string[];
  attendanceCount?: number;
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
  venue?: string;
  eventDate?: string;
  timeSlot?: string;
  isExternal?: boolean;
  externalUrl?: string;
  checkInCode?: string;
  maxCapacity?: number;
  registeredCount?: number;
  attendedCount?: number;
  approvalStatus?: 'draft' | 'pending_approval' | 'published' | 'rejected';
  rejectionReason?: string;
  interestedPeerCount?: number;
  source?: EventSource;
  sourceUrl?: string;
  eligibleDepartments?: string[];
  compensation?: string;
  numberOfOpenings?: number;
  registrationDeadline?: string;
  organizerType?: UserRole;
  locationFilter?: 'On campus' | 'Bengaluru' | 'Remote / Online' | 'Hybrid' | 'Near me';
  volunteerCount?: number;
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

export interface CommunityAlias {
  id: string;
  userId: string;
  aliasName: string;
  avatarSeed: string;
  reputationPoints: number;
  createdAt: string;
}

export type CommunityTopic =
  | 'AI & ML'
  | 'Web Dev'
  | 'Cybersecurity'
  | 'Robotics'
  | 'Design'
  | 'Startups'
  | 'Competitive Programming'
  | 'General Learning';

export interface CommunityComment {
  id: string;
  postId: string;
  authorAliasName: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorAliasId: string;
  authorAliasName: string;
  topic: CommunityTopic;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  hasUpvoted?: boolean;
  commentCount: number;
  comments: CommunityComment[];
  createdAt: string;
  isReported?: boolean;
}

export interface CommunityPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CommunityPoll {
  id: string;
  topic: string;
  question: string;
  authorAliasName: string;
  options: CommunityPollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
  createdAt: string;
}

export interface PeerMatch {
  id: string;
  peerAliasId: string;
  peerAliasName: string;
  matchScore: number;
  matchExplanation: string;
  sharedInterests: string[];
  status: 'unconnected' | 'requested' | 'pending_approval' | 'connected';
  mutualConsentRevealed: boolean;
  revealedProfile?: {
    displayName: string;
    department: string;
    year: string;
    email: string;
    bio: string;
  };
}

export interface LearningGroup {
  id: string;
  name: string;
  topic: string;
  description: string;
  membersCount: number;
  maxMembers: number;
  creatorAlias: string;
  meetingMode: 'Campus Innovation Lab' | 'Virtual Room' | 'Library Discussion Hub';
  tags: string[];
  isMember: boolean;
  resourcesCount: number;
}

export interface AttendanceRecord {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  department: string;
  year: string;
  markedAt: string;
  method: 'passcode' | 'manual_organizer' | 'qr';
  verified: boolean;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  summary: string;
  author: string;
  category: string;
  priority: 'normal' | 'urgent' | 'pinned';
  targetDept: string;
  targetYear: string;
  createdAt: string;
}

export interface CommunityReport {
  id: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  targetTitle: string;
  reason: string;
  reportedByAlias: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface StudentRecognitionBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'attendance' | 'community' | 'hackathon' | 'leadership';
}


// ============================================================
// FINAL IMPLEMENTATION — NEW TYPES
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export type ConnectionIntent =
  | 'Hackathon teammate'
  | 'Project partner'
  | 'Study group'
  | 'Volunteer opportunity'
  | 'Internship preparation'
  | 'Club collaboration'
  | 'Mentorship'
  | 'Open-source contribution'
  | 'Community project';

export interface CircleProfile {
  id: string;
  userId: string;
  anonymousName: string;
  department: string;
  academicYear: string;
  skills: string[];
  interests: string[];
  availability: string[];
  connectionIntent: ConnectionIntent;
  bio: string;
  profileScore: number;
  isActive: boolean;
  createdAt: string;
}

export interface CircleConnection {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'unmatched';
  identityRevealed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CircleMessage {
  id: string;
  connectionId: string;
  senderId: string;
  message: string;
  isFlagged: boolean;
  createdAt: string;
}

/** Status values used by OpportunityApplication (distinct from the legacy ApplicationStatus) */
export type OpportunityApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'selected'
  | 'rejected'
  | 'withdrawn'
  | 'completed';

export interface OpportunityApplication {
  id: string;
  studentId: string;
  opportunityId: string;
  status: OpportunityApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface SavedOpportunity {
  id: string;
  studentId: string;
  opportunityId: string;
  savedAt: string;
}

export type RecognitionType =
  | 'Active Learner'
  | 'Hackathon Participant'
  | 'Hackathon Winner'
  | 'Club Contributor'
  | 'Open-Source Contributor'
  | 'Community Volunteer'
  | 'Event Organizer'
  | 'Campus Ambassador'
  | 'Research Contributor'
  | 'Mentor'
  | 'Innovation Champion';

export interface Recognition {
  id: string;
  studentId: string;
  recognitionType: RecognitionType;
  points: number;
  awardedAt: string;
  reason?: string;
}

export interface LeaderboardEntry {
  studentId: string;
  anonymousName?: string;
  displayName: string;
  department: string;
  totalPoints: number;
  badges: RecognitionType[];
  rank: number;
}

export type EventSource =
  | 'NCET Club'
  | 'NCET Department'
  | 'Faculty'
  | 'Startup'
  | 'NGO'
  | 'Luma'
  | 'Meetup'
  | 'Devfolio'
  | 'Unstop'
  | 'AllEvents'
  | 'Hack2skill'
  | 'Google Student Ambassador'
  | 'Microsoft Student Ambassador'
  | 'IBM Community'
  | 'AWS Community'
  | 'GitHub'
  | 'GDG Bangalore'
  | 'HasGeek';

export interface ExternalEventImport {
  id: string;
  source: EventSource;
  sourceUrl?: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  mode: 'online' | 'offline' | 'hybrid';
  organizer: string;
  registrationUrl?: string;
  category: string;
  skills: string[];
  status: 'pending' | 'approved' | 'rejected';
  importedAt: string;
}

export interface RecommendationScore {
  opportunityId: string;
  totalScore: number;
  skillFit: number;
  interestFit: number;
  availabilityFit: number;
  goalFit: number;
  locationFit: number;
  impactFit: number;
  urgencyFit: number;
  explanation: string;
}

export interface PeerMatchScore {
  circleProfileId: string;
  totalScore: number;
  interestOverlap: number;
  skillComplement: number;
  intentMatch: number;
  availabilityMatch: number;
  activityScore: number;
  explanation: string;
}

export interface VolunteerOptin {
  id: string;
  studentId: string;
  opportunityId: string;
  skills: string[];
  availability: string[];
  optedAt: string;
}

export type FeedbackAction = 'viewed' | 'clicked' | 'saved' | 'applied' | 'dismissed' | 'registered' | 'attended';

export interface OpportunityFeedback {
  id: string;
  studentId: string;
  opportunityId: string;
  action: FeedbackAction;
  createdAt: string;
}
