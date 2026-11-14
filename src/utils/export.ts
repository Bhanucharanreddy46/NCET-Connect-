import type { ApplicationRecord } from '../types/ncet';

function escapeCsvCell(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

export function generateApplicationsCsv(applications: ApplicationRecord[]): string {
  const headers = [
    'ID',
    'Opportunity',
    'Organization',
    'Domain',
    'Status',
    'Interview Scheduled',
    'Updated At',
    'Notes',
  ];
  const rows = applications.map((app) =>
    [
      app.id,
      app.opportunityTitle,
      app.organization,
      app.domain,
      app.status,
      app.interviewAt ?? '—',
      app.updatedAt,
      app.notes ?? '',
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function generateAnalyticsPdfBytes(
  studentName: string,
  department: string,
  applications: ApplicationRecord[]
): Uint8Array {
  const lines = [
    `NCET CONNECT - Student Activity & Application Report`,
    `Student: ${studentName} (${department})`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    `Total Tracked Opportunities: ${applications.length}`,
    `------------------------------------------------------------`,
    ...applications.slice(0, 22).map((app, i) => {
      const idx = String(i + 1).padStart(2, '0');
      const title = app.opportunityTitle.slice(0, 42);
      const line = `${idx}. ${title} | ${app.organization} | ${app.status}`;
      return line;
    }),
  ];

  const streamLines = [
    'BT',
    '/F1 11 Tf',
    '48 750 Td',
    '16 TL',
    ...lines.map((line, i) =>
      i === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`
    ),
    'ET',
  ].join('\n');

  const objects: string[] = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${streamLines.length} >>\nstream\n${streamLines}\nendstream\nendobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export function triggerFileDownload(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
