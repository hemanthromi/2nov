import { useMemo, useState } from 'react';
import type { Person } from '../lib/types';

interface Props {
  people: Person[];
  selected: string[];
  onToggle: (personId: string) => void;
  onCreate: (name: string) => Promise<string | null>;
}

export default function PeoplePicker({ people, selected, onToggle, onCreate }: Props) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => p.name.toLowerCase().includes(q));
  }, [people, query]);

  const exactMatch = people.some((p) => p.name.toLowerCase() === query.trim().toLowerCase());

  async function handleCreate() {
    if (!query.trim()) return;
    setCreating(true);
    const id = await onCreate(query.trim());
    setCreating(false);
    if (id) {
      onToggle(id);
      setQuery('');
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search or add a person..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {filtered.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                isSelected ? 'bg-brand-50 text-brand-800' : 'hover:bg-slate-50'
              }`}
            >
              <span>{p.name}</span>
              {isSelected && <span aria-hidden>&#10003;</span>}
            </button>
          );
        })}
        {filtered.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No matches</p>}
      </div>
      {query.trim() && !exactMatch && (
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="w-full rounded-lg border border-dashed border-brand-300 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-60"
        >
          {creating ? 'Adding...' : `+ Add "${query.trim()}" as a new person`}
        </button>
      )}
    </div>
  );
}
