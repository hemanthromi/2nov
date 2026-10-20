import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

type BvpRole = 'admin' | 'coordinator' | 'viewer';

interface Row {
  id: string;
  email: string | null;
  full_name: string | null;
  bvpRole: BvpRole;
}

export default function Access() {
  const { isBvpAdmin, refreshAccess, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const [profilesRes, accessRes] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name').order('full_name'),
      supabase.from('bvp_access').select('profile_id, role'),
    ]);
    if (profilesRes.error) {
      setError(profilesRes.error.message);
      setLoading(false);
      return;
    }
    const roleByProfile = new Map((accessRes.data ?? []).map((a) => [a.profile_id, a.role as BvpRole]));
    setRows(
      (profilesRes.data ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        bvpRole: roleByProfile.get(p.id) ?? 'viewer',
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleChange(row: Row, newRole: BvpRole) {
    setSavingId(row.id);
    setError(null);
    if (newRole === 'viewer') {
      const { error } = await supabase.from('bvp_access').delete().eq('profile_id', row.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase
        .from('bvp_access')
        .upsert({ profile_id: row.id, role: newRole }, { onConflict: 'profile_id' });
      if (error) setError(error.message);
    }
    setSavingId(null);
    await load();
    if (row.id === profile?.id) await refreshAccess();
  }

  if (!isBvpAdmin) {
    return <div className="p-7 text-[14.5px] text-muted">Only BVP admins can manage access.</div>;
  }

  if (loading) return <div className="p-7 text-[14.5px] text-muted">Loading&hellip;</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3.5 py-5 md:px-7 md:py-7">
      <div>
        <h1>Access</h1>
        <p className="page-sub">
          Controls who can edit tasks in this app only &mdash; it doesn't change anyone's access in other
          Sampark apps. Everyone with a Sampark account can already view the checklist.
        </p>
      </div>

      {error && <p className="text-[14.5px] text-out">{error}</p>}

      <div className="panel">
        {rows.map((row) => (
          <div key={row.id} className="row flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="row-title truncate">{row.full_name || row.email}</p>
              <p className="row-meta truncate">{row.email}</p>
            </div>
            <select
              value={row.bvpRole}
              disabled={savingId === row.id}
              onChange={(e) => handleChange(row, e.target.value as BvpRole)}
              className="input shrink-0 sm:w-40"
            >
              <option value="viewer">Viewer</option>
              <option value="coordinator">Coordinator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
        {rows.length === 0 && <p className="p-7 text-center text-[14.5px] text-muted">No Sampark accounts found.</p>}
      </div>

      <p className="text-[13.5px] text-muted">
        Viewer: read-only. Coordinator: can edit tasks, people and categories. Admin: coordinator rights plus
        managing who has access here.
      </p>
    </div>
  );
}
