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

export default function TaskRow({ task, selected, onToggleSelect, onOpen, canEdit }: Props) {
  const overdue = isOverdue(task.due_date, task.status);
  const done = isDone(task.status);
  const cancelled = task.status === 'cancelled';
  const assignees = task.assignees ?? [];
  const assigneeNames = assignees.map((a) => a.person?.name).filter(Boolean) as string[];

  const metaBits = [
    task.task_type,
    task.qty ? `Qty ${task.qty}` : null,
    task.due_date ? `Due ${formatDate(task.due_date)}` : null,
    assigneeNames.length ? (assigneeNames.length <= 2 ? assigneeNames.join(', ') : `${assigneeNames[0]} +${assigneeNames.length - 1}`) : null,
  ].filter(Boolean);

  return (
    <div className={`row items-start ${cancelled ? 'border-l-2 border-l-out' : ''}`}>
      {canEdit && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--teal)]"
        />
      )}
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className={`row-title truncate ${done ? 'text-muted line-through opacity-70' : ''}`}>
          {task.source_no != null && <span className="mr-1.5 font-normal text-muted">#{task.source_no}</span>}
          {task.title}
        </p>
        <div className="row-meta mt-1 truncate">{metaBits.join(' · ') || '—'}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className={PRIORITY_TAG[task.priority]}>{PRIORITY_LABELS[task.priority]}</span>
          <span className={STATUS_TAG[task.status]}>{STATUS_LABELS[task.status]}</span>
          {overdue && <span className="tag error">Overdue</span>}
          {task.tags.map((t) => (
            <span key={t} className="tag muted">
              {t}
            </span>
          ))}
        </div>
      </button>
    </div>
  );
}
