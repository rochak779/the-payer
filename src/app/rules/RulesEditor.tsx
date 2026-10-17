'use client';

import { useState, useTransition } from 'react';
import { previewRules, saveRules, type PreviewItem } from '@/app/actions';
import { CheckIcon, CrossIcon } from '@/components/icons';
import { Button, FIELD, Note, Receipt, Script } from '@/components/ui';

export function RulesEditor({ initialText, saved }: { initialText: string; saved: PreviewItem[] }) {
  const [text, setText] = useState(initialText);
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [reading, startReading] = useTransition();
  const [saving, startSaving] = useTransition();
  const shown = preview ?? saved;

  const read = () =>
    startReading(async () => {
      setMessage(null);
      try {
        setPreview(await previewRules(text));
      } catch (err) {
        setMessage({ tone: 'error', text: err instanceof Error ? err.message : "Couldn't read those rules." });
      }
    });

  const save = (items: PreviewItem[]) =>
    startSaving(async () => {
      await saveRules(items.map((p) => p.rule));
      setPreview(null);
      setMessage({ tone: 'ok', text: 'Saved. The agent uses these from now on.' });
    });

  // The line slides away before it goes, so it's clear which one was removed.
  const remove = (id: string) => {
    setLeaving(id);
    setTimeout(() => {
      setPreview((p) => p && p.filter((x) => x.rule.id !== id));
      setLeaving(null);
    }, 180);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="rules-text" className="sr-only">Your rules</label>
        <textarea
          id="rules-text"
          value={text}
          onChange={(e) => { setText(e.target.value); setPreview(null); setMessage(null); }}
          rows={5}
          placeholder="e.g. Hotels up to £150 a night. Nothing non-refundable. Ask me about gifts."
          className={FIELD}
        />
        <Button className="w-full" busy={reading} disabled={reading || saving || !text.trim()} onClick={read}>
          {reading ? 'Reading…' : 'Show me what you understood'}
        </Button>
      </div>

      <section aria-live="polite" className="space-y-3">
        {preview ? (
          <h3 className="text-xl font-extrabold tracking-[-0.02em] text-forest">
            Here’s what I <Script>understood</Script>
          </h3>
        ) : (
          <h3 className="text-base font-bold text-forest">Saved rules</h3>
        )}
        {shown.length === 0 ? (
          <p className="rounded-[20px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No rules yet. Write one above and I’ll read it back to you.</p>
        ) : (
          <Receipt key={preview ? 'preview' : 'saved'} className={preview ? 'step-in' : ''}>
            <ol>
              {shown.map((p, i) => (
                <li key={p.rule.id} className={`${i > 0 ? 'rule-dashed mt-3.5 pt-3.5' : ''} ${leaving === p.rule.id ? 'leaving' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest/[0.08] text-forest">
                      <CheckIcon width={13} height={13} strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] font-semibold leading-snug text-slate">{p.explanation}</p>
                      <p className="mt-1 text-[0.8125rem] leading-snug text-muted">{p.checkedBy} · from “{p.rule.source}”</p>
                      {preview && (
                        <button
                          type="button"
                          onClick={() => remove(p.rule.id)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full py-1 pr-2 text-[0.8125rem] font-semibold text-orange-ink transition-colors duration-200 hover:text-orange active:scale-[0.97]"
                        >
                          <CrossIcon width={14} height={14} strokeWidth={2.25} />
                          Remove: that’s not what I meant
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Receipt>
        )}
      </section>

      {preview && (
        <Button className="step-in w-full" busy={saving} disabled={saving || preview.length === 0} onClick={() => save(preview)}>
          {!saving && <CheckIcon width={18} height={18} strokeWidth={2.25} />}
          Save these rules
        </Button>
      )}
      {message && <Note tone={message.tone}>{message.text}</Note>}
    </div>
  );
}
