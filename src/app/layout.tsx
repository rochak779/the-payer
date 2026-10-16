import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { TabBar } from '@/components/TabBar';
import { defaultStore } from '@/store/store';
import './globals.css';

export const metadata: Metadata = { title: 'Agent Mandates', description: 'Spending rules for your AI shopping agent' };
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: ReactNode }) {
  const db = defaultStore().read();
  const pending = db.approvals.filter((a) => a.status === 'pending').length;
  return (
    <html lang="en-GB">
      <body className="min-h-screen bg-neutral-200 text-neutral-900 antialiased">
        <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-neutral-50 shadow-xl sm:my-6 sm:min-h-[860px] sm:overflow-hidden sm:rounded-[2.5rem]">
          <header className="bg-neutral-900 px-5 pb-4 pt-6 text-white">
            <p className="text-[11px] uppercase tracking-widest text-neutral-400">Wallet</p>
            <h1 className="text-lg font-semibold">Agent Mandates</h1>
            {!db.settings.agentEnabled && <p className="mt-1 text-xs text-amber-300">Agent is turned off</p>}
          </header>
          <main className="flex-1 overflow-y-auto px-4 py-4">{children}</main>
          <TabBar pending={pending} />
        </div>
      </body>
    </html>
  );
}
