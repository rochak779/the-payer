'use client';

import { useState, useTransition } from 'react';
import { previewRules, saveRules, type PreviewItem } from '@/app/actions';
import { Card } from '@/components/ui';

export function RulesEditor({ initialText, saved }: { initialText: string; saved: PreviewItem[] }) {
  const [text, setText] = useState(initialText);
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [message, setMessage] = useState('');
  const [busy, startTransition] = useTransition();
  const shown = preview ?? saved;

  const read = () =>
    startTransition(async () => {
      setMessage('');
      try {
        setPreview(await previewRules(text));
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Couldn't read those rules.");
      }
    });

  const save = (items: PreviewItem[]) =>
    startTransition(async () => {
      await saveRules(items.map((p) => p.rule));
      setPreview(null);
      setMessage('Saved. The agent uses these from now on.');
    });

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); setMessage(''); }}
        rows={6}
        placeholder="e.g. Hotels up to £150 a night. Nothing non-refundable. Ask me about gifts."
        className="w-full rounded-2xl border border-neutral-300 bg-white p-3 text-sm"
      />
      <button
        disabled={busy || !text.trim()}
        onClick={read}
        className="w-full rounded-full bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {busy ? 'Reading…' : 'Show me what you understood'}
      </button>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{preview ? "Here's what I understood" : 'Saved rules'}</h3>
        {shown.length === 0 && <p className="text-sm text-neutral-500">No rules yet.</p>}
        {shown.map((p) => (
          <Card key={p.rule.id}>
            <p className="text-sm">{p.explanation}</p>
            <p className="mt-1 text-xs text-neutral-500">{p.checkedBy} · from “{p.rule.source}”</p>
            {preview && (
              <button onClick={() => setPreview(preview.filter((x) => x.rule.id !== p.rule.id))} className="mt-2 text-xs text-red-700">
                Remove: that’s not what I meant
              </button>
            )}
          </Card>
        ))}
      </section>

      {preview && (
        <button disabled={busy} onClick={() => save(preview)} className="w-full rounded-full bg-emerald-700 py-2.5 text-sm font-medium text-white disabled:opacity-40">
          Save these rules
        </button>
      )}
      {message && <p className="text-sm text-neutral-700">{message}</p>}
    </div>
  );
}
