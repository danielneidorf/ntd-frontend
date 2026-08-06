/**
 * The browser's share of the ruled vocabulary — read from the ruling itself.
 *
 * THE SPLIT GUARD, AND WHY IT IS SPLIT
 * ====================================
 * The gate's strings live in one document. Most of them are backend-served and
 * a backend guard asserts them there. Four are authored here, in the order
 * flow's own Lithuanian — deliberately, because the backend-origin rule governs
 * REPORT surfaces and the journey's copy is parked for its own sitting. So the
 * vocabulary spans two repos, and the guard has to as well.
 *
 * BOTH HALVES READ THE SAME FILE. A pasted copy of gated strings is the exact
 * disease this mechanism exists to cure: it would agree with the ruling on the
 * day it was pasted and drift silently afterwards. The repos are siblings
 * (`~/dev/bustodnr`, `~/dev/ntd`), so this reads the ruling across the boundary
 * rather than keeping a second copy of the customer's words.
 *
 * If the file is unreachable this FAILS rather than skips. A skipped guard over
 * gated copy is the disease wearing a green coat — the suite would look healthy
 * while nothing was checked. The documented fallback, if the sibling layout ever
 * stops holding, is a derived copy hash-pinned against the original so that
 * divergence reddens; it is not needed today.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RULING = resolve(HERE, '../../../../bustodnr/docs/tasks/Recalc_gate_ruled_34.md');
const COMPONENT = resolve(HERE, '../QuickScanFlow.tsx');

/** The ruled strings, keyed by number — the same parse the backend guard makes. */
function parseRuling(text: string): Map<number, string> {
  const ruled = new Map<number, string>();
  let current: number | null = null;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    // Attribution stops at the entry boundary, so prose that follows an entry
    // — including the disposition note — can never be read as a ruling.
    if (trimmed.startsWith('---') || trimmed.startsWith('#') || trimmed.startsWith('**')) {
      current = null;
      continue;
    }
    const numbered = /^(\d+)\./.exec(trimmed);
    if (numbered) current = Number(numbered[1]);
    if (current === null) continue;
    const quoted = [...line.matchAll(/„([^„"]+)"/g)].map((m) => m[1]);
    if (quoted.length) ruled.set(current, quoted[quoted.length - 1]);
  }
  return ruled;
}

describe('the browser speaks only ruled words', () => {
  it('★ can reach the ruling — a missing fixture fails, it never skips', () => {
    expect(
      existsSync(RULING),
      `the ruling was not found at ${RULING}. The repos are expected to be ` +
        'siblings; if that has changed, the fallback is a hash-pinned derived ' +
        'copy — never a pasted one.',
    ).toBe(true);
  });

  it('parses the whole contract, and not the prose around it', () => {
    const ruled = parseRuling(readFileSync(RULING, 'utf8'));
    expect([...ruled.keys()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 38 }, (_, i) => i + 1),
    );
    // The disposition note quotes a sentence that is deliberately NOT ruled.
    for (const value of ruled.values()) {
      expect(value).not.toContain('Nemokamo užsakymo patvirtinti negalime');
    }
  });

  it.each([
    [1, 'the certificate field label'],
    [2, 'the field helper'],
    [3, 'the format hint'],
    [19, 'the skip-without-certificate warning'],
  ])('★ renders №%i verbatim — %s', (number) => {
    const ruled = parseRuling(readFileSync(RULING, 'utf8'));
    const source = readFileSync(COMPONENT, 'utf8');
    const expected = ruled.get(number as number)!;

    expect(expected, `the ruling has no №${number}`).toBeTruthy();
    expect(
      source.includes(expected),
      `№${number} is not in the component character-for-character.\n` +
        `ruled: ${expected}`,
    ).toBe(true);
  });

  it('★ the wordings these replaced are gone', () => {
    const source = readFileSync(COMPONENT, 'utf8');
    for (const retired of [
      'Sertifikato numeris (pasirinktinai)',
      'Jei sertifikatas nuskenuotas, įveskite jo numerį',
      'Formatas: AD-0119-03384 arba 1095-8025-2026',
    ]) {
      expect(source).not.toContain(retired);
    }
  });
});
