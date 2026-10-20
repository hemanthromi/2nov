import { Link } from 'react-router-dom';
import { useTaskData } from '../lib/useTaskData';
import { useChecklistContext } from '../lib/useChecklistContext';
import { isDone, isOverdue } from '../lib/format';

export default function Dashboard() {
  const { currentChecklistId, currentChecklist, currentEvent, loading: checklistLoading } = useChecklistContext();
  const { categories, tasks, loading, error } = useTaskData(currentChecklistId);

  if (checklistLoading || loading) return <Centered>Loading checklist...</Centered>;
  if (error) return <Centered className="text-out">{error}</Centered>;
  if (!currentChecklistId) {
    return (
      <Centered>
        No checklist yet &mdash; use the switcher in the sidebar to create an event and a checklist.
      </Centered>
    );
  }

  const total = tasks.length;
  const done = tasks.filter((t) => isDone(t.status)).length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const criticalOpen = tasks.filter((t) => t.priority === 'critical' && !isDone(t.status)).length;
  const unassigned = tasks.filter((t) => !t.assignees || t.assignees.length === 0).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-3.5 py-5 md:px-7 md:py-7">
      <div>
        <h1>{currentChecklist?.name ?? 'Checklist overview'}</h1>
        <p className="page-sub">
          {currentEvent?.name} &middot; {total} tasks across {categories.length} categories
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Done" value={done} foot={`of ${total} tasks`} tone="in" />
        <Stat label="Overdue" value={overdue} foot={`of ${total} tasks`} tone="out" />
        <Stat label="Critical open" value={criticalOpen} foot={`of ${total} tasks`} tone="amber" />
        <Stat label="Unassigned" value={unassigned} foot={`of ${total} tasks`} />
      </div>

      <div className="panel">
        <div className="panelhead">
          <span className="panel-title">Categories</span>
        </div>
        {categories.map((cat) => {
          const catTasks = tasks.filter((t) => t.category_id === cat.id);
          const catDone = catTasks.filter((t) => isDone(t.status)).length;
          const pct = catTasks.length ? Math.round((catDone / catTasks.length) * 100) : 0;
          return (
            <Link key={cat.id} to={`/tasks?category=${cat.id}`} className="row items-center hover:bg-hover">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">{cat.name}</p>
                <div className="mt-1.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="shrink-0 text-[13.5px] font-medium tabular-nums text-muted">
                {catDone}/{catTasks.length}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Centered({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex min-h-[50vh] items-center justify-center text-[14.5px] text-muted ${className}`}>{children}</div>;
}

function Stat({ label, value, foot, tone }: { label: string; value: number; foot: string; tone?: 'in' | 'out' | 'amber' }) {
  const valueClass = tone === 'in' ? 'text-in' : tone === 'out' ? 'text-out' : tone === 'amber' ? 'text-amber-ink' : 'text-ink';
  return (
    <div className="stat-tile">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${valueClass}`}>{value}</p>
      <p className="stat-foot">{foot}</p>
    </div>
  );
}
