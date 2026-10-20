import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/types';
import type { Category, Person, Task } from '../lib/types';
import PeoplePicker from './PeoplePicker';
import TagInput from './TagInput';
import { IconX } from './icons';

interface Props {
  task: Task | null;
  categories: Category[];
  people: Person[];
  defaultCategoryId?: string;
  tagSuggestions: string[];
  onClose: () => void;
  onSaved: () => void;
  onCreatePerson: (name: string) => Promise<string | null>;
  onCreateCategory: (name: string) => Promise<string | null>;
}

export default function TaskDetailModal({
  task,
  categories,
  people,
  defaultCategoryId,
  tagSuggestions,
  onClose,
  onSaved,
  onCreatePerson,
  onCreateCategory,
}: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [categoryId, setCategoryId] = useState(task?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [taskType, setTaskType] = useState(task?.task_type ?? '');
  const [qty, setQty] = useState(task?.qty ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 'medium');
  const [status, setStatus] = useState(task?.status ?? 'not_started');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [selectedPeople, setSelectedPeople] = useState<string[]>(
    task?.assignees?.map((a) => a.person_id) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePerson(id: string) {
    setSelectedPeople((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);

    let finalCategoryId = categoryId;
    if (!finalCategoryId && newCategoryName.trim()) {
      const id = await onCreateCategory(newCategoryName.trim());
      if (!id) {
        setError('Could not create category');
        setSaving(false);
        return;
      }
      finalCategoryId = id;
    }
    if (!finalCategoryId) {
      setError('Pick or create a category');
      setSaving(false);
      return;
    }

    const payload = {
      category_id: finalCategoryId,
      title: title.trim(),
      task_type: taskType.trim() || null,
      qty: qty.trim() || null,
      priority,
      status,
      due_date: dueDate || null,
      notes: notes.trim() || null,
      tags,
    };

    let taskId = task?.id;
    if (taskId) {
      const { error: updateError } = await supabase.from('bvp_tasks').update(payload).eq('id', taskId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('bvp_tasks')
        .insert(payload)
        .select('id')
        .single();
      if (insertError || !data) {
        setError(insertError?.message ?? 'Could not create task');
        setSaving(false);
        return;
      }
      taskId = data.id;
    }

    const existingIds = task?.assignees?.map((a) => a.person_id) ?? [];
    const toAdd = selectedPeople.filter((id) => !existingIds.includes(id));
    const toRemove = existingIds.filter((id) => !selectedPeople.includes(id));

    if (toAdd.length) {
      await supabase
        .from('bvp_task_assignees')
        .insert(toAdd.map((personId) => ({ task_id: taskId, person_id: personId })));
    }
    if (toRemove.length) {
      await supabase
        .from('bvp_task_assignees')
        .delete()
        .eq('task_id', taskId)
        .in('person_id', toRemove);
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!task?.id) return;
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setSaving(true);
    const { error } = await supabase.from('bvp_tasks').delete().eq('id', task.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="dialog-scrim flex items-end justify-center sm:items-center">
      <div className="dialog max-h-[90vh] w-full overflow-y-auto p-5 sm:m-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">{task ? 'Edit task' : 'New task'}</h2>
          <button onClick={onClose} className="icon-btn !border-0" aria-label="Close">
            <IconX size={14} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="What needs to be done?"
            />
          </Field>

          <Field label="Category">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="">+ New category&hellip;</option>
            </select>
            {!categoryId && (
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="input mt-2"
              />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <input value={taskType} onChange={(e) => setTaskType(e.target.value)} className="input" placeholder="e.g. Purchase" />
            </Field>
            <Field label="Quantity">
              <input value={qty} onChange={(e) => setQty(e.target.value)} className="input" placeholder="e.g. 10" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="input">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Due date">
            <input type="date" value={dueDate ?? ''} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </Field>

          <Field label="Assignees">
            <PeoplePicker
              people={people}
              selected={selectedPeople}
              onToggle={togglePerson}
              onCreate={onCreatePerson}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-20"
              placeholder="Context, dependencies, source reference..."
            />
          </Field>

          <Field label="Tags">
            <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
          </Field>

          {error && <p className="text-[14.5px] text-out">{error}</p>}

          <div className="flex items-center justify-between gap-2 pt-2">
            {task ? (
              <button onClick={handleDelete} disabled={saving} className="btn danger-text">
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button onClick={onClose} className="btn secondary">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="input-label">{label}</span>
      {children}
    </label>
  );
}
