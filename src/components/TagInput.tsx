import { useState } from 'react';
import { IconX } from './icons';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export default function TagInput({ tags, onChange, suggestions = [] }: Props) {
  const [value, setValue] = useState('');

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      onChange([...tags, tag]);
    }
    setValue('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  const filteredSuggestions = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()) && (!value.trim() || s.toLowerCase().includes(value.trim().toLowerCase())),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="tag teal inline-flex items-center gap-1">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
              <IconX size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(value);
          } else if (e.key === 'Backspace' && !value && tags.length) {
            removeTag(tags[tags.length - 1]);
          }
        }}
        placeholder="Type a tag and press Enter"
        className="input mt-1.5"
      />
      {value.trim() && filteredSuggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {filteredSuggestions.slice(0, 6).map((s) => (
            <button key={s} type="button" onClick={() => addTag(s)} className="tag muted hover:bg-pale hover:text-teal">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
