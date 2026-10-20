import { supabase } from './supabase';
import type { ImportRow, Priority, TaskStatus } from './types';

const HEADER_ALIASES: Record<string, keyof ImportRow> = {
  'no': 'no',
  'no.': 'no',
  'number': 'no',
  'section': 'section',
  'category': 'section',
  'task': 'title',
  'task / item': 'title',
  'task/item': 'title',
  'task item': 'title',
  'item': 'title',
  'title': 'title',
  'type': 'type',
  'qty': 'qty',
  'quantity': 'qty',
  'owner': 'owner',
  'assigned to': 'owner',
  'assignee': 'owner',
  'deadline': 'deadline',
  'due date': 'deadline',
  'due': 'deadline',
  'priority': 'priority',
  'status': 'status',
  'notes': 'notes',
  'note': 'notes',
  'tags': 'tags',
  'tag': 'tags',
};

function normalizeHeader(h: string): string {
  return h.toString().trim().toLowerCase();
}

function excelSerialToISO(value: number): string | undefined {
  // Excel epoch: Dec 30 1899
  const ms = Math.round((value - 25569) * 86400 * 1000);
  const d = new Date(ms);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function parseDateCell(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return excelSerialToISO(value);
  const s = String(value).trim();
  if (!s) return undefined;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(s);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return undefined;
}

export async function parseChecklistFile(file: File): Promise<ImportRow[]> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array', cellDates: false });

  const preferredSheet =
    workbook.SheetNames.find((n) => n.toLowerCase().includes('master')) ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[preferredSheet];
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  const rows: ImportRow[] = [];
  for (const rawRow of raw) {
    const mapped: Partial<ImportRow> = {};
    for (const [key, value] of Object.entries(rawRow)) {
      const alias = HEADER_ALIASES[normalizeHeader(key)];
      if (!alias) continue;
      if (value == null || value === '') continue;
      if (alias === 'no') mapped.no = Number(value);
      else if (alias === 'deadline') mapped.deadline = parseDateCell(value);
      else mapped[alias] = String(value).trim();
    }
    if (!mapped.title || !mapped.section) continue;
    rows.push({
      no: mapped.no,
      section: mapped.section,
      title: mapped.title,
      type: mapped.type,
      qty: mapped.qty && mapped.qty !== '-' ? mapped.qty : undefined,
      owner: mapped.owner,
      deadline: mapped.deadline,
      priority: mapped.priority,
      status: mapped.status,
      notes: mapped.notes,
      tags: mapped.tags,
    });
  }
  return rows;
}

const PRIORITY_MAP: Record<string, Priority> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

const STATUS_MAP: Record<string, TaskStatus> = {
  'not started': 'not_started',
  'open': 'open',
  'pending approval': 'pending_approval',
  'undecided': 'undecided',
  'in progress': 'in_progress',
  'confirmed': 'confirmed',
  'blocked': 'blocked',
  'done': 'done',
  'completed': 'done',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
};

export interface ImportPlanItem {
  row: ImportRow;
  action: 'create' | 'update';
  reason: string;
}

export interface ImportPlan {
  items: ImportPlanItem[];
  newCategories: string[];
  skipped: { row: ImportRow; reason: string }[];
}

export function buildImportPlan(
  rows: ImportRow[],
  existingCategoryNames: string[],
  existingBySourceNo: Map<number, string>,
): ImportPlan {
  const existingCatLower = new Set(existingCategoryNames.map((n) => n.toLowerCase()));
  const newCategories: string[] = [];
  const items: ImportPlanItem[] = [];
  const skipped: { row: ImportRow; reason: string }[] = [];

  for (const row of rows) {
    if (!row.title?.trim()) {
      skipped.push({ row, reason: 'Missing title' });
      continue;
    }
    const catLower = row.section.toLowerCase();
    if (!existingCatLower.has(catLower) && !newCategories.some((c) => c.toLowerCase() === catLower)) {
      newCategories.push(row.section);
    }
    if (row.no != null && existingBySourceNo.has(row.no)) {
      items.push({ row, action: 'update', reason: `Matches existing task #${row.no}` });
    } else {
      items.push({ row, action: 'create', reason: row.no != null ? `New task #${row.no}` : 'New task' });
    }
  }

  return { items, newCategories, skipped };
}

export interface ImportResult {
  rowsTotal: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function applyImportPlan(file_name: string, checklistId: string, plan: ImportPlan): Promise<ImportResult> {
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  // 1. ensure categories exist (scoped to this checklist)
  const { data: cats, error: catErr } = await supabase.from('bvp_categories').select('id, name, sort').eq('checklist_id', checklistId);
  if (catErr) throw catErr;
  const categoryByLower = new Map((cats ?? []).map((c) => [c.name.toLowerCase(), c] as const));
  let nextSort = Math.max(0, ...(cats ?? []).map((c) => c.sort)) + 1;

  for (const name of plan.newCategories) {
    if (categoryByLower.has(name.toLowerCase())) continue;
    const { data, error } = await supabase
      .from('bvp_categories')
      .insert({ name, sort: nextSort++, checklist_id: checklistId })
      .select('id, name, sort')
      .single();
    if (error) {
      errors.push(`Category "${name}": ${error.message}`);
      continue;
    }
    categoryByLower.set(name.toLowerCase(), data);
  }

  // 2. ensure people exist for owners
  const { data: peopleRows, error: peopleErr } = await supabase.from('bvp_people').select('id, name');
  if (peopleErr) throw peopleErr;
  const personByLower = new Map((peopleRows ?? []).map((p) => [p.name.toLowerCase(), p.id] as const));

  async function resolvePersonIds(ownerField: string | undefined): Promise<string[]> {
    if (!ownerField) return [];
    const names = ownerField
      .split(/[,/]| and /i)
      .map((n) => n.trim())
      .filter((n) => n && n.toLowerCase() !== 'unassigned');
    const ids: string[] = [];
    for (const name of names) {
      const key = name.toLowerCase();
      let id = personByLower.get(key);
      if (!id) {
        const { data, error } = await supabase
          .from('bvp_people')
          .insert({ name })
          .select('id')
          .single();
        if (error) {
          errors.push(`Person "${name}": ${error.message}`);
          continue;
        }
        id = data.id;
        personByLower.set(key, id);
      }
      ids.push(id);
    }
    return ids;
  }

  // 3. upsert tasks
  for (const item of plan.items) {
    const row = item.row;
    const category = categoryByLower.get(row.section.toLowerCase());
    if (!category) {
      errors.push(`Row "${row.title}": category "${row.section}" could not be created`);
      continue;
    }

    const priority: Priority = (row.priority && PRIORITY_MAP[row.priority.toLowerCase()]) || 'medium';
    const status: TaskStatus = (row.status && STATUS_MAP[row.status.toLowerCase()]) || 'not_started';
    const tags = row.tags
      ? row.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
      : undefined;

    const taskPayload = {
      category_id: category.id,
      source_no: row.no ?? null,
      title: row.title,
      task_type: row.type ?? null,
      qty: row.qty ?? null,
      priority,
      status,
      due_date: row.deadline ?? null,
      notes: row.notes ?? null,
      ...(tags ? { tags } : {}),
    };

    let taskId: string | null = null;

    if (row.no != null) {
      const { data, error } = await supabase
        .from('bvp_tasks')
        .upsert(taskPayload, { onConflict: 'checklist_id,source_no', ignoreDuplicates: false })
        .select('id')
        .single();
      if (error) {
        errors.push(`Row "${row.title}" (#${row.no}): ${error.message}`);
        continue;
      }
      taskId = data.id;
      if (item.action === 'update') updated++;
      else created++;
    } else {
      const { data: existing } = await supabase
        .from('bvp_tasks')
        .select('id')
        .eq('checklist_id', checklistId)
        .eq('category_id', category.id)
        .ilike('title', row.title)
        .is('source_no', null)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('bvp_tasks').update(taskPayload).eq('id', existing.id);
        if (error) {
          errors.push(`Row "${row.title}": ${error.message}`);
          continue;
        }
        taskId = existing.id;
        updated++;
      } else {
        const { data, error } = await supabase.from('bvp_tasks').insert(taskPayload).select('id').single();
        if (error) {
          errors.push(`Row "${row.title}": ${error.message}`);
          continue;
        }
        taskId = data.id;
        created++;
      }
    }

    if (taskId && row.owner) {
      const personIds = await resolvePersonIds(row.owner);
      for (const personId of personIds) {
        await supabase
          .from('bvp_task_assignees')
          .upsert({ task_id: taskId, person_id: personId }, { onConflict: 'task_id,person_id' });
      }
    }
  }

  const result: ImportResult = {
    rowsTotal: plan.items.length + plan.skipped.length,
    created,
    updated,
    skipped: plan.skipped.length,
    errors,
  };

  await supabase.from('bvp_import_log').insert({
    file_name,
    rows_total: result.rowsTotal,
    rows_created: result.created,
    rows_updated: result.updated,
    rows_skipped: result.skipped,
    errors: errors.length ? errors : null,
  });

  return result;
}
