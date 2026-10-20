import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/types';
import type { Person } from '../lib/types';
import PeoplePicker from './PeoplePicker';

interface Props {
  selectedIds: string[];
  people: Person[];
  onCreatePerson: (name: string) => Promise<string | null>;
  onDone: () => void;
  onClear: () => void;
}

export default function BulkActionBar({ selectedIds, people, onCreatePerson, onDone, onClear }: Props) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSelection, setAssignSelection] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function setField(field: 'status' | 'priority', value: string) {
    setBusy(true);
    await supabase.from('bvp_tasks').update({ [field]: value }).in('id', selectedIds);
    setBusy(false);
    onDone();
  }

  async function setDueDate(value: string) {
    setBusy(true);
    await supabase.from('bvp_tasks').update({ due_date: value || null }).in('id', selectedIds);
    setBusy(false);
    onDone();
  }

  async function applyAssign() {
    if (!assignSelection.length) {
      setAssignOpen(false);
      return;
    }
    setBusy(true);
    const rows = selectedIds.flatMap((taskId) =>
      assignSelection.map((personId) => ({ task_id: taskId, person_id: personId })),
    );
    await supabase.from('bvp_task_assignees').upsert(rows, { onConflict: 'task_id,person_id' });
    setBusy(false);
    setAssignOpen(false);
    setAssignSelection([]);
    onDone();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${selectedIds.length} task(s)? This cannot be undone.`)) return;
    setBusy(true);
    await supabase.from('bvp_tasks').delete().in('id', selectedIds);
    setBusy(false);
    onDone();
  }

  return (
    <>
      <div className="sticky bottom-16 z-20 mx-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg md:bottom-4">
        <span className="text-sm font-medium text-slate-700">{selectedIds.length} selected</span>

        <button
          onClick={() => setAssignOpen(true)}
          disabled={busy}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Assign people
        </button>

        <select
          disabled={busy}
          onChange={(e) => e.target.value && setField('status', e.target.value)}
          defaultValue=""
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
        >
          <option value="" disabled>
            Set status...
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          disabled={busy}
          onChange={(e) => e.target.value && setField('priority', e.target.value)}
          defaultValue=""
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
        >
          <option value="" disabled>
            Set priority...
          </option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        <input
          type="date"
          disabled={busy}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
          title="Set due date"
        />

        <button onClick={handleDelete} disabled={busy} className="text-xs font-medium text-red-600 hover:underline">
          Delete
        </button>

        <button onClick={onClear} className="ml-auto text-xs text-slate-400 hover:text-slate-600">
          Clear
        </button>
      </div>

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <h3 className="text-sm font-semibold text-slate-900">
              Assign {selectedIds.length} task(s) to
            </h3>
            <div className="mt-3">
              <PeoplePicker
                people={people}
                selected={assignSelection}
                onToggle={(id) =>
                  setAssignSelection((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
                }
                onCreate={onCreatePerson}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setAssignOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={applyAssign}
                disabled={busy}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
