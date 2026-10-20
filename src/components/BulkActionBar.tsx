import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/types';
import type { Person } from '../lib/types';
import PeoplePicker from './PeoplePicker';
import { IconX } from './icons';

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
    const rows = selectedIds.flatMap((taskId) => assignSelection.map((personId) => ({ task_id: taskId, person_id: personId })));
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
      <div className="panel sticky top-0 z-30 mb-3 flex flex-wrap items-center gap-2 px-3.5 py-2.5">
        <span className="text-[13px] font-medium text-ink">{selectedIds.length} selected</span>

        <button onClick={() => setAssignOpen(true)} disabled={busy} className="btn small">
          Assign people
        </button>

        <select disabled={busy} onChange={(e) => e.target.value && setField('status', e.target.value)} defaultValue="" className="input w-auto py-1.5 text-[12px]">
          <option value="" disabled>
            Set status&hellip;
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select disabled={busy} onChange={(e) => e.target.value && setField('priority', e.target.value)} defaultValue="" className="input w-auto py-1.5 text-[12px]">
          <option value="" disabled>
            Set priority&hellip;
          </option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        <input type="date" disabled={busy} onChange={(e) => setDueDate(e.target.value)} className="input w-auto py-1.5 text-[12px]" title="Set due date" />

        <button onClick={handleDelete} disabled={busy} className="btn danger-text small">
          Delete
        </button>

        <button onClick={onClear} className="ml-auto icon-btn !border-0" aria-label="Clear selection">
          <IconX size={14} />
        </button>
      </div>

      {assignOpen && (
        <div className="dialog-scrim flex items-end justify-center sm:items-center">
          <div className="dialog w-full p-5 sm:m-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14.5px] font-semibold text-ink">Assign {selectedIds.length} task(s)</h2>
              <button onClick={() => setAssignOpen(false)} className="icon-btn !border-0" aria-label="Close">
                <IconX size={14} />
              </button>
            </div>
            <PeoplePicker
              people={people}
              selected={assignSelection}
              onToggle={(id) => setAssignSelection((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))}
              onCreate={onCreatePerson}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setAssignOpen(false)} className="btn secondary">
                Cancel
              </button>
              <button onClick={applyAssign} disabled={busy} className="btn">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
