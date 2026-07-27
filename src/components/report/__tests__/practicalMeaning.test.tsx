/**
 * „Ką tai reiškia praktiškai?" — the descriptions moved here (2026-07-22).
 *
 * The bars keep bar + verdict + chips; the practical prose lives in the
 * section whose heading promises it. Each paragraph names its season, since
 * detached from its bar it no longer inherits one. Pinned as EXACTLY ONE
 * render site per paragraph — if both locations show it, the move failed.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MOCK_EXISTING } from '../mockReportData';
import { SummarySection } from '../../ReportViewer';

const WINTER_DESC =
  MOCK_EXISTING.block1.winter!.rows!.find((r) => r.highlighted)!.description_lt!;
const SUMMER_DESC =
  MOCK_EXISTING.block1.summer!.rows!.find((r) => r.highlighted)!.description_lt!;

function renderReport() {
  // ReportViewer fetches by token and takes no props; the house pattern is to
  // mount the exported section directly (as DriversSection's tests do).
  return render(
    <SummarySection
      winter={MOCK_EXISTING.block1.winter!}
      summer={MOCK_EXISTING.block1.summer!}
    />,
  );
}

function countOccurrences(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll('p')).filter(
    (p) => (p.textContent ?? '').trim() === text.trim(),
  ).length;
}

describe('practical-meaning section (2026-07-22 relocation)', () => {
  it('renders each season description exactly once', () => {
    const { container } = renderReport();
    expect(countOccurrences(container, WINTER_DESC)).toBe(1);
    expect(countOccurrences(container, SUMMER_DESC)).toBe(1);
  });

  it('puts both paragraphs inside the section, not under the bars', () => {
    const { container } = renderReport();
    const section = container.querySelector('[data-practical-meaning]');
    expect(section).toBeTruthy();
    expect(section!.textContent).toContain(WINTER_DESC);
    expect(section!.textContent).toContain(SUMMER_DESC);
  });

  it('names each season, since the paragraphs left their bars', () => {
    const { container } = renderReport();
    const section = container.querySelector('[data-practical-meaning]') as HTMLElement;
    expect(within(section).getByText('Žiema')).toBeTruthy();
    expect(within(section).getByText('Vasara')).toBeTruthy();
  });

  it('the winter comparison lines travel with the winter paragraph', () => {
    const { container } = renderReport();
    const section = container.querySelector('[data-practical-meaning]') as HTMLElement;
    const lines = container.querySelectorAll('[data-winter-comparison]');
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((line) => expect(section.contains(line)).toBe(true));
  });

  it('the comparison lines share the description body typography, not the old footnote style', () => {
    // Regression pin for the 2026-07-27 harmonisation: detached into „Ką tai
    // reiškia praktiškai?", the etalon comparison lines adopt the description
    // paragraph's size + colour (one section voice) — they no longer render in
    // the smaller/lighter under-the-bar footnote style (text-sm / slate-600).
    const { container } = renderReport();
    const winter = container.querySelector('[data-season="winter"]') as HTMLElement;
    const descP = Array.from(winter.querySelectorAll('p')).find(
      (p) => (p.textContent ?? '').trim() === WINTER_DESC.trim(),
    )!;
    const comparison = winter.querySelector('[data-winter-comparison]') as HTMLElement;
    // the description carries the body size + colour …
    expect(descP.className).toContain('text-base');
    expect(descP.className).toContain('text-slate-700');
    // … and the comparison line now matches it, having shed the footnote pair.
    expect(comparison.className).toContain('text-base');
    expect(comparison.className).toContain('text-slate-700');
    expect(comparison.className).not.toContain('text-sm');
    expect(comparison.className).not.toContain('text-slate-600');
  });

  it('the section is open by default — the move must not hide shipped content', () => {
    const { container } = renderReport();
    const section = container.querySelector('[data-practical-meaning]') as HTMLElement;
    const panel = section.querySelector('div.overflow-hidden') as HTMLElement;
    expect(panel.style.opacity).toBe('1');
    expect(panel.style.maxHeight).not.toBe('0');
  });

  it('the ordinal recap is extinct', () => {
    const { container } = renderReport();
    expect(container.textContent).not.toMatch(/Šiluminis komfortas\s*\d/);
  });
});
