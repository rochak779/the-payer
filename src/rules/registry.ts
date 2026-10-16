import { createClaudeRuleParser } from '@/integrations/claude/ruleParser';
import { createGeminiRuleParser } from '@/integrations/gemini/ruleParser';
import type { RuleParser } from './parser';
import { patternParser } from './patternParser';

export function getRuleParser(name: string): RuleParser {
  switch (name) {
    case 'pattern':
      return patternParser;
    case 'claude':
      return createClaudeRuleParser();
    case 'gemini':
      return createGeminiRuleParser();
    default:
      throw new Error(`Unknown parser "${name}". Options: pattern, claude, gemini`);
  }
}
