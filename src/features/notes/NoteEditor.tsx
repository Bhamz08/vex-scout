import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Fields';
import { normalizeTags } from './repo';

export const SUGGESTED_TAGS = ['fast-auton', 'strong-defense', 'reliable', 'breaks-down', 'good-driver', 'parks', 'toggle-control', 'stacker'];

/** Text + tags editor used for both team and match notes. */
export function NoteEditor({
  initialText = '',
  initialTags = [],
  onSave,
  onCancel,
  submitLabel = 'Save note',
}: {
  initialText?: string;
  initialTags?: string[];
  onSave: (text: string, tags: string[]) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [text, setText] = useState(initialText);
  const [tagInput, setTagInput] = useState(initialTags.join(', '));
  const [saving, setSaving] = useState(false);
  const tags = normalizeTags(tagInput.split(','));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !tags.length) return;
    setSaving(true);
    try {
      await onSave(text.trim(), tags);
      setText('');
      setTagInput('');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => setTagInput(normalizeTags([...tags, tag]).join(', '));

  return (
    <form onSubmit={submit} className="space-y-2">
      <TextArea label="Note" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="What did you see?" />
      <TextField label="Tags (comma separated)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="fast-auton, strong-defense" />
      <div className="flex flex-wrap gap-1" aria-label="Suggested tags">
        {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
          <button key={t} type="button" onClick={() => addTag(t)} className="min-h-8 rounded-full border border-line px-2 text-xs hover:bg-surface-2">
            + {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
