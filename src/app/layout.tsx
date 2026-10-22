import type { Metadata } from 'next';
import { Ephesis, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { TabBar } from '@/components/TabBar';
import { currentStore } from '@/store/visitor';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const ephesis = Ephesis({ subsets: ['latin'], weight: '400', variable: '--font-ephesis' });

export const metadata: Metadata = { title: 'The Payer', description: 'Spending rules for your AI shopping agent' };
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const db = (await currentStore()).read();
  const pending = db.approvals.filter((a) => a.status === 'pending').length;
  const on = db.settings.agentEnabled;
  return (
    <html lang="en-GB" className={`${manrope.variable} ${ephesis.variable}`}>
      <body className="min-h-screen bg-slate font-sans text-slate antialiased">
        <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-cream sm:my-8 sm:h-[880px] sm:min-h-0 sm:overflow-hidden sm:rounded-[2.75rem] sm:shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55),0_0_0_10px_rgb(255_255_255/0.04)]">
          <header className="on-forest bg-forest px-5 pb-5 pt-7 text-cream">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-[1.375rem] font-extrabold leading-tight tracking-[-0.02em]">The Payer</h1>
                <p className="text-[0.8125rem] text-cream/70">Spending rules for your shopping agent</p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold ${on ? 'bg-cream/10 text-cream ring-1 ring-cream/15' : 'bg-orange-soft text-forest-deep'}`}
              >
                <span className="relative flex size-2">
                  {on && <span className="absolute inset-0 animate-ping rounded-full bg-cream/60" />}
                  <span className={`relative size-2 rounded-full ${on ? 'bg-cream' : 'bg-forest-deep'}`} />
                </span>
                {on ? 'Agent on' : 'Agent is turned off'}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-5 pb-8 pt-6">{children}</main>
          <TabBar pending={pending} />
        </div>
      </body>
    </html>
  );
}
