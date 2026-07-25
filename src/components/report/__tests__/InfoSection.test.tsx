import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InfoSection, INFO_SECTION_TITLE } from '../InfoSection';

// The ONE collapsible „what we based this on" idiom, shared by Block 1's basis
// box and Block 2's merged section (ruling 2026-07-25). The backend mirrors
// INFO_SECTION_TITLE; a backend test pins the two equal.
describe('InfoSection — the shared info idiom', () => {
  it('is collapsed by default and its header is a real, named control', () => {
    const { container } = render(<InfoSection><p>body</p></InfoSection>);
    const btn = container.querySelector('button')!;
    // Collapsed on load (ruling 2026-07-25) — the header is the only trace, so
    // it must read as clickable (a <button>, not a bare heading).
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.textContent).toContain(INFO_SECTION_TITLE);
  });

  it('toggles open and closed', () => {
    const { container } = render(<InfoSection><p>body</p></InfoSection>);
    const btn = container.querySelector('button')!;
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('one title spelling — the constant, not three drifting strings', () => {
    // The retired titles must never be reintroduced here.
    expect(INFO_SECTION_TITLE).toBe('Kokia informacija remiamės?');
    const { container } = render(<InfoSection><p>x</p></InfoSection>);
    const text = container.textContent ?? '';
    expect(text).not.toContain('Iš ko remiamės');
    expect(text).not.toContain('Duomenų šaltiniai');
  });
});
