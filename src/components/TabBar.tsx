'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActivityIcon, ApprovalsIcon, AskIcon, RulesIcon } from './icons';

const TABS = [
  { href: '/rules', label: 'Rules', Icon: RulesIcon },
  { href: '/ask', label: 'Ask', Icon: AskIcon },
  { href: '/approvals', label: 'Approvals', Icon: ApprovalsIcon },
  { href: '/activity', label: 'Activity', Icon: ActivityIcon },
];

/** The ink dock at the foot of the app. One yellow marker slides under the active tab. */
export function TabBar({ pending }: { pending: number }) {
  const path = usePathname();
  const isActive = (href: string) => path.startsWith(href) || (href === '/activity' && path.startsWith('/evals'));
  const activeIndex = TABS.findIndex((t) => isActive(t.href));
  return (
    <nav aria-label="Main" className="on-ink sticky bottom-0 z-20 bg-cream px-3 pb-3 pt-2">
      <div className="relative grid grid-cols-4 gap-1 rounded-[4px] bg-ink p-1.5 shadow-[0_6px_22px_rgb(28_28_28/0.16)]">
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="dock-marker absolute bottom-1.5 left-1.5 top-1.5 rounded-[4px] bg-yellow"
            style={{ width: 'calc((100% - 1.5rem) / 4)', transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))` }}
          />
        )}
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`group relative z-10 flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-[4px] text-[0.75rem] font-bold transition-colors duration-200 ease-out ${active ? 'text-ink' : 'text-cream/85 hover:bg-cream/10 hover:text-cream'}`}
            >
              <span className="relative transition-transform duration-200 ease-out group-active:scale-90">
                <Icon width={19} height={19} strokeWidth={active ? 2.1 : 1.75} />
                {href === '/approvals' && pending > 0 && (
                  <span
                    key={pending}
                    aria-label={`${pending} waiting`}
                    className="pop absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-yellow px-1 text-[0.6875rem] font-extrabold text-ink ring-2 ring-ink tabular-nums"
                  >
                    {pending}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
