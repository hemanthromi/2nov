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
import { IconChevronDown, IconFilter, IconPlus, IconSearch } from '../components/icons';

export default function Tasks() {
  const { categories, people, tasks, loading, error, refresh } = useTaskData();
  const { isCoordinator } = useAuth();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categoryFilter = params.get('category') ?? '';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined);
  const [newTaskCategoryId, setNewTaskCategoryId] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const activeFilterCount = [statusFilter, priorityFilter, assigneeFilter, categoryFilter, overdueOnly ? '1' : '']
    .filter(Boolean).length;

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
    return categories.filter((c) => map.has(c.id)).map((c) => ({ category: c, tasks: map.get(c.id)! }));
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

  function clearFilters() {
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setOverdueOnly(false);
    setParams({});
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
    const { data, error } = await supabase.from('bvp_categories').insert({ name, sort: nextSort }).select('id').single();
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
    setAddingCategory(false);
  }

  if (loading) return <div className="p-7 text-[13px] text-muted">Loading tasks&hellip;</div>;
  if (error) return <div className="p-7 text-[13px] text-out">{error}</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-3.5 py-5 md:px-7 md:py-7">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1>Tasks</h1>
          <p className="page-sub">{filtered.length} of {tasks.length} tasks</p>
        </div>
        {isCoordinator && (
          <div className="flex gap-2">
            <button onClick={() => setAddingCategory((v) => !v)} className="btn secondary small">
              <IconPlus size={13} /> Category
            </button>
            <button
              onClick={() => {
                setNewTaskCategoryId(categoryFilter || undefined);
                setEditingTask(null);
              }}
              className="btn"
            >
              <IconPlus size={14} /> New task
            </button>
          </div>
        )}
      </div>

      {addingCategory && (
        <div className="panel mb-4 flex items-center gap-2 p-3">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            autoFocus
            className="input"
          />
          <button onClick={handleAddCategory} className="btn small">
            Add
          </button>
          <button
            onClick={() => {
              setAddingCategory(false);
              setNewCategoryName('');
            }}
            className="btn text small"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <IconSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="input pl-9"
          />
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`btn secondary small shrink-0 ${filtersOpen || activeFilterCount > 0 ? '!border-teal !text-teal' : ''}`}
        >
          <IconFilter size={13} />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {filtersOpen && (
        <div className="panel mb-4 space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select value={categoryFilter} onChange={(e) => setParams(e.target.value ? { category: e.target.value } : {})} className="input">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input">
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="input">
              <option value="">Everyone</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[13px] text-ink">
              <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} className="accent-[var(--teal)]" />
              Overdue only
            </label>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="btn text small">
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <BulkActionBar
          selectedIds={[...selected]}
          people={people}
          onCreatePerson={handleCreatePerson}
          onDone={() => refresh()}
          onClear={() => setSelected(new Set())}
        />
      )}

      <div className="space-y-3">
        {grouped.map(({ category, tasks: catTasks }) => (
          <div key={category.id} className="panel">
            <button onClick={() => toggleCollapsed(category.id)} className="panelhead w-full text-left">
              <span className="flex items-center gap-2 panel-title">
                <IconChevronDown size={14} className={`text-muted transition-transform ${collapsed.has(category.id) ? '-rotate-90' : ''}`} />
                {category.name}
              </span>
              <span className="text-[12px] tabular-nums text-muted">
                {catTasks.length} task{catTasks.length === 1 ? '' : 's'}
              </span>
            </button>
            {!collapsed.has(category.id) &&
              catTasks.map((task) => (
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
        ))}
        {grouped.length === 0 && <p className="p-7 text-center text-[13px] text-muted">No tasks match these filters.</p>}
      </div>

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
