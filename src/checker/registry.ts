import type { FuzzyChecker } from './fuzzy';
import { keywordChecker } from './keywordChecker';

export function getFuzzyChecker(name: string): FuzzyChecker {
  switch (name) {
    case 'keyword':
      return keywordChecker;
    default:
      throw new Error(`Unknown checker "${name}". Options: keyword`);
  }
}
