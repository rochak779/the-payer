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

export function TabBar({ pending }: { pending: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="grid grid-cols-4 border-t border-line bg-paper px-2 pb-3 pt-2">
      {TABS.map(({ href, label, Icon }) => {
        const active = path.startsWith(href) || (href === '/activity' && path.startsWith('/evals'));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`group flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[0.75rem] transition-colors duration-200 ease-out ${active ? 'font-bold text-forest' : 'font-medium text-muted hover:text-forest'}`}
          >
            <span className="relative">
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition-[background-color,transform] duration-300 ease-out group-active:scale-90 ${active ? 'bg-forest text-cream' : 'group-hover:bg-forest/[0.06]'}`}
              >
                <Icon width={19} height={19} strokeWidth={active ? 2 : 1.75} />
              </span>
              {href === '/approvals' && pending > 0 && (
                <span
                  key={pending}
                  aria-label={`${pending} waiting`}
                  className="pop absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[0.6875rem] font-extrabold text-forest-deep ring-2 ring-paper tabular-nums"
                >
                  {pending}
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
