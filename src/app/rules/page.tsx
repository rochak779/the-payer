import { defaultValidUntil, toAp2OpenMandate } from '@/rules/ap2';
import { checkedBy, explainRule } from '@/rules/explain';
import { defaultStore } from '@/store/store';
import { RulesEditor } from './RulesEditor';

export const dynamic = 'force-dynamic';

export default function RulesPage() {
  const rules = defaultStore().read().rules;
  const saved = rules.map((rule) => ({ rule, explanation: explainRule(rule), checkedBy: checkedBy(rule) }));
  const initialText = [...new Set(rules.map((r) => r.source))].join('\n');
  const validUntil = defaultValidUntil(rules);
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Your rules</h2>
      <p className="text-sm text-neutral-600">Write them the way you’d tell a person. I’ll show you how I read them before anything is saved.</p>
      <RulesEditor initialText={initialText} saved={saved} />
      {rules.length > 0 && (
        <details className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-neutral-200">
          <summary className="cursor-pointer font-medium">View as AP2 open mandate</summary>
          <p className="mt-2 text-xs text-neutral-500">
            Your saved rules in the AP2 v0.2 open Payment Mandate format, valid until {validUntil}. Rules AP2 has no field for travel in <code>x_agent_mandates</code>.
          </p>
          <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(toAp2OpenMandate(rules, { validUntil }), null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
