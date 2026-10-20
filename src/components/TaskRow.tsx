import type { Task } from '../lib/types';
import { PRIORITY_LABELS, STATUS_LABELS } from '../lib/types';
import { PRIORITY_CLASSES, STATUS_CLASSES, formatDate, isOverdue } from '../lib/format';

interface Props {
  task: Task;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  canEdit: boolean;
}

export default function TaskRow({ task, selected, onToggleSelect, onOpen, canEdit }: Props) {
  const overdue = isOverdue(task.due_date, task.status);
  const assignees = task.assignees ?? [];
  const assigneeNames = assignees.map((a) => a.person?.name).filter(Boolean) as string[];
  const assigneeSummary =
    assigneeNames.length === 0
      ? null
      : assigneeNames.length <= 2
        ? assigneeNames.join(', ')
        : `${assigneeNames[0]} +${assigneeNames.length - 1}`;

  const metaBits = [task.task_type, task.qty ? `Qty ${task.qty}` : null].filter(Boolean).join(' · ');

  return (
    <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50">
      {canEdit && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
        />
      )}
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-slate-800">
          {task.source_no != null && <span className="mr-1.5 text-slate-400">#{task.source_no}</span>}
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_CLASSES[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASSES[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
          {metaBits && <span className="truncate">{metaBits}</span>}
          {task.due_date && (
            <span className={overdue ? 'font-medium text-red-600' : ''}>Due {formatDate(task.due_date)}</span>
          )}
          {assigneeSummary && <span className="truncate text-indigo-600">{assigneeSummary}</span>}
        </div>
      </button>
    </div>
  );
}
