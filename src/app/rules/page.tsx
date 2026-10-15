import { checkedBy, explainRule } from '@/rules/explain';
import { defaultStore } from '@/store/store';
import { RulesEditor } from './RulesEditor';

export const dynamic = 'force-dynamic';

export default function RulesPage() {
  const rules = defaultStore().read().rules;
  const saved = rules.map((rule) => ({ rule, explanation: explainRule(rule), checkedBy: checkedBy(rule) }));
  const initialText = [...new Set(rules.map((r) => r.source))].join('\n');
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Your rules</h2>
      <p className="text-sm text-neutral-600">Write them the way you’d tell a person. I’ll show you how I read them before anything is saved.</p>
      <RulesEditor initialText={initialText} saved={saved} />
    </div>
  );
}
