import { PlusIcon } from '@/components/icons';
import { ScreenTitle } from '@/components/ui';
import { defaultValidUntil, toAp2OpenMandate } from '@/rules/ap2';
import { checkedBy, explainRule } from '@/rules/explain';
import { currentStore } from '@/store/visitor';
import { RulesEditor } from './RulesEditor';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const rules = (await currentStore()).read().rules;
  const saved = rules.map((rule) => ({ rule, explanation: explainRule(rule), checkedBy: checkedBy(rule) }));
  const initialText = [...new Set(rules.map((r) => r.source))].join('\n');
  const validUntil = defaultValidUntil(rules);
  return (
    <div>
      <ScreenTitle before="Your rules">
        Write them the way you’d tell a person. I’ll show you how I read them before anything is saved.
      </ScreenTitle>
      <RulesEditor initialText={initialText} saved={saved} />
      {rules.length > 0 && (
        <details className="group mt-10 border-y border-dashed border-rule [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 font-display text-base font-extrabold tracking-[-0.02em] text-ink transition-colors duration-200 hover:text-brown">
            View as AP2 open mandate
            <PlusIcon width={20} height={20} strokeWidth={2} className="shrink-0 transition-transform duration-[250ms] ease-out group-open:rotate-45" />
          </summary>
          <div className="pb-4">
            <p className="text-[0.8125rem] leading-relaxed text-muted">
              Your saved rules in the AP2 v0.2 open Payment Mandate format, valid until {validUntil}. Rules that AP2 has no field for are kept in <code className="rounded-[4px] bg-surface px-1 font-mono text-[0.75rem] text-ink">x_agent_mandates</code>.
            </p>
            <pre className="mt-3 max-h-80 overflow-auto rounded-[4px] border border-line bg-surface p-3 font-mono text-[0.6875rem] leading-relaxed text-ink">
              {JSON.stringify(toAp2OpenMandate(rules, { validUntil }), null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}
