import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { OUTCOME_LABEL } from '@/domain/labels';
import type { ApprovalStatus, Outcome, Reason } from '@/domain/types';
import { AlertIcon, CheckIcon, CrossIcon, QuestionIcon } from './icons';

type Variant = 'primary' | 'secondary' | 'needs' | 'quiet' | 'warn';
type Size = 'lg' | 'md' | 'sm' | 'xs';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-forest text-cream shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_8px_16px_-10px_rgb(15_46_38/0.75)] hover:bg-forest-deep disabled:bg-forest/35 disabled:text-cream/85 disabled:shadow-none',
  secondary: 'bg-paper text-forest ring-1 ring-line hover:bg-cream hover:ring-forest/35 disabled:text-forest/45',
  needs: 'bg-gold text-forest-deep shadow-[0_8px_16px_-10px_rgb(150_100_0/0.8)] hover:bg-[#dc9a12]',
  quiet: 'text-forest hover:bg-forest/[0.06]',
  warn: 'text-orange-ink hover:bg-orange/10',
};
const SIZE: Record<Size, string> = {
  lg: 'h-12 px-6 text-[0.9375rem]',
  md: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-[0.8125rem]',
  xs: 'h-7 px-2.5 text-[0.75rem]',
};

/** Classes for anything that should look like a button, links included. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'lg', extra = '') {
  return [
    'group inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap',
    'transition-[background-color,box-shadow,color,transform] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none',
    VARIANT[variant], SIZE[size], extra,
  ].join(' ');
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

type StampKind = Outcome | 'declined' | 'cancelled';

const STAMP: Record<StampKind, { tone: string; label: string; icon: ReactNode }> = {
  approve: { tone: 'text-forest bg-forest/[0.06]', label: OUTCOME_LABEL.approve, icon: <CheckIcon width={15} height={15} strokeWidth={2.5} /> },
  ask: { tone: 'text-forest-deep bg-gold/30', label: OUTCOME_LABEL.ask, icon: <QuestionIcon width={15} height={15} strokeWidth={2.5} /> },
  block: { tone: 'text-orange-ink bg-orange/[0.08]', label: OUTCOME_LABEL.block, icon: <CrossIcon width={15} height={15} strokeWidth={2.5} /> },
  declined: { tone: 'text-ink-soft bg-ink-soft/[0.06]', label: 'You declined', icon: <CrossIcon width={15} height={15} strokeWidth={2.5} /> },
  cancelled: { tone: 'text-ink-soft bg-ink-soft/[0.06]', label: 'Cancelled', icon: <CrossIcon width={15} height={15} strokeWidth={2.5} /> },
};

/** The stamp a purchase carries now: once the person has decided, theirs replaces the checker's "Asking you". */
export function stampFor(status: ApprovalStatus, outcome: Outcome): StampKind {
  if (status === 'pending') return 'ask';
  if (status === 'declined') return 'declined';
  if (status === 'revoked') return 'cancelled';
  if (status === 'approved' || status === 'used') return 'approve';
  return outcome;
}

/** The checker's decision as a rubber stamp. `land` plays the stamp coming down. */
export function Stamp({ outcome, land = false, small = false }: { outcome: StampKind; land?: boolean; small?: boolean }) {
  const s = STAMP[outcome];
  return (
    <span className={`stamp ${s.tone} ${land ? 'stamp-land' : ''} ${small ? 'scale-[0.85] origin-left' : ''}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

/** Warm paper with a perforated bottom edge: every decision is printed on one. */
export function Receipt({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`receipt-shadow ${className}`}>
      <article className="receipt px-5 pt-5">{children}</article>
    </div>
  );
}

export function ReceiptHead({ title, sub, amount }: { title: ReactNode; sub?: ReactNode; amount?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-[1.0625rem] font-bold leading-snug text-forest text-pretty">{title}</h3>
        {sub && <p className="mt-0.5 text-[0.8125rem] text-muted">{sub}</p>}
      </div>
      {amount && <p className="shrink-0 text-2xl font-extrabold tracking-[-0.02em] text-forest tabular-nums">{amount}</p>}
    </div>
  );
}

export function ReceiptSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rule-dashed mt-4 pt-4 ${className}`}>{children}</div>;
}

const BY_LABEL: Record<Reason['by'], string> = { code: 'Rule check', ai: 'AI check', system: 'System' };

/** The reasons behind a decision, printed as the receipt's line items. */
export function ReasonLines({ reasons, fallback }: { reasons: Reason[]; fallback: string }) {
  if (reasons.length === 0) return <p className="text-sm leading-relaxed text-slate">{fallback}</p>;
  return (
    <ul className="space-y-2.5">
      {reasons.map((r, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate">
          <span className="mt-[3px] shrink-0 rounded-full bg-cream px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-ink-soft ring-1 ring-line">
            {BY_LABEL[r.by]}
          </span>
          <span className="min-w-0">{r.message}</span>
        </li>
      ))}
    </ul>
  );
}

/** A screen's title. At most one word per screen is set in the script, with a hand-drawn stroke under it. */
export function ScreenTitle({ before = '', script, after = '', children }: { before?: string; script?: string; after?: string; children?: ReactNode }) {
  return (
    <header className="mb-5 space-y-2">
      <h2 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-forest text-balance">
        {before}
        {script && <Script>{script}</Script>}
        {after}
      </h2>
      {children && <p className="max-w-[34ch] text-[0.9375rem] leading-relaxed text-ink-soft">{children}</p>}
    </header>
  );
}

export function Script({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-0.5 align-[-0.06em] font-sign text-[2.6rem] font-normal leading-[0.8] tracking-normal text-orange">
      {children}
      <svg aria-hidden="true" viewBox="0 0 120 12" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2.5 w-full overflow-visible">
        <path className="draw" d="M3 8.5C30 3.5 72 2.5 117 6.5" stroke="var(--color-orange-soft)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[20px] bg-paper ring-1 ring-line ${className}`}>{children}</div>;
}

export const FIELD =
  'w-full resize-none rounded-[20px] border border-line bg-paper px-4 py-3.5 [field-sizing:content] min-h-[7.5rem] max-h-[22rem] text-[0.9375rem] leading-relaxed text-slate shadow-[inset_0_1px_2px_rgb(15_46_38/0.05)] transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-muted focus:border-forest/55 focus:outline-none focus:ring-4 focus:ring-forest/10';

export const CHIP =
  'rounded-full bg-paper px-3.5 py-1.5 text-[0.8125rem] font-medium text-forest ring-1 ring-line transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-peach hover:ring-orange-soft active:scale-[0.96]';

/** Plain notes under a control: errors name the problem; confirmations say what changed. */
export function Note({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`step-in flex items-start gap-2 text-sm ${tone === 'error' ? 'text-orange-ink' : 'text-forest'}`}>
      <span className="mt-0.5 shrink-0">{tone === 'error' ? <AlertIcon width={16} height={16} /> : <CheckIcon width={16} height={16} strokeWidth={2.25} />}</span>
      <span>{children}</span>
    </p>
  );
}
