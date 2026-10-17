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
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 ease-out active:scale-95 ${shown ? 'bg-forest' : 'bg-sage'}`}
      >
        <span
          className={`absolute left-1 size-6 rounded-full bg-paper shadow-[0_2px_6px_rgb(15_46_38/0.3)] transition-transform duration-300 ease-out ${shown ? 'translate-x-6' : 'translate-x-0'}`}
        />
      </button>
    </form>
  );
}
