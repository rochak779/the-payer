'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/rules', label: 'Rules' },
  { href: '/ask', label: 'Ask' },
  { href: '/approvals', label: 'Approvals' },
  { href: '/activity', label: 'Activity' },
];

export function TabBar({ pending }: { pending: number }) {
  const path = usePathname();
  return (
    <nav className="grid grid-cols-4 border-t border-neutral-200 bg-white text-xs">
      {TABS.map((t) => {
        const active = path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`relative py-3 text-center ${active ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}>
            {t.label}
            {t.href === '/approvals' && pending > 0 && (
              <span className="absolute right-3 top-2 rounded-full bg-red-600 px-1.5 text-[10px] leading-4 text-white">{pending}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
