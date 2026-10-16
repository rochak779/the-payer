import { AskAgent } from './AskAgent';

export default function AskPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Ask the agent</h2>
      <p className="text-sm text-neutral-600">The agent finds an option and asks to buy it. It never sees your card.</p>
      <AskAgent />
    </div>
  );
}
