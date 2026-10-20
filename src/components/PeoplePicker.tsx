import { useMemo, useState } from 'react';
import type { Person } from '../lib/types';
import { IconSearch } from './icons';

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
      <div className="relative">
        <IconSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or add a person..." className="input pl-8" />
      </div>
      <div className="max-h-48 space-y-0.5 overflow-y-auto">
        {filtered.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] ${
                isSelected ? 'bg-pale text-teal' : 'text-ink hover:bg-hover'
              }`}
            >
              <span>{p.name}</span>
              {isSelected && <span aria-hidden>&#10003;</span>}
            </button>
          );
        })}
        {filtered.length === 0 && <p className="px-3 py-2 text-[13px] text-muted">No matches</p>}
      </div>
      {query.trim() && !exactMatch && (
        <button type="button" onClick={handleCreate} disabled={creating} className="btn secondary w-full !border-dashed !border-teal !text-teal">
          {creating ? 'Adding…' : `+ Add "${query.trim()}" as a new person`}
        </button>
      )}
    </div>
  );
}
