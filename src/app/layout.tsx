import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { TabBar } from '@/components/TabBar';
import { currentStore } from '@/store/visitor';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

/** Satoshi comes from Fontshare's CDN: its licence allows using it on our own site but not committing the file to a public repo. */
const SATOSHI_CSS = 'https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap';

export const metadata: Metadata = { title: 'The Payer', description: 'Spending rules for your AI shopping agent' };
export const viewport: Viewport = { themeColor: '#fefaf4' };
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const db = (await currentStore()).read();
  const pending = db.approvals.filter((a) => a.status === 'pending').length;
  const on = db.settings.agentEnabled;
  return (
    <html lang="en-GB" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={SATOSHI_CSS} />
      </head>
      <body className="min-h-screen bg-cream font-sans text-ink antialiased sm:bg-yellow">
        <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-cream sm:my-8 sm:h-[min(880px,calc(100dvh-4rem))] sm:min-h-[640px] sm:overflow-hidden sm:rounded-[4px] sm:border sm:border-ink sm:shadow-[8px_12px_28px_rgb(92_73_26/0.22)]">
          <header className="border-b border-line bg-cream px-5 pb-4 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="wordmark text-ink">The Payer</h1>
                <p className="mt-1 text-[0.8125rem] text-muted text-pretty">Spending rules for your shopping agent</p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-2 rounded-[4px] border border-ink px-2.5 py-1.5 text-[0.8125rem] font-[650] text-ink ${on ? 'bg-paper' : 'bg-pink'}`}
              >
                <span className="relative flex size-2.5">
                  {on && <span className="absolute inset-0 animate-ping rounded-full bg-mint" />}
                  <span className={`relative size-2.5 rounded-full border border-ink ${on ? 'bg-mint' : 'bg-ink'}`} />
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
