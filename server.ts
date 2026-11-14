import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Rate limiting state in API Gateway
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_MIN = 120;

function apiGatewayRateLimiter(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith('/api/')) return next();
  const key = req.ip || 'local';
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (bucket.count >= MAX_REQUESTS_PER_MIN) {
    res.status(429).json({ error: 'API Gateway rate limit exceeded. Please wait a minute.' });
    return;
  }
  bucket.count += 1;
  next();
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(apiGatewayRateLimiter);

  // Health & Gateway Status
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'ncet-connect-gateway',
      geminiConfigured: Boolean(getGenAIClient()),
      timestamp: new Date().toISOString(),
    });
  });

  // Low-Latency Recommender Explanation Polish & Instant Brief (gemini-3.1-flash-lite)
  app.post('/api/recommender/polish', async (req, res) => {
    const { studentName, department, skills, opportunityTitle, organization, rawExplanation } =
      req.body ?? {};
    if (!opportunityTitle || !rawExplanation) {
      res.status(400).json({ error: 'opportunityTitle and rawExplanation are required.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.json({
        polishedExplanation: rawExplanation,
        tldr: `${opportunityTitle} at ${organization || 'Partner'} matches your ${department || 'engineering'} track.`,
        modelUsed: 'template-fallback',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Polish this single-sentence campus recommendation explanation into crisp, encouraging natural prose (max 28 words, no hype, keep facts accurate) and give a 1-sentence prep tip.
Student: ${studentName || 'NCET Student'} (${department || 'CSE'}), Skills: ${(skills || []).join(', ')}
Opportunity: ${opportunityTitle} by ${organization || 'Partner'}
Base factual reason: ${rawExplanation}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              polishedExplanation: { type: Type.STRING },
              tldr: { type: Type.STRING },
            },
          },
        },
      });
      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        polishedExplanation: parsed.polishedExplanation || rawExplanation,
        tldr: parsed.tldr || `Focus on ${(skills || []).slice(0, 2).join(' and ')} fundamentals.`,
        modelUsed: 'gemini-3.1-flash-lite',
      });
    } catch (err) {
      console.error('Polish error:', err);
      res.json({
        polishedExplanation: rawExplanation,
        tldr: `Prepare portfolio examples highlighting ${(skills || []).slice(0, 2).join(' and ')}.`,
        modelUsed: 'template-fallback',
      });
    }
  });

  // High-Thinking Career Strategist & Skill-Gap Analysis (gemini-4-carbon with ThinkingLevel.HIGH, fallback to gemini-4-hydrogen)
  app.post('/api/advisor/analyze', async (req, res) => {
    const { profile, targetGoal, marketSkillGaps, question } = req.body ?? {};
    if (!profile || !question) {
      res.status(400).json({ error: 'profile and question are required.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.json({
        strategy: `For your ${targetGoal || 'Product Engineering'} goal in ${profile.department || 'CSE'} (${profile.year || '3rd Year'}), prioritize closing high-demand campus skill gaps in PostgreSQL/pgvector and system design while shipping two measurable ReactJS + TypeScript projects before December placement drives.`,
        actionPlan: [
          'Ship a deployed full-stack project demonstrating TypeScript, PostgreSQL indexing, and clean API contracts.',
          'Complete 2 timed system design & DSA mock interviews before your scheduled recruiter screen.',
          'Join the GDG Weekend Workshop and NCET Buildathon to turn weekend availability into verified peer proof.',
        ],
        modelUsed: 'deterministic-strategist',
      });
      return;
    }

    const prompt = `You are the NCET CONNECT Academic & Career Strategist.
Analyze this student's profile, campus skill-gap demand, and question to produce a concrete, actionable technical roadmap.
Student: ${profile.displayName}, ${profile.department}, ${profile.year}
Skills: ${(profile.skills || []).join(', ')}
Interests: ${(profile.interests || []).join(', ')}
Availability: ${(profile.availability || []).join(', ')}
Career Goals: ${(profile.careerGoals || []).join(', ')}
Target Goal: ${targetGoal || 'Internship & Placement Readiness'}
Top Campus Skill Gaps: ${JSON.stringify(marketSkillGaps || [])}
Question: ${question}`;

    const attemptModel = async (modelName: string) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategy: { type: Type.STRING },
              actionPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });
      return JSON.parse((response.text ?? '{}').trim());
    };

    try {
      let result: { strategy?: string; actionPlan?: string[] };
      let modelUsed = 'gemini-4-carbon';
      try {
        result = await attemptModel('gemini-4-carbon');
      } catch {
        // Graceful fallback if billing-enabled key is not attached for gemini-4-carbon
        modelUsed = 'gemini-4-hydrogen';
        result = await attemptModel('gemini-4-hydrogen');
      }
      res.json({
        strategy: result.strategy || 'Focus on building verifiable end-to-end projects aligned with recruiter tags.',
        actionPlan: Array.isArray(result.actionPlan) ? result.actionPlan : [],
        modelUsed,
      });
    } catch (err) {
      console.error('Advisor error:', err);
      res.status(502).json({
        error: 'Unable to complete AI strategy analysis right now. Check GEMINI_API_KEY configuration.',
      });
    }
  });

  // Ingestion Pipeline Normalizer & Auto-Tagger (gemini-3.1-flash-lite with keyword fallback)
  app.post('/api/opportunities/ingest', async (req, res) => {
    const { rawText, sourceGroup, sourceName } = req.body ?? {};
    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ error: 'rawText is required.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      const lower = rawText.toLowerCase();
      const type = lower.includes('intern')
        ? 'Internship'
        : lower.includes('hack')
        ? 'Hackathon'
        : lower.includes('meetup')
        ? 'Meetup'
        : 'Workshop';
      const tags = ['ReactJS', 'TypeScript', 'Python', 'PostgreSQL', 'AI', 'Cloud'].filter((t) =>
        lower.includes(t.toLowerCase())
      );
      res.json({
        normalized: {
          title: rawText.slice(0, 72).trim(),
          organization: sourceName || 'External Partner',
          type,
          domain: lower.includes('ai') || lower.includes('ml') ? 'AI & ML' : 'Full-Stack Engineering',
          industry: 'Developer Tools',
          mode: lower.includes('remote') ? 'Remote' : 'Hybrid',
          departments: ['CSE', 'ISE', 'AI & ML'],
          eligibleYears: ['3rd Year', '4th Year'],
          tags: tags.length ? tags : ['Software Engineering'],
          availabilitySlot: lower.includes('weekend') ? 'Weekends' : 'Flexible',
          goalMatch: 'Product Engineering Internship',
          deadline: '2026-12-22',
          sourceGroup: sourceGroup || 'Community',
          sourceName: sourceName || 'RSS Feed',
          description: rawText.slice(0, 500),
          stipendOrPrize: 'See listing details',
        },
        modelUsed: 'keyword-classifier',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Normalize and auto-tag this raw college/career/community opportunity text into the unified NCET CONNECT JSON schema.
Source Group: ${sourceGroup || 'Community'}, Source Name: ${sourceName || 'Luma'}
Raw Text: ${rawText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              organization: { type: Type.STRING },
              type: { type: Type.STRING },
              domain: { type: Type.STRING },
              industry: { type: Type.STRING },
              mode: { type: Type.STRING },
              departments: { type: Type.ARRAY, items: { type: Type.STRING } },
              eligibleYears: { type: Type.ARRAY, items: { type: Type.STRING } },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              availabilitySlot: { type: Type.STRING },
              goalMatch: { type: Type.STRING },
              deadline: { type: Type.STRING },
              description: { type: Type.STRING },
              stipendOrPrize: { type: Type.STRING },
            },
          },
        },
      });
      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        normalized: {
          ...parsed,
          sourceGroup: sourceGroup || 'Community',
          sourceName: sourceName || 'Luma / RSS',
        },
        modelUsed: 'gemini-3.1-flash-lite',
      });
    } catch (err) {
      console.error('Ingest normalize error:', err);
      res.status(500).json({ error: 'Failed to normalize opportunity payload.' });
    }
  });

  // Automated Email Digest & Reminder Generator
  app.post('/api/reminders/digest', async (req, res) => {
    const { studentName, email, applications, upcomingOpportunities } = req.body ?? {};
    const interviews = (applications || []).filter((a: { status: string }) => a.status === 'Interview Scheduled');
    const subject = `NCET CONNECT Weekly Digest for ${studentName || 'Student'} (${interviews.length} upcoming interview${interviews.length === 1 ? '' : 's'})`;
    const body = [
      `Hello ${studentName || 'Student'},`,
      '',
      `Upcoming Scheduled Interviews (${interviews.length}):`,
      ...interviews.map(
        (i: { opportunityTitle: string; organization: string; interviewAt?: string }) =>
          `- ${i.opportunityTitle} at ${i.organization} (${i.interviewAt || 'TBD'})`
      ),
      '',
      `Top Recommended Deadlines Approaching (${(upcomingOpportunities || []).length}):`,
      ...(upcomingOpportunities || []).slice(0, 3).map(
        (o: { title: string; deadline: string }) => `- ${o.title} (Closes ${o.deadline})`
      ),
    ].join('\n');

    res.json({
      queued: true,
      recipient: email || 'student@ncet.edu',
      subject,
      preview: body,
      dispatchedAt: new Date().toISOString(),
    });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NCET CONNECT gateway listening on http://localhost:${PORT}`);
  });
}

void startServer();
