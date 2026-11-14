import type {
  ApplicationRecord,
  EngagementEvent,
  Opportunity,
  RecommendationBreakdown,
  RecommendationResult,
  StudentProfile,
} from '../types/ncet';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'are', 'you',
  'will', 'have', 'has', 'our', 'all', 'not', 'but', 'can', 'use', 'using', 'via',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

export function buildTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
}

export function cosineSimilarity(aText: string, bText: string): number {
  const tfA = buildTermFrequency(tokenize(aText));
  const tfB = buildTermFrequency(tokenize(bText));
  if (tfA.size === 0 || tfB.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, countA] of tfA.entries()) {
    normA += countA * countA;
    const countB = tfB.get(term);
    if (countB) dot += countA * countB;
  }
  for (const countB of tfB.values()) {
    normB += countB * countB;
  }

  if (normA === 0 || normB === 0) return 0;
  return Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB)));
}

export function isEligibleOpportunity(
  opportunity: Opportunity,
  profile: StudentProfile,
  registeredOpportunityIds: Set<string>,
  referenceDateIso: string
): boolean {
  if (opportunity.status !== 'published') return false;
  if (registeredOpportunityIds.has(opportunity.id)) return false;

  const deadlineDate = opportunity.deadline.slice(0, 10);
  const refDate = referenceDateIso.slice(0, 10);
  if (deadlineDate < refDate) return false;

  if (
    opportunity.departments.length > 0 &&
    !opportunity.departments.includes('All Departments') &&
    !opportunity.departments.includes(profile.department)
  ) {
    return false;
  }

  if (
    opportunity.eligibleYears.length > 0 &&
    !opportunity.eligibleYears.includes('All Years') &&
    !opportunity.eligibleYears.includes(profile.year)
  ) {
    return false;
  }

  return true;
}

export function scoreOpportunity(
  opportunity: Opportunity,
  profile: StudentProfile,
  events: EngagementEvent[]
): RecommendationResult {
  const profileCorpus = [
    profile.department,
    ...profile.skills,
    ...profile.interests,
    ...profile.careerGoals,
    profile.bio,
  ].join(' ');

  const oppCorpus = [
    opportunity.title,
    opportunity.organization,
    opportunity.type,
    opportunity.domain,
    opportunity.industry,
    ...opportunity.tags,
    opportunity.goalMatch,
    opportunity.description,
  ].join(' ');

  // 1. 0.35 * semantic match
  const rawSim = cosineSimilarity(profileCorpus, oppCorpus);
  const semanticMatch = Math.min(1, Math.max(0.15, rawSim * 1.8));

  // 2. 0.25 * skill/interest overlap
  const profileTerms = new Set(
    [...profile.skills, ...profile.interests].map((s) => s.toLowerCase())
  );
  const oppTerms = [...opportunity.tags, opportunity.domain, opportunity.industry].map((t) =>
    t.toLowerCase()
  );
  const matchedTags = opportunity.tags.filter((tag) =>
    profileTerms.has(tag.toLowerCase())
  );
  const overlapRatio =
    oppTerms.length > 0
      ? oppTerms.filter((term) => profileTerms.has(term)).length / Math.min(4, oppTerms.length)
      : 0;
  const skillInterestOverlap = Math.min(1, overlapRatio);

  // 3. 0.15 * availability fit
  const slotLower = opportunity.availabilitySlot.toLowerCase();
  const matchedAvailability = profile.availability.find((slot) =>
    slotLower.includes(slot.toLowerCase()) || slot.toLowerCase().includes(slotLower)
  );
  const availabilityFit = matchedAvailability
    ? 1
    : slotLower.includes('flexible') || opportunity.mode === 'Remote'
    ? 0.75
    : 0.35;

  // 4. 0.15 * goal alignment
  const goalCorpus = profile.careerGoals.join(' ').toLowerCase();
  const goalMatchLower = opportunity.goalMatch.toLowerCase();
  const goalAlignment =
    goalCorpus.includes(goalMatchLower) ||
    profile.careerGoals.some((g) => cosineSimilarity(g, opportunity.goalMatch + ' ' + opportunity.title) > 0.2)
      ? 0.95
      : 0.4;

  // 5. 0.10 * engagement history
  const domainEvents = events.filter(
    (e) => e.domain.toLowerCase() === opportunity.domain.toLowerCase()
  );
  const weightedEvents = domainEvents.reduce((acc, ev) => {
    if (ev.eventType === 'register') return acc + 3;
    if (ev.eventType === 'save') return acc + 2;
    if (ev.eventType === 'share') return acc + 1.5;
    return acc + 1;
  }, 0);
  const engagementHistory = Math.min(1, weightedEvents / 6);

  const totalScore =
    0.35 * semanticMatch +
    0.25 * skillInterestOverlap +
    0.15 * availabilityFit +
    0.15 * goalAlignment +
    0.10 * engagementHistory;

  const breakdown: RecommendationBreakdown = {
    semanticMatch: Number(semanticMatch.toFixed(2)),
    skillInterestOverlap: Number(skillInterestOverlap.toFixed(2)),
    availabilityFit: Number(availabilityFit.toFixed(2)),
    goalAlignment: Number(goalAlignment.toFixed(2)),
    engagementHistory: Number(engagementHistory.toFixed(2)),
    totalScore: Number(totalScore.toFixed(3)),
  };

  const reasons: string[] = [];
  if (matchedTags.length > 0) {
    reasons.push(`you have skills in ${matchedTags.slice(0, 2).join(' & ')}`);
  } else {
    reasons.push(`it aligns semantically with your ${profile.department} profile`);
  }

  if (matchedAvailability) {
    reasons.push(`you are available on ${matchedAvailability.toLowerCase()}`);
  } else if (opportunity.mode === 'Remote') {
    reasons.push(`it offers flexible remote participation`);
  }

  if (goalAlignment >= 0.8 && opportunity.goalMatch) {
    reasons.push(`this ${opportunity.type.toLowerCase()} supports your ${opportunity.goalMatch} goal`);
  } else if (engagementHistory >= 0.5) {
    reasons.push(`you actively explore ${opportunity.domain} postings`);
  } else {
    reasons.push(`this ${opportunity.type.toLowerCase()} fits ${opportunity.domain}`);
  }

  const explanation = `Recommended because ${reasons.slice(0, 3).join(', and ').replace(/, and ([^,]*)$/, ', and $1')}.`;

  return {
    opportunity,
    breakdown,
    explanation,
  };
}

export function rankRecommendations(
  opportunities: Opportunity[],
  profile: StudentProfile,
  applications: ApplicationRecord[],
  events: EngagementEvent[],
  referenceDateIso: string
): RecommendationResult[] {
  const registeredIds = new Set(
    applications
      .filter((a) => a.status !== 'Saved')
      .map((a) => a.opportunityId)
  );

  return opportunities
    .filter((opp) => isEligibleOpportunity(opp, profile, registeredIds, referenceDateIso))
    .map((opp) => scoreOpportunity(opp, profile, events))
    .sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);
}

export interface AnalyticsSummary {
  totalTracked: number;
  appliedCount: number;
  interviewCount: number;
  offerCount: number;
  conversionRatePct: number;
  byDomain: Array<{ domain: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

export function filterApplicationsByDateRange(
  applications: ApplicationRecord[],
  days: number,
  referenceDateIso: string
): ApplicationRecord[] {
  const refMs = new Date(referenceDateIso).getTime();
  const cutoffMs = refMs - days * 24 * 60 * 60 * 1000;
  return applications.filter((app) => new Date(app.updatedAt).getTime() >= cutoffMs);
}

export function computeApplicationAnalytics(applications: ApplicationRecord[]): AnalyticsSummary {
  const totalTracked = applications.length;
  const appliedCount = applications.filter((a) => a.status !== 'Saved').length;
  const interviewCount = applications.filter(
    (a) => a.status === 'Interview Scheduled' || a.status === 'Offer' || a.status === 'Completed'
  ).length;
  const offerCount = applications.filter((a) => a.status === 'Offer' || a.status === 'Completed').length;
  const conversionRatePct =
    appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0;

  const domainMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  for (const app of applications) {
    domainMap.set(app.domain, (domainMap.get(app.domain) ?? 0) + 1);
    statusMap.set(app.status, (statusMap.get(app.status) ?? 0) + 1);
  }

  return {
    totalTracked,
    appliedCount,
    interviewCount,
    offerCount,
    conversionRatePct,
    byDomain: Array.from(domainMap.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count),
    byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
  };
}

export function computeSkillGaps(
  opportunities: Opportunity[],
  studentSkills: string[]
): Array<{ skill: string; demandCount: number; studentCoveragePct: number }> {
  const demand = new Map<string, number>();
  for (const opp of opportunities) {
    if (opp.status !== 'published') continue;
    for (const tag of opp.tags) {
      demand.set(tag, (demand.get(tag) ?? 0) + 1);
    }
  }
  const normalizedSkills = new Set(studentSkills.map((s) => s.toLowerCase()));
  return Array.from(demand.entries())
    .map(([skill, demandCount]) => ({
      skill,
      demandCount,
      studentCoveragePct: normalizedSkills.has(skill.toLowerCase()) ? 84 : 28,
    }))
    .sort((a, b) => b.demandCount - a.demandCount)
    .slice(0, 7);
}
