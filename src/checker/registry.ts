import { createClaudeFuzzyChecker } from '@/integrations/claude/fuzzyChecker';
import type { FuzzyChecker } from './fuzzy';
import { keywordChecker } from './keywordChecker';

export function getFuzzyChecker(name: string): FuzzyChecker {
  switch (name) {
    case 'keyword':
      return keywordChecker;
    case 'claude':
      return createClaudeFuzzyChecker();
    case 'claude-haiku':
      return createClaudeFuzzyChecker({ model: 'claude-haiku-5-5' });
    default:
      throw new Error(`Unknown checker "${name}". Options: keyword, claude, claude-haiku`);
  }
}
