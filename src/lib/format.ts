import type { TaskStatus } from './types';

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
