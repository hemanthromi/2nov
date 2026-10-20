import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useTaskData } from '../lib/useTaskData';
import { IconPlus } from '../components/icons';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

export default function People() {
  const { people, tasks, loading, error, refresh } = useTaskData();
  const { isCoordinator } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('bvp_people').insert({ name: name.trim(), phone: phone.trim() || null });
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setName('');
    setPhone('');
    refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('bvp_people').update({ active: !active }).eq('id', id);
    refresh();
  }

  if (loading) return <div className="p-7 text-[14.5px] text-muted">Loading&hellip;</div>;
  if (error) return <div className="p-7 text-[14.5px] text-out">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3.5 py-5 md:px-7 md:py-7">
      <div>
        <h1>People</h1>
        <p className="page-sub">Everyone tasks can be assigned to for this event.</p>
      </div>

      {isCoordinator && (
        <div className="panel flex flex-wrap items-end gap-2 p-3.5">
          <div className="flex-1">
            <span className="input-label">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input" />
          </div>
          <div className="flex-1">
            <span className="input-label">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className="input" />
          </div>
          <button onClick={handleAdd} disabled={saving} className="btn">
            <IconPlus size={14} /> Add
          </button>
        </div>
      )}

      <div className="panel">
        {people.map((p) => {
          const taskCount = tasks.filter((t) => (t.assignees ?? []).some((a) => a.person_id === p.id)).length;
          return (
            <div key={p.id} className="row items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pale text-[13.5px] font-semibold text-teal">
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`row-title ${p.active ? '' : 'text-muted line-through opacity-70'}`}>{p.name}</p>
                <p className="row-meta">
                  {p.phone ?? 'No phone'} &middot; {taskCount} task{taskCount === 1 ? '' : 's'}
                  {p.profile_id && <span className="ml-1.5 tag teal">has login</span>}
                </p>
              </div>
              {isCoordinator && (
                <button onClick={() => toggleActive(p.id, p.active)} className="btn text small shrink-0">
                  {p.active ? 'Deactivate' : 'Reactivate'}
                </button>
              )}
            </div>
          );
        })}
        {people.length === 0 && <p className="p-7 text-center text-[14.5px] text-muted">No one added yet.</p>}
      </div>
    </div>
  );
}
