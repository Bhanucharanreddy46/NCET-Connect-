import test from 'node:test';
import assert from 'node:assert/strict';
import type { CircleProfile, Opportunity, StudentProfile } from '../types/ncet';

const demoStudent: StudentProfile = {
  uid: 'stu-priya-01',
  displayName: 'Priya Nair',
  department: 'CSE',
  year: '3rd Year',
  skills: ['ReactJS', 'TypeScript', 'Node.js', 'Python'],
  interests: ['AI & ML', 'Full-Stack Engineering', 'Open Source'],
  availability: ['Weekends', 'Evenings'],
  careerGoals: ['Product Engineering Internship', 'Win Hackathons'],
  bio: 'Building full-stack React and AI apps.',
  updatedAt: '2026-11-14T10:00:00Z',
};

const peerProfile1: CircleProfile = {
  id: 'circle-peer-01',
  userId: 'user-02',
  anonymousName: 'Cyber Phoenix #402',
  department: 'CSE',
  academicYear: '3rd Year',
  skills: ['Python', 'TensorFlow', 'FastAPI'],
  interests: ['AI & ML', 'Hackathons'],
  availability: ['Weekends'],
  connectionIntent: 'Hackathon teammate',
  bio: 'ML researcher looking for a frontend partner for upcoming GDG hackathon.',
  profileScore: 92,
  isActive: true,
  createdAt: '2026-11-10T00:00:00Z',
};

const peerProfile2: CircleProfile = {
  id: 'circle-peer-02',
  userId: 'user-03',
  anonymousName: 'Silicon Badger #118',
  department: 'Mechanical',
  academicYear: '1st Year',
  skills: ['AutoCAD', 'SolidWorks'],
  interests: ['Robotics'],
  availability: ['Weekday mornings'],
  connectionIntent: 'Study group',
  bio: 'CAD enthusiast seeking robotics club team.',
  profileScore: 70,
  isActive: true,
  createdAt: '2026-11-10T00:00:00Z',
};

function computePeerMatch(
  myProfile: {
    skills: string[];
    interests: string[];
    availability: string[];
    connectionIntent: string;
  },
  peer: CircleProfile
): { matchScore: number; explanation: string } {
  // Shared interests
  const myInterestSet = new Set(myProfile.interests.map((i) => i.toLowerCase()));
  const sharedInterests = peer.interests.filter((i) => myInterestSet.has(i.toLowerCase()));
  const unionInterests = new Set([...myProfile.interests, ...peer.interests]);
  const interestOverlap = unionInterests.size > 0 ? sharedInterests.length / unionInterests.size : 0;

  // Skills complement
  const mySkillSet = new Set(myProfile.skills.map((s) => s.toLowerCase()));
  const sharedSkills = peer.skills.filter((s) => mySkillSet.has(s.toLowerCase()));
  const skillComplement = Math.min(1, sharedSkills.length * 0.4 + peer.skills.length * 0.2);

  // Intent match
  const intentMatch = myProfile.connectionIntent === peer.connectionIntent ? 1 : 0.4;

  // Availability match
  const myAvailSet = new Set(myProfile.availability.map((a) => a.toLowerCase()));
  const sharedAvail = peer.availability.filter((a) => myAvailSet.has(a.toLowerCase()));
  const availabilityMatch = sharedAvail.length > 0 ? 1 : 0.3;

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
    matchScore: Math.min(99, Math.max(65, score)),
    explanation,
  };
}

test('Peer synergy matching yields high score for complementary hackathon teammates', () => {
  const myContext = {
    skills: demoStudent.skills,
    interests: ['AI & ML', 'Hackathons'],
    availability: ['Weekends'],
    connectionIntent: 'Hackathon teammate',
  };

  const highMatch = computePeerMatch(myContext, peerProfile1);
  const lowMatch = computePeerMatch(myContext, peerProfile2);

  assert.ok(highMatch.matchScore > 80, `Expected high match score > 80, got ${highMatch.matchScore}`);
  assert.ok(highMatch.matchScore > lowMatch.matchScore);
  assert.match(highMatch.explanation, /Hackathon teammate/);
  assert.match(highMatch.explanation, /AI & ML/);
});

test('Passcode check-in verification succeeds for matching event code', () => {
  const publishedEvent: Partial<Opportunity> = {
    id: 'opp-gdg-01',
    title: 'GDG Cloud DevFest 2026',
    checkInCode: 'GDG782',
    status: 'published',
  };

  function verifyPasscode(inputCode: string, targetEvent: Partial<Opportunity>): boolean {
    if (!targetEvent.checkInCode) return false;
    return inputCode.trim().toUpperCase() === targetEvent.checkInCode.trim().toUpperCase();
  }

  assert.equal(verifyPasscode('gdg782', publishedEvent), true);
  assert.equal(verifyPasscode('GDG782', publishedEvent), true);
  assert.equal(verifyPasscode('WRONG99', publishedEvent), false);
});
