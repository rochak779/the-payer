'use client';

import { useOptimistic } from 'react';
import { toggleAgent } from '@/app/actions';

/** The agent's on/off switch. The knob moves at once; the server catches up. */
export function AgentSwitch({ on }: { on: boolean }) {
  const [shown, setShown] = useOptimistic(on);
  return (
    <form
      action={async (form) => {
        setShown(!on);
        await toggleAgent(form);
      }}
    >
      <input type="hidden" name="enabled" value={on ? 'false' : 'true'} />
      <button
        role="switch"
        aria-checked={shown}
        aria-label={on ? 'Turn off agent' : 'Turn on'}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-[4px] border border-ink transition-colors duration-300 ease-out active:translate-y-px ${shown ? 'bg-mint' : 'bg-surface'}`}
      >
        <span
          className={`absolute left-[3px] size-6 rounded-[3px] border border-ink bg-paper shadow-[2px_2px_0_var(--color-ink)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${shown ? 'translate-x-6' : 'translate-x-0'}`}
        />
      </button>
    </form>
  );
}
