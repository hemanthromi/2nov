import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useTaskData } from '../lib/useTaskData';

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

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-slate-900">People</h1>
      <p className="text-sm text-slate-500">Everyone tasks can be assigned to for this event.</p>

      {isCoordinator && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input max-w-xs" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="input max-w-xs" />
          <button
            onClick={handleAdd}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Add person
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {people.map((p) => {
            const taskCount = tasks.filter((t) => (t.assignees ?? []).some((a) => a.person_id === p.id)).length;
            return (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className={`text-sm font-medium ${p.active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.phone ?? 'No phone'} &middot; {taskCount} task{taskCount === 1 ? '' : 's'}
                  </p>
                </div>
                {isCoordinator && (
                  <button onClick={() => toggleActive(p.id, p.active)} className="text-xs text-slate-400 hover:text-slate-600">
                    {p.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}
              </li>
            );
          })}
          {people.length === 0 && <li className="p-6 text-center text-sm text-slate-400">No one added yet.</li>}
        </ul>
      </div>
    </div>
  );
}
