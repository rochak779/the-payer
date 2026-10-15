'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { startTask } from '@/app/actions';
import { Card } from '@/components/ui';
import type { RunView } from '@/flow/runs';

const EXAMPLES = [
  'Book a hotel in Lisbon, 7–9 Nov',
  'Buy a birthday present for my nephew, about £60',
  'Get me some noise-cancelling headphones',
];

const KIND_LABEL: Record<string, string> = {
  status: 'Agent', search: 'Search', found: 'Found', request: 'Wants to buy', decision: 'Checker', error: 'Error',
};

export function AskAgent() {
  const [task, setTask] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunView | null>(null);
  const [error, setError] = useState('');
  const [starting, startTransition] = useTransition();

  useEffect(() => {
    if (!runId) return;
    let stopped = false;
    const poll = async () => {
      const res = await fetch(`/api/runs/${runId}`, { cache: 'no-store' });
      if (stopped || !res.ok) return;
      const next = (await res.json()) as RunView;
      setRun(next);
      if (next.status === 'running') setTimeout(poll, 1000);
    };
    void poll();
    return () => { stopped = true; };
  }, [runId]);

  const busy = starting || run?.status === 'running';
  const waitingForYou = run?.approvals.some((a) => a.status === 'pending');

  const submit = () =>
    startTransition(async () => {
      setError('');
      setRun(null);
      try {
        setRunId(await startTask(task));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });

  return (
    <div className="space-y-4">
      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        rows={3}
        placeholder="What should the agent buy?"
        className="w-full rounded-2xl border border-neutral-300 bg-white p-3 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => setTask(ex)} className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-neutral-200">
            {ex}
          </button>
        ))}
      </div>
      <button disabled={busy || !task.trim()} onClick={submit} className="w-full rounded-full bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-40">
        {busy ? 'Agent is working…' : 'Send to agent'}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}

      {run && (
        <Card>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Agent progress</p>
          <ol className="mt-2 space-y-2">
            {run.events.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="mr-2 text-[11px] font-medium uppercase text-neutral-500">{KIND_LABEL[e.kind]}</span>
                <span className={e.kind === 'error' ? 'text-red-700' : ''}>{e.text}</span>
              </li>
            ))}
            {run.status === 'running' && <li className="text-sm text-neutral-400">…</li>}
          </ol>
          {waitingForYou && (
            <Link href="/approvals" className="mt-3 block rounded-full bg-amber-500 py-2 text-center text-sm font-medium text-white">
              Review in Approvals
            </Link>
          )}
          {run.status !== 'running' && !waitingForYou && (
            <Link href="/activity" className="mt-3 block text-center text-xs text-blue-700 underline">See it in the activity log</Link>
          )}
        </Card>
      )}
    </div>
  );
}
