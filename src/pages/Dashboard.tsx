import { Link } from 'react-router-dom';
import { useTaskData } from '../lib/useTaskData';
import { isDone, isOverdue } from '../lib/format';

export default function Dashboard() {
  const { categories, tasks, loading, error } = useTaskData();

  if (loading) return <Centered>Loading checklist...</Centered>;
  if (error) return <Centered className="text-red-600">{error}</Centered>;

  const total = tasks.length;
  const done = tasks.filter((t) => isDone(t.status)).length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const criticalOpen = tasks.filter((t) => t.priority === 'critical' && !isDone(t.status)).length;
  const unassigned = tasks.filter((t) => !t.assignees || t.assignees.length === 0).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Event checklist overview</h1>
        <p className="text-sm text-slate-500">RLD Matrushakti BVP event &middot; {total} tasks across {categories.length} categories</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Done" value={done} total={total} tone="brand" />
        <Stat label="Overdue" value={overdue} total={total} tone="red" />
        <Stat label="Critical open" value={criticalOpen} total={total} tone="orange" />
        <Stat label="Unassigned" value={unassigned} total={total} tone="slate" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Categories</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {categories.map((cat) => {
            const catTasks = tasks.filter((t) => t.category_id === cat.id);
            const catDone = catTasks.filter((t) => isDone(t.status)).length;
            const pct = catTasks.length ? Math.round((catDone / catTasks.length) * 100) : 0;
            return (
              <li key={cat.id}>
                <Link
                  to={`/tasks?category=${cat.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{cat.name}</p>
                    <div className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    {catDone}/{catTasks.length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Centered({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex min-h-[50vh] items-center justify-center text-sm ${className}`}>{children}</div>;
}

const TONE_CLASSES: Record<string, string> = {
  brand: 'text-brand-700 bg-brand-50',
  red: 'text-red-700 bg-red-50',
  orange: 'text-orange-700 bg-orange-50',
  slate: 'text-slate-700 bg-slate-100',
};

function Stat({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  return (
    <div className={`rounded-xl p-4 ${TONE_CLASSES[tone]}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs opacity-80">
        {label} of {total}
      </p>
    </div>
  );
}
