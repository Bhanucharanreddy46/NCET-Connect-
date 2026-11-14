# NCET Connect — Recommendation Engine Specification

**Document:** `docs/RECOMMENDER.md`  
**Version:** 2.1  
**Author:** Google DeepMind / NCET Engineering Team  
**Module:** `src/utils/recommender.ts` & `src/hooks/useNcetStore.ts`  

---

## 1. Overview

The NCET Connect Recommendation Engine matches students with campus and external tech opportunities (internships, hackathons, workshops, research projects, meetups) based on a **transparent, multi-objective scoring formula**.

Every recommendation is explainable: the system shows the exact breakdown and human-readable reasons why the item was suggested.

---

## 2. Multi-Objective Scoring Formula

For any candidate opportunity $O$ and student profile $S$:

$$\text{TotalScore} = 0.35 \cdot S_{\text{semantic}} + 0.25 \cdot S_{\text{skills}} + 0.15 \cdot S_{\text{availability}} + 0.15 \cdot S_{\text{goals}} + 0.10 \cdot S_{\text{engagement}}$$

### Objective Breakdown

| Component | Weight | Calculation Method | Description |
|-----------|--------|--------------------|-------------|
| **Semantic Match** ($S_{\text{semantic}}$) | **35%** | Cosine similarity between tokenized corpus of profile (bio, dept, interests) and opportunity (title, desc, domain, tags). Scaled by 1.8 with 0.15 floor. | Captures conceptual and contextual relevance beyond keyword matching. |
| **Skill & Interest Overlap** ($S_{\text{skills}}$) | **25%** | Jaccard / Overlap ratio between student skills/interests and opportunity required tags. | Measures immediate technical readiness. |
| **Availability Fit** ($S_{\text{availability}}$) | **15%** | Match between opportunity slot (`Weekends`, `Evenings`, `Summer`) and student availability. Remote mode defaults to $0.75$. | Ensures student has time to participate. |
| **Career Goal Alignment** ($S_{\text{goals}}$) | **15%** | Substring and semantic cosine match between student's stated ambitions and opportunity `goalMatch`. | Aligns with long-term aspirations (e.g. "Product Engineering Internship"). |
| **Engagement History** ($S_{\text{engagement}}$) | **10%** | Weighted history of domain interactions (Register = +3, Save = +2, Share = +1.5, Click = +1). Normalized to max 6 points. | Adapts to student's implicit browsing patterns. |

---

## 3. Eligibility Hard Filters

Before scoring, an opportunity must pass all hard eligibility checks:
1. **Status Check:** Opportunity status must be `published`.
2. **Registration Check:** Student has not already registered or applied.
3. **Deadline Check:** $\text{DeadlineDate} \ge \text{CurrentDate}$.
4. **Department Check:** Opportunity must include student's branch (e.g. `CSE`, `AIML`, `ISE`) or `All Departments`.
5. **Academic Year Check:** Opportunity must include student's year (e.g. `3rd Year`) or `All Years`.

---

## 4. Explainability & "Why" Generation

The engine constructs human-readable explanations using the top-contributing factors:

```typescript
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
}
```

**Example Output:**
> *"Recommended because you have skills in ReactJS & TypeScript, you are available on weekends, and this workshop supports your Product Engineering Internship goal."*

---

## 5. Peer Synergy Matching (Campus Circles)

In anonymous Campus Circles, matching between peers uses a complementary synergy formula:

$$\text{ProfileScore} = 0.30 \cdot \text{InterestOverlap} + 0.25 \cdot \text{SkillComplement} + 0.20 \cdot \text{IntentMatch} + 0.15 \cdot \text{AvailabilityMatch} + 0.10 \cdot \text{ActivityScore}$$

- **Interest Overlap (30%):** Shared passions (e.g., AI/ML, Web3, Hackathons).
- **Skill Complement (25%):** Complementary roles (e.g., Frontend + ML or Hardware + Software).
- **Intent Match (20%):** Matching purpose (Hackathon teammate, Project partner, Study group).
- **Availability Match (15%):** Mutual free slots (e.g., Weekend sprints).
- **Activity Score (10%):** Campus community participation score.
