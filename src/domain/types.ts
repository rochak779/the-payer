import { z } from 'zod';

export const Currency = z.enum(['GBP', 'EUR', 'USD']);
export type Currency = z.infer<typeof Currency>;

/** Always integer minor units (pence/cents). */
export const Money = z.object({
  minor: z.number().int().nonnegative(),
  currency: Currency,
});
export type Money = z.infer<typeof Money>;

export const Category = z.enum([
  'hotel', 'flight', 'train', 'restaurant', 'groceries', 'electronics',
  'clothing', 'gift_card', 'subscription', 'event_ticket', 'home', 'other',
]);
export type Category = z.infer<typeof Category>;

export const Outcome = z.enum(['approve', 'ask', 'block']);
export type Outcome = z.infer<typeof Outcome>;

/** What a breached rule does. Never 'approve': rules can only tighten. */
export const OnBreach = z.enum(['ask', 'block']);
export type OnBreach = z.infer<typeof OnBreach>;

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const ruleBase = {
  id: z.string().min(1),
  source: z.string(), // the user's own words
  onBreach: OnBreach,
};

export const AmountCapRule = z.object({
  ...ruleBase,
  kind: z.literal('amount_cap'),
  max: Money,
  per: z.enum(['purchase', 'unit']),
  unitLabel: z.string().optional(),
  category: Category.optional(),
});
export const MerchantRule = z.object({
  ...ruleBase,
  kind: z.literal('merchant'),
  mode: z.enum(['allow_only', 'block']),
  merchants: z.array(z.string().min(1)).min(1),
});
export const CategoryRule = z.object({
  ...ruleBase,
  kind: z.literal('category'),
  mode: z.enum(['allow_only', 'block']),
  categories: z.array(Category).min(1),
});
export const DateWindowRule = z.object({
  ...ruleBase,
  kind: z.literal('date_window'),
  from: IsoDate,
  to: IsoDate,
});
export const JudgementRule = z.object({
  ...ruleBase,
  kind: z.literal('judgement'),
  text: z.string().min(1),
});

export const Rule = z.discriminatedUnion('kind', [
  AmountCapRule, MerchantRule, CategoryRule, DateWindowRule, JudgementRule,
]);
export type Rule = z.infer<typeof Rule>;
export type AmountCapRule = z.infer<typeof AmountCapRule>;
export type MerchantRule = z.infer<typeof MerchantRule>;
export type CategoryRule = z.infer<typeof CategoryRule>;
export type DateWindowRule = z.infer<typeof DateWindowRule>;
export type JudgementRule = z.infer<typeof JudgementRule>;
export type HardRule = Exclude<Rule, JudgementRule>;

export const PurchaseRequest = z.object({
  item: z.string().min(1),
  merchant: z.string().min(1),
  category: Category,
  total: Money, // full amount the person pays
  units: z.number().int().positive().optional(), // e.g. nights
  unitLabel: z.string().optional(), // e.g. "night"
  refundPolicy: z.string(), // verbatim from the listing, '' if not stated
  url: z.string().url().refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) link'),
  purchaseDate: IsoDate,
  agentNote: z.string(), // the agent's own words: untrusted
  listingText: z.string(), // raw merchant text: untrusted
});
export type PurchaseRequest = z.infer<typeof PurchaseRequest>;

export type Reason = {
  ruleId: string | null;
  by: 'code' | 'ai' | 'system';
  outcome: Outcome;
  message: string;
};

export type Decision = {
  outcome: Outcome;
  reasons: Reason[];
  summary: string;
  checker: string; // which fuzzy checker ran, e.g. "keyword-baseline"
};

export type ApprovalStatus = 'pending' | 'approved' | 'declined' | 'blocked' | 'used' | 'revoked';
export type RailName = 'fake' | 'stripe' | 'paypal';
/** How an approved purchase is paid: a one-time payment the agent never sees. */
export type PaymentRef = { id: string; label: string; provider: RailName };

export type Approval = {
  id: string;
  request: PurchaseRequest;
  decision: Decision;
  status: ApprovalStatus;
  approvedBy: 'rules' | 'user' | null;
  createdAt: string;
  decidedAt: string | null;
  expiresAt: string | null; // set when approved
  payment: PaymentRef | null;
};

export type LogType =
  | 'decision' | 'user_approved' | 'user_declined' | 'payment_opened'
  | 'charge_approved' | 'charge_declined' | 'paid' | 'refunded' | 'agent_off' | 'agent_on'
  | 'rules_saved' | 'error';

export type LogEntry = { id: string; at: string; type: LogType; approvalId: string | null; message: string };

export type RunEventKind = 'status' | 'search' | 'found' | 'request' | 'decision' | 'error';
export type RunEvent = { at: string; kind: RunEventKind; text: string };
export type Run = {
  id: string;
  task: string;
  status: 'running' | 'done' | 'failed';
  createdAt: string;
  events: RunEvent[];
  approvalIds: string[];
};

export type Settings = { agentEnabled: boolean };
