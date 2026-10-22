import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { OUTCOME_LABEL } from '@/domain/labels';
import type { ApprovalStatus, Outcome, Reason } from '@/domain/types';
import { AlertIcon, CheckIcon, CrossIcon, QuestionIcon } from './icons';

type Variant = 'primary' | 'secondary' | 'needs' | 'quiet' | 'warn';
type Size = 'lg' | 'md' | 'sm' | 'xs';

/** Classes for anything that should look like a button, links included. The look lives in globals.css (`.btn`). */
export function buttonClass(variant: Variant = 'primary', size: Size = 'lg', extra = '') {
  return ['group btn', `btn-${variant}`, `btn-${size}`, extra].join(' ');
}

export function Button({ variant = 'primary', size = 'lg', className = '', busy = false, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; busy?: boolean }) {
  return (
    <button {...props} aria-busy={busy || undefined} className={buttonClass(variant, size, className)}>
      {busy && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner() {
  return <span aria-hidden="true" className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

/** An arrow that nudges forward when its button is hovered. */
export function Nudge({ children }: { children: ReactNode }) {
  return <span className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">{children}</span>;
}

export type StampKind = Outcome | 'declined' | 'cancelled';

const ICON = { width: 16, height: 16, strokeWidth: 2.5 };
const STAMP: Record<StampKind, { label: string; icon: ReactNode }> = {
  approve: { label: OUTCOME_LABEL.approve, icon: <CheckIcon {...ICON} /> },
  ask: { label: OUTCOME_LABEL.ask, icon: <QuestionIcon {...ICON} /> },
  block: { label: OUTCOME_LABEL.block, icon: <CrossIcon {...ICON} /> },
  declined: { label: 'You declined', icon: <CrossIcon {...ICON} /> },
  cancelled: { label: 'Cancelled', icon: <CrossIcon {...ICON} /> },
};

/** The stamp a purchase carries now: once the person has decided, theirs replaces the checker's "Asking you". */
export function stampFor(status: ApprovalStatus, outcome: Outcome): StampKind {
  if (status === 'pending') return 'ask';
  if (status === 'declined') return 'declined';
  if (status === 'revoked') return 'cancelled';
  if (status === 'approved' || status === 'used') return 'approve';
  return outcome;
}

/** The checker's decision as a tag on the sheet: mint approved, yellow asking, pink blocked. `land` plays it coming down. */
export function Stamp({ outcome, land = false, small = false }: { outcome: StampKind; land?: boolean; small?: boolean }) {
  const s = STAMP[outcome];
  return (
    <span className={`stamp stamp-${outcome} ${land ? 'stamp-land' : ''} ${small ? 'origin-left scale-[0.85]' : ''}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

/** A sheet of white paper with an ink edge. With a `tone`, its offset takes the decision's colour. */
export function Receipt({ children, className = '', tone }: { children: ReactNode; className?: string; tone?: StampKind }) {
  return <article className={`sheet ${tone ? `tone-${tone}` : ''} px-5 pb-5 pt-5 ${className}`}>{children}</article>;
}

export function ReceiptHead({ title, sub, amount }: { title: ReactNode; sub?: ReactNode; amount?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-display text-[1.1875rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink text-pretty">{title}</h3>
        {sub && <p className="mt-1 text-[0.8125rem] text-muted">{sub}</p>}
      </div>
      {amount && <p className="shrink-0 font-display text-[1.75rem] font-black leading-none tracking-[-0.035em] text-ink tabular-nums">{amount}</p>}
    </div>
  );
}

export function ReceiptSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rule-dashed mt-4 pt-4 ${className}`}>{children}</div>;
}

const BY_LABEL: Record<Reason['by'], string> = { code: 'Rule check', ai: 'AI check', system: 'System' };

/** The reasons behind a decision, each led by a small tag naming who checked it. */
export function ReasonLines({ reasons, fallback }: { reasons: Reason[]; fallback: string }) {
  if (reasons.length === 0) return <p className="text-sm leading-relaxed text-ink">{fallback}</p>;
  return (
    <ul className="space-y-2.5">
      {reasons.map((r, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
          <span className="mt-[2px] shrink-0 rounded-[4px] border border-line bg-surface px-1.5 py-px text-[0.75rem] font-[650] text-ink">
            {BY_LABEL[r.by]}
          </span>
          <span className="min-w-0">{r.message}</span>
        </li>
      ))}
    </ul>
  );
}

/** A screen's title. At most one word per screen sits on the yellow highlight band. */
export function ScreenTitle({ before = '', highlight, after = '', children }: { before?: string; highlight?: string; after?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 space-y-2.5">
      <h2 className="font-display text-[2rem] font-black leading-[1.05] tracking-[-0.04em] text-ink text-balance">
        {before}
        {highlight && <Highlight>{highlight}</Highlight>}
        {after}
      </h2>
      {children && <p className="max-w-[36ch] text-[0.9375rem] leading-relaxed text-muted">{children}</p>}
    </header>
  );
}

export function Highlight({ children }: { children: string }) {
  return <span className="highlight highlight-draw">{children}</span>;
}

/** A heading inside a screen, followed by a dashed rule to the edge. */
export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="min-w-0 font-display text-lg font-extrabold leading-tight tracking-[-0.03em] text-ink text-balance">{children}</h3>
      <span aria-hidden="true" className="min-w-6 flex-1 border-b border-dashed border-rule" />
    </div>
  );
}

/** Flat paper with a fine edge, for settings rows and tables. Only decisions get a coloured offset. */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[4px] border border-line bg-paper ${className}`}>{children}</div>;
}

/** An empty state: a dashed outline on the warm surface. */
export const EMPTY = 'rounded-[4px] border border-dashed border-rule bg-surface px-4 py-6 text-center text-sm text-muted';

export const FIELD =
  'w-full resize-none rounded-[4px] border border-ink bg-paper px-4 py-3.5 [field-sizing:content] min-h-[7.5rem] max-h-[22rem] text-base leading-relaxed text-ink transition-shadow duration-200 ease-out placeholder:text-muted focus:outline-none focus:shadow-[4px_4px_0_0_var(--color-yellow),4px_4px_0_1px_var(--color-ink)]';

/** Example tasks: outlined like the portfolio's filters, yellow when hovered or chosen. */
export const CHIP =
  'min-h-10 rounded-[4px] border border-yellow-line px-3 py-2 text-left text-[0.8125rem] font-[650] leading-snug text-ink transition-[background-color,border-color] duration-200 ease-out hover:border-yellow hover:bg-yellow aria-pressed:border-yellow aria-pressed:bg-yellow active:translate-y-px';

/** Plain notes under a control: errors name the problem; confirmations say what changed. */
export function Note({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className="step-in flex items-start gap-2 text-sm text-ink">
      <span className={`mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-ink ${tone === 'error' ? 'bg-pink' : 'bg-mint'}`}>
        {tone === 'error' ? <AlertIcon width={12} height={12} strokeWidth={2.5} /> : <CheckIcon width={12} height={12} strokeWidth={2.75} />}
      </span>
      <span>{children}</span>
    </p>
  );
}
