import { ChevronIcon } from '@/components/icons';
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
        <details className="group mt-8 rounded-[20px] bg-paper ring-1 ring-line [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[20px] px-4 py-3.5 text-sm font-semibold text-forest transition-colors duration-200 hover:bg-cream">
            View as AP2 open mandate
            <ChevronIcon width={18} height={18} className="shrink-0 text-muted transition-transform duration-300 ease-out group-open:rotate-90" />
          </summary>
          <div className="px-4 pb-4">
            <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
              Your saved rules in the AP2 v0.2 open Payment Mandate format, valid until {validUntil}. Rules that AP2 has no field for are kept in <code className="rounded bg-cream px-1 font-mono text-[0.75rem]">x_agent_mandates</code>.
            </p>
            <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-cream p-3 font-mono text-[0.6875rem] leading-relaxed text-slate ring-1 ring-line">
              {JSON.stringify(toAp2OpenMandate(rules, { validUntil }), null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}
