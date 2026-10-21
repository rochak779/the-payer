import { ScreenTitle } from '@/components/ui';
import { SUGGESTED_TASKS } from '@/demo/demoContent';
import { AskAgent } from './AskAgent';

export default function AskPage() {
  return (
    <div>
      <ScreenTitle before="Ask the " script="agent">
        The agent finds an option and asks to buy it. It never sees how you pay.
      </ScreenTitle>
      <AskAgent suggestions={SUGGESTED_TASKS} />
    </div>
  );
}
