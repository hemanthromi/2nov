import type { Category, Person, Task } from './types';

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
  return lines.join('\r\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const TEMPLATE_HEADERS = ['No.', 'Section', 'Task / Item', 'Type', 'Qty', 'Owner', 'Deadline', 'Priority', 'Status', 'Notes', 'Tags'];

export function downloadImportTemplate() {
  const example = [
    '1',
    'Venue & Site Layout',
    'Book the venue and confirm capacity',
    'Arrange',
    '1',
    '',
    '2026-11-01',
    'Critical',
    'Not started',
    'Confirm capacity in writing',
    'venue, urgent',
  ];
  downloadCsv('bvp-task-import-template.csv', toCsv(TEMPLATE_HEADERS, [example]));
}

export function exportTasksCsv(checklistName: string, tasks: Task[], categories: Category[], people: Person[]) {
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));
  const personById = new Map(people.map((p) => [p.id, p.name]));

  const rows = tasks.map((t) => [
    t.source_no ?? '',
    categoryById.get(t.category_id) ?? '',
    t.title,
    t.task_type ?? '',
    t.qty ?? '',
    (t.assignees ?? []).map((a) => personById.get(a.person_id) ?? a.person?.name ?? '').filter(Boolean).join('; '),
    t.due_date ?? '',
    t.priority,
    t.status,
    t.notes ?? '',
    (t.tags ?? []).join('; '),
  ]);

  const safeName = checklistName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  downloadCsv(`${safeName || 'checklist'}-tasks.csv`, toCsv(TEMPLATE_HEADERS, rows));
}
