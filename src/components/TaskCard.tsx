import type { Task } from '../lib/types';
import { PRIORITY_LABELS, STATUS_LABELS } from '../lib/types';
import { formatDate, isDone, isOverdue } from '../lib/format';
import { PRIORITY_TAG, STATUS_TAG } from '../lib/taskStyles';

interface Props {
  task: Task;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  canEdit: boolean;
}

export default function TaskCard({ task, selected, onToggleSelect, onOpen, canEdit }: Props) {
  const overdue = isOverdue(task.due_date, task.status);
  const done = isDone(task.status);
  const cancelled = task.status === 'cancelled';
  const assignees = task.assignees ?? [];
  const assigneeNames = assignees.map((a) => a.person?.name).filter(Boolean) as string[];

  return (
    <div
      className={`panel relative flex h-full flex-col gap-2 p-3.5 ${cancelled ? 'border-l-2 border-l-out' : ''} ${
        selected ? 'ring-2 ring-teal' : ''
      }`}
    >
      {canEdit && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-3 h-4 w-4 accent-[var(--teal)]"
        />
      )}
      <button onClick={onOpen} className="flex flex-1 flex-col gap-2 pr-6 text-left">
        <p className={`row-title ${done ? 'text-muted line-through opacity-70' : ''}`}>
          {task.source_no != null && <span className="mr-1.5 font-normal text-muted">#{task.source_no}</span>}
          {task.title}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className={PRIORITY_TAG[task.priority]}>{PRIORITY_LABELS[task.priority]}</span>
          <span className={STATUS_TAG[task.status]}>{STATUS_LABELS[task.status]}</span>
          {overdue && <span className="tag error">Overdue</span>}
          {task.tags.map((t) => (
            <span key={t} className="tag muted">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-auto space-y-0.5 text-[13.5px] text-muted">
          {task.task_type && <p>{task.task_type}{task.qty ? ` · Qty ${task.qty}` : ''}</p>}
          {task.due_date && <p>Due {formatDate(task.due_date)}</p>}
          {assigneeNames.length > 0 && <p className="truncate text-teal">{assigneeNames.join(', ')}</p>}
        </div>
      </button>
    </div>
  );
}
