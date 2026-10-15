import type { RuleParser } from './parser';
import { patternParser } from './patternParser';

export function getRuleParser(name: string): RuleParser {
  switch (name) {
    case 'pattern':
      return patternParser;
    default:
      throw new Error(`Unknown parser "${name}". Options: pattern`);
  }
}
