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

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
      {canEdit && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
        />
      )}
      <button onClick={onOpen} className="flex-1 text-left">
        <p className="text-sm font-medium text-slate-800">
          {task.source_no != null && <span className="mr-1.5 text-slate-400">#{task.source_no}</span>}
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_CLASSES[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASSES[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
          {task.task_type && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{task.task_type}</span>
          )}
          {task.due_date && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${overdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
              Due {formatDate(task.due_date)}
            </span>
          )}
          {assignees.length > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-700">
              {assignees.map((a) => a.person?.name).filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
