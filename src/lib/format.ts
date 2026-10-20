import type { Priority, TaskStatus } from './types';

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate) return false;
  if (status === 'done' || status === 'cancelled') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function isDone(status: TaskStatus): boolean {
  return status === 'done' || status === 'confirmed';
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export const PRIORITY_CLASSES: Record<Priority, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

export const STATUS_CLASSES: Record<TaskStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  open: 'bg-sky-100 text-sky-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  undecided: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-brand-100 text-brand-700',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-brand-100 text-brand-700',
  cancelled: 'bg-slate-200 text-slate-500 line-through',
};
