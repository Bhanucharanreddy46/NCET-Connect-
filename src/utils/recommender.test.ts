import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeApplicationAnalytics,
  computeSkillGaps,
  cosineSimilarity,
  rankRecommendations,
  scoreOpportunity,
} from './recommender';
import type { ApplicationRecord, EngagementEvent, Opportunity, StudentProfile } from '../types/ncet';

const baseProfile: StudentProfile = {
  uid: 'stu-1',
  displayName: 'Priya Nair',
  department: 'CSE',
  year: '3rd Year',
  skills: ['ReactJS', 'TypeScript', 'Node.js'],
  interests: ['Full-Stack Engineering', 'Developer Tools'],
  availability: ['Weekends', 'Evenings'],
  careerGoals: ['Product Engineering Internship'],
  bio: 'Building full-stack ReactJS and TypeScript apps.',
  updatedAt: '2026-11-10T10:00:00Z',
};

const baseOpp: Opportunity = {
  id: 'opp-1',
  organizerId: 'org-1',
  title: 'Frontend ReactJS & TypeScript Workshop',
  organization: 'GDG NCET',
  type: 'Workshop',
  domain: 'Full-Stack Engineering',
  industry: 'Developer Tools',
  mode: 'On-Campus',
  departments: ['CSE', 'ISE'],
  eligibleYears: ['3rd Year', '4th Year'],
  tags: ['ReactJS', 'TypeScript', 'UI Systems'],
  availabilitySlot: 'Weekends',
  goalMatch: 'Product Engineering Internship',
  deadline: '2026-12-15',
  sourceGroup: 'Community',
  sourceName: 'GDG',
  status: 'published',
  description: 'Hands-on weekend ReactJS and TypeScript engineering meetup.',
  stipendOrPrize: 'Certificate + Swag',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

test('cosineSimilarity returns higher score for matching corpus', () => {
  const high = cosineSimilarity('ReactJS TypeScript Node.js', 'ReactJS TypeScript Workshop');
  const low = cosineSimilarity('ReactJS TypeScript Node.js', 'Thermodynamics Fluid Mechanics');
  assert.ok(high > low);
  assert.equal(low, 0);
});

test('scoreOpportunity computes exact weighted hybrid breakdown and readable explanation', () => {
  const events: EngagementEvent[] = [
    {
      id: 'ev-1',
      userId: 'stu-1',
      opportunityId: 'opp-x',
      eventType: 'register',
      domain: 'Full-Stack Engineering',
      createdAt: '2026-11-05T10:00:00Z',
    },
  ];
  const result = scoreOpportunity(baseOpp, baseProfile, events);
  assert.ok(result.breakdown.totalScore > 0.65);
  assert.equal(result.breakdown.availabilityFit, 1);
  assert.match(result.explanation, /^Recommended because /);
  assert.match(result.explanation, /ReactJS/);
  assert.match(result.explanation, /weekends/i);
});

test('rankRecommendations filters expired, ineligible, and already-registered items', () => {
  const expired: Opportunity = { ...baseOpp, id: 'opp-expired', deadline: '2026-10-01' };
  const wrongDept: Opportunity = { ...baseOpp, id: 'opp-mech', departments: ['Mechanical'] };
  const registered: Opportunity = { ...baseOpp, id: 'opp-reg' };
  const savedOnly: Opportunity = { ...baseOpp, id: 'opp-saved' };

  const apps: ApplicationRecord[] = [
    {
      id: 'app-1',
      studentId: 'stu-1',
      organizerId: 'org-1',
      opportunityId: 'opp-reg',
      opportunityTitle: 'Reg',
      organization: 'Org',
      domain: 'Full-Stack Engineering',
      status: 'Applied',
      createdAt: '2026-11-02T00:00:00Z',
      updatedAt: '2026-11-02T00:00:00Z',
    },
    {
      id: 'app-2',
      studentId: 'stu-1',
      organizerId: 'org-1',
      opportunityId: 'opp-saved',
      opportunityTitle: 'Saved',
      organization: 'Org',
      domain: 'Full-Stack Engineering',
      status: 'Saved',
      createdAt: '2026-11-02T00:00:00Z',
      updatedAt: '2026-11-02T00:00:00Z',
    },
  ];

  const ranked = rankRecommendations(
    [baseOpp, expired, wrongDept, registered, savedOnly],
    baseProfile,
    apps,
    [],
    '2026-11-13'
  );
  const ids = ranked.map((r) => r.opportunity.id);
  assert.deepEqual(ids, ['opp-1', 'opp-saved']);
});

test('computeApplicationAnalytics & computeSkillGaps aggregate accurately', () => {
  const apps: ApplicationRecord[] = [
    {
      id: 'a1',
      studentId: 'stu-1',
      organizerId: 'org-1',
      opportunityId: 'opp-1',
      opportunityTitle: 'One',
      organization: 'Atlassian',
      domain: 'Backend',
      status: 'Applied',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    },
    {
      id: 'a2',
      studentId: 'stu-1',
      organizerId: 'org-1',
      opportunityId: 'opp-2',
      opportunityTitle: 'Two',
      organization: 'NVIDIA',
      domain: 'AI & ML',
      status: 'Interview Scheduled',
      createdAt: '2026-11-02T00:00:00Z',
      updatedAt: '2026-11-11T00:00:00Z',
    },
  ];
  const summary = computeApplicationAnalytics(apps);
  assert.equal(summary.totalTracked, 2);
  assert.equal(summary.appliedCount, 2);
  assert.equal(summary.interviewCount, 1);
  assert.equal(summary.conversionRatePct, 50);

  const gaps = computeSkillGaps([baseOpp], baseProfile.skills);
  assert.equal(gaps[0].demandCount, 1);
});
