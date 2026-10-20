import type { Task } from './types';

export const PRIORITY_TAG: Record<Task['priority'], string> = {
  critical: 'tag error',
  high: 'tag warn',
  medium: 'tag teal',
  low: 'tag muted',
};

export const STATUS_TAG: Record<Task['status'], string> = {
  not_started: 'tag muted',
  open: 'tag teal',
  pending_approval: 'tag warn',
  undecided: 'tag warn',
  in_progress: 'tag teal',
  confirmed: 'tag success',
  blocked: 'tag error',
  done: 'tag success',
  cancelled: 'tag error',
};
