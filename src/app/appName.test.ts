import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The layout can't be imported in a test (next/font needs Next's compiler), so these read the source.
const SRC = fileURLToPath(new URL('..', import.meta.url));
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(path.join(dir, e.name))
      : /\.(ts|tsx|json)$/.test(e.name) && !e.name.endsWith('.test.ts') ? [path.join(dir, e.name)]
        : [],
  );

describe('the app name', () => {
  it('is "The Payer" in the browser tab and the header', () => {
    const layout = readFileSync(path.join(SRC, 'app', 'layout.tsx'), 'utf8');
    expect(layout).toContain("title: 'The Payer'");
    expect(layout).toMatch(/>The Payer<\/h1>/);
  });

  it('no screen, message or export uses the old name "Agent Mandates"', () => {
    const files = sourceFiles(SRC);
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter((f) => readFileSync(f, 'utf8').includes('Agent Mandates')).map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
