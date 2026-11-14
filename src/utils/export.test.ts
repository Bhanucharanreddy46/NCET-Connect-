import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAnalyticsPdfBytes, generateApplicationsCsv } from './export';
import type { ApplicationRecord } from '../types/ncet';

const sampleApps: ApplicationRecord[] = [
  {
    id: 'app-1',
    studentId: 'stu-1',
    organizerId: 'org-1',
    opportunityId: 'opp-1',
    opportunityTitle: 'Atlassian Cloud SDE Intern',
    organization: 'Atlassian',
    domain: 'Cloud & Backend',
    status: 'Interview Scheduled',
    interviewAt: '2026-11-18T11:00',
    notes: 'Round 1 System Design',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
  },
];

test('generateApplicationsCsv formats header and rows safely', () => {
  const csv = generateApplicationsCsv(sampleApps);
  assert.match(csv, /^ID,Opportunity,Organization/);
  assert.match(csv, /"Atlassian Cloud SDE Intern"/);
  assert.match(csv, /"Interview Scheduled"/);
});

test('generateAnalyticsPdfBytes emits valid PDF header and EOF trailer', () => {
  const bytes = generateAnalyticsPdfBytes('Priya Nair', 'CSE', sampleApps);
  const decoded = new TextDecoder().decode(bytes);
  assert.ok(decoded.startsWith('%PDF-1.4'));
  assert.ok(decoded.includes('NCET CONNECT'));
  assert.ok(decoded.endsWith('%%EOF'));
});
