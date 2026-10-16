/** "Hotel Príncipe-Real" -> ["hotel", "principe", "real"] */
function words(s: string): string[] {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** True if `pattern` names the same merchant: whole words in order, ignoring case, punctuation and accents. */
export function merchantMatches(merchant: string, pattern: string): boolean {
  const m = words(merchant);
  const p = words(pattern);
  if (p.length === 0) return false;
  if (m.join('') === p.join('')) return true;
  for (let i = 0; i + p.length <= m.length; i++) {
    if (p.every((w, j) => m[i + j] === w)) return true;
  }
  return false;
}
