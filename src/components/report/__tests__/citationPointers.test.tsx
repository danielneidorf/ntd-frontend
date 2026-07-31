// ★ The FRONTEND half of pointer-to-text parity (wave-2 commit 3/5).
//
// The backend proves web and PDF resolve the same „[n]" to the same source. It
// cannot prove what THIS repo does with the numbers, because the web's numbered
// list is assembled here — Citations.tsx concatenates the served segments and
// numbers them by index. So a purely frontend regression is invisible to every
// backend test: re-order the segments, filter one, or drop the household tail,
// and every pointer the backend computed silently points one source off.
//
// This closes that. It renders the real component with the served payload,
// reads the numbered list back OUT OF THE DOM, and resolves each block's
// „Šaltiniai: [n]" pointer against what the browser would actually show.
//
// The mock is a verbatim capture of the backend's dev fixture (see the recipe
// in mockReportData.ts), so the strings are served strings — but note what this
// test is and is not: it certifies the FRONTEND's numbering, not the backend's
// content. Fidelity to the backend is the recipe's job.
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Citations from '../Citations';
import { InfoSection, INFO_SECTION_BODY } from '../InfoSection';
import { MOCK_EXISTING } from '../mockReportData';

const POINTER = /^Šaltiniai: \[\d+\]/;

/** The list exactly as ReportViewer assembles it for Citations. */
function servedSegments() {
  const b2 = MOCK_EXISTING.block2!;
  return {
    block1: MOCK_EXISTING.citations ?? [],
    block2: [
      ...(b2.citations_lt ?? []),
      // ReportViewer appends these while a size is selected, and it preselects
      // standard_occupancy — so on a residential report they are always shown.
      ...(b2.household_modelling?.citation_lt.lines_lt ?? []),
    ],
  };
}

/** Render the bibliography and read position → entry text back out of the DOM. */
function renderedEntriesByPosition(): Map<number, string> {
  const { block1, block2 } = servedSegments();
  const { container } = render(
    <Citations block1Citations={block1} block2CitationsLt={block2} />,
  );
  const byPosition = new Map<number, string>();
  container.querySelectorAll('li').forEach((li) => {
    const text = li.textContent ?? '';
    const n = Number(text.match(/^\s*\[(\d+)\]/)?.[1]);
    if (n) byPosition.set(n, text.replace(/^\s*\[\d+\]\s*/, ''));
  });
  return byPosition;
}

function pointerLine(items: string[] | undefined): string {
  const found = (items ?? []).filter((i) => POINTER.test(i));
  expect(found).toHaveLength(1);
  return found[0];
}

function resolve(line: string, byPosition: Map<number, string>): string[] {
  const numbers = [...line.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  expect(numbers.length).toBeGreaterThan(0);
  return numbers.map((n) => {
    const entry = byPosition.get(n);
    // A pointer past the end of the list would leave the reader hunting for an
    // entry that is not on the page.
    expect(entry, `[${n}] is not in the rendered list`).toBeTruthy();
    return entry!;
  });
}

describe('block „Šaltiniai" pointers resolve against the rendered list', () => {
  it('the comfort box points at the class basis and the comfort norm', () => {
    const byPosition = renderedEntriesByPosition();
    const line = pointerLine(MOCK_EXISTING.block1?.info_box?.items_lt);
    const texts = resolve(line, byPosition).join(' ');

    expect(texts).toContain('STR 2.01.02:2016');
    expect(texts).toContain('HN 42:2009');
    expect(texts).toContain('Pastatų energijos etalonų bazė');
    // This fixture is certificated, so the certificate is the class basis.
    expect(texts).toContain('sertifikatų registras (PENS)');
    // ... and the comfort box does not credit itself with energy-price material.
    expect(texts).not.toContain('PRIDĖTINĖS VERTĖS MOKESČIO');
  });

  it('the energy box points at the prices and forecast basis it used', () => {
    const byPosition = renderedEntriesByPosition();
    const line = pointerLine(MOCK_EXISTING.block2?.info_section?.items_lt);
    const texts = resolve(line, byPosition).join(' ');

    expect(texts).toContain('PRIDĖTINĖS VERTĖS MOKESČIO ĮSTATYMAS'); // the „su PVM" rate
    expect(texts).toContain('ONEBUILDING.ORG'); // the climate basis
    expect(texts).toContain('HICP CP00'); // the inflation floor
    expect(texts).toContain('ŠILUMOS ŪKIO ĮSTATYMAS'); // the CŠT season basis
  });

  it('the pointer line closes each box, so it reads as provenance not content', () => {
    const b1 = MOCK_EXISTING.block1!.info_box!.items_lt;
    const b2 = MOCK_EXISTING.block2!.info_section!.items_lt;
    expect(POINTER.test(b1[b1.length - 1])).toBe(true);
    expect(POINTER.test(b2[b2.length - 1])).toBe(true);
  });

  it('every pointer stays inside the list the reader can see', () => {
    const byPosition = renderedEntriesByPosition();
    const { block1, block2 } = servedSegments();
    expect(byPosition.size).toBe(block1.length + block2.length);

    for (const items of [
      MOCK_EXISTING.block1?.info_box?.items_lt,
      MOCK_EXISTING.block2?.info_section?.items_lt,
    ]) {
      for (const n of [...pointerLine(items).matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]))) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(byPosition.size);
      }
    }
  });

  it('every household option carries the same pointer line as the default view', () => {
    // The section is composed once in the backend and shared by every size —
    // the sources a report rests on do not change because the reader picked a
    // different household. A per-option divergence would mean the box was
    // rebuilt somewhere it should not have been.
    const base = pointerLine(MOCK_EXISTING.block2?.info_section?.items_lt);
    const options = MOCK_EXISTING.block2?.household_modelling?.options ?? [];
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(pointerLine(option.info_section?.items_lt)).toBe(base);
    }
  });
});

describe('the pointer line survives into the DOM the customer reads', () => {
  // Both boxes route through the shared collapsible idiom, which renders its
  // children as plain paragraphs. Mounting it with the served items is the
  // frontend's own boundary crossing: the served string is in the payload, this
  // proves it reaches the document rather than being filtered on the way.
  const boxes: Array<[string, () => string[]]> = [
    ['comfort box', () => MOCK_EXISTING.block1!.info_box!.items_lt],
    ['energy box', () => MOCK_EXISTING.block2!.info_section!.items_lt],
  ];

  it.each(boxes)('%s renders its pointer as the closing paragraph', (_label, getItems) => {
    const items = getItems();
    const { container } = render(
      <InfoSection>
        <div className={INFO_SECTION_BODY}>
          {items.map((item: string, i: number) => (
            <p key={i} className="whitespace-pre-line">{item}</p>
          ))}
        </div>
      </InfoSection>,
    );
    const paragraphs = [...container.querySelectorAll('p')].map((p) => p.textContent ?? '');
    expect(paragraphs).toHaveLength(items.length);
    expect(POINTER.test(paragraphs[paragraphs.length - 1])).toBe(true);
  });

  it('children stay in the document while the box is collapsed', () => {
    // Collapsed by default (ruling 2026-07-25) via max-height/opacity, not
    // unmounting — so the pointer is present for copy, search and assistive
    // tech even before the reader expands the box. If the collapse ever became
    // a conditional render, this catches it.
    const { container } = render(
      <InfoSection>
        <p>Šaltiniai: [2], [3]</p>
      </InfoSection>,
    );
    expect(container.textContent).toContain('Šaltiniai: [2], [3]');
  });
});
