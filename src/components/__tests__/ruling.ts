/**
 * The gate ruling, read across the repo boundary — ONE parser for the browser.
 *
 * The repos are siblings (`~/dev/bustodnr`, `~/dev/ntd`) and the ruling document
 * is the fixture: guards read it directly rather than keeping a pasted copy,
 * which would agree with the ruling on the day it was pasted and drift silently
 * afterwards.
 *
 * WHY THIS FILE EXISTS RATHER THAN A SECOND COPY OF THE PARSE. The backend's own
 * guard proves its parser careful in a dedicated test (`test_recalc_gate_parser`)
 * because the pattern's weak point IS the reader. Two readers of one document is
 * the same defect one rung up: they agree until one is fixed. So the browser has
 * one, here, and every frontend guard over gated copy imports it.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const RULING = resolve(
  HERE,
  '../../../../bustodnr/docs/tasks/Recalc_gate_ruled_34.md',
);

/** The ruled strings, keyed by number — the same parse the backend guard makes. */
export function parseRuling(text: string): Map<number, string> {
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

/**
 * One ruled string, by number.
 *
 * FAILS rather than skips when the ruling is unreachable. A skipped guard over
 * gated copy is the disease wearing a green coat — the suite would look healthy
 * while nothing was checked.
 */
export function ruled(number: number): string {
  if (!existsSync(RULING)) {
    throw new Error(
      `the ruling was not found at ${RULING}. The repos are expected to be ` +
        'siblings; if that has changed, the fallback is a hash-pinned derived ' +
        'copy — never a pasted one.',
    );
  }
  const value = parseRuling(readFileSync(RULING, 'utf8')).get(number);
  if (!value) throw new Error(`the ruling has no №${number}`);
  return value;
}
