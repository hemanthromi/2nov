import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaskData } from '../lib/useTaskData';
import { useAuth } from '../lib/useAuth';
import { supabase } from '../lib/supabase';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/types';
import type { Task } from '../lib/types';
import TaskRow from '../components/TaskRow';
import TaskDetailModal from '../components/TaskDetailModal';
import BulkActionBar from '../components/BulkActionBar';

export default function Tasks() {
  const { categories, people, tasks, loading, error, refresh } = useTaskData();
  const { isCoordinator } = useAuth();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const categoryFilter = params.get('category') ?? '';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined);
  const [newTaskCategoryId, setNewTaskCategoryId] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState('');

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (categoryFilter && t.category_id !== categoryFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter && !(t.assignees ?? []).some((a) => a.person_id === assigneeFilter)) return false;
      if (overdueOnly) {
        const due = t.due_date ? new Date(t.due_date) : null;
        if (!due || due >= new Date(new Date().toDateString())) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.notes ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, categoryFilter, statusFilter, priorityFilter, assigneeFilter, overdueOnly, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      const list = map.get(t.category_id) ?? [];
      list.push(t);
      map.set(t.category_id, list);
    }
    return categories
      .filter((c) => map.has(c.id))
      .map((c) => ({ category: c, tasks: map.get(c.id)! }));
  }, [categories, filtered]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreatePerson(name: string): Promise<string | null> {
    const { data, error } = await supabase.from('bvp_people').insert({ name }).select('id').single();
    if (error) {
      alert(error.message);
      return null;
    }
    await refresh();
    return data.id;
  }

  async function handleCreateCategory(name: string): Promise<string | null> {
    const nextSort = Math.max(0, ...categories.map((c) => c.sort)) + 1;
    const { data, error } = await supabase
      .from('bvp_categories')
      .insert({ name, sort: nextSort })
      .select('id')
      .single();
    if (error) {
      alert(error.message);
      return null;
    }
    await refresh();
    return data.id;
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    await handleCreateCategory(newCategoryName.trim());
    setNewCategoryName('');
  }

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading tasks...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
        {isCoordinator && (
          <button
            onClick={() => {
              setNewTaskCategoryId(categoryFilter || undefined);
              setEditingTask(null);
            }}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New task
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="input max-w-xs"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setParams(e.target.value ? { category: e.target.value } : {})}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
          <option value="">Everyone</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-600">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
          Overdue only
        </label>
      </div>

      {isCoordinator && (
        <div className="flex items-center gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Add a new category..."
            className="input max-w-xs"
          />
          <button onClick={handleAddCategory} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Add
          </button>
        </div>
      )}

      <div className="space-y-4">
        {grouped.map(({ category, tasks: catTasks }) => (
          <div key={category.id} className="rounded-xl border border-slate-200 bg-white">
            <button
              onClick={() => toggleCollapsed(category.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-slate-900">{category.name}</span>
              <span className="text-xs text-slate-400">
                {catTasks.length} task{catTasks.length === 1 ? '' : 's'}
              </span>
            </button>
            {!collapsed.has(category.id) && (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {catTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    selected={selected.has(task.id)}
                    onToggleSelect={() => toggleSelect(task.id)}
                    onOpen={() => setEditingTask(task)}
                    canEdit={isCoordinator}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {grouped.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No tasks match these filters.</p>}
      </div>

      {selected.size > 0 && (
        <BulkActionBar
          selectedIds={[...selected]}
          people={people}
          onCreatePerson={handleCreatePerson}
          onDone={() => {
            refresh();
          }}
          onClear={() => setSelected(new Set())}
        />
      )}

      {editingTask !== undefined && (
        <TaskDetailModal
          task={editingTask}
          categories={categories}
          people={people}
          defaultCategoryId={newTaskCategoryId}
          onClose={() => setEditingTask(undefined)}
          onSaved={refresh}
          onCreatePerson={handleCreatePerson}
          onCreateCategory={handleCreateCategory}
        />
      )}
    </div>
  );
}
