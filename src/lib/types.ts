export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus =
  | 'not_started'
  | 'open'
  | 'pending_approval'
  | 'undecided'
  | 'in_progress'
  | 'confirmed'
  | 'blocked'
  | 'done'
  | 'cancelled';

export const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

export const STATUSES: TaskStatus[] = [
  'not_started',
  'open',
  'pending_approval',
  'undecided',
  'in_progress',
  'confirmed',
  'blocked',
  'done',
  'cancelled',
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not started',
  open: 'Open',
  pending_approval: 'Pending approval',
  undecided: 'Undecided',
  in_progress: 'In progress',
  confirmed: 'Confirmed',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export interface Category {
  id: string;
  name: string;
  sort: number;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  profile_id: string | null;
  active: boolean;
  created_at: string;
}

export interface TaskAssignee {
  task_id: string;
  person_id: string;
  assigned_at: string;
  person?: Person;
}

export interface Task {
  id: string;
  category_id: string;
  source_no: number | null;
  title: string;
  task_type: string | null;
  qty: string | null;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
  notes: string | null;
  sort: number;
  created_at: string;
  updated_at: string;
  assignees?: TaskAssignee[];
}

export interface ImportRow {
  no?: number;
  section: string;
  title: string;
  type?: string;
  qty?: string;
  owner?: string;
  deadline?: string;
  priority?: string;
  status?: string;
  notes?: string;
}
