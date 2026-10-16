import type { Rule } from '@/domain/types';

export interface RuleParser {
  readonly name: string;
  /** Plain English → rules. Anything not exactly expressible becomes a judgement rule. */
  parse(text: string): Promise<Rule[]>;
}
