// AI Act Art. 50(1) — guards for the disclosure surface.
//
// These exist because every failure mode here is SILENT: a badge that quietly
// reverts to a hover tooltip, a string that drifts out of the constants module,
// a model turn that lands on top of the spoken disclosure. Nothing errors; the
// disclosure just stops disclosing. Each guard below is written so that the
// reversion it protects against actually fails it.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AVATAR_BADGE_LABEL,
  CHAT_DISCLOSURE_LINE,
  GUIDE_CARD_TITLE,
  GUIDE_DISCLOSURE_SENTENCE,
  VOICE_DISCLOSURE_SPOKEN,
} from '../../../lib/disclosure';
import ChatInputCard from '../ChatInputCard';

const COMPONENTS_DIR = join(process.cwd(), 'src/components');
const PAGES_DIR = join(process.cwd(), 'src/pages');

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : walk(p);
    return /\.(tsx?|astro)$/.test(e.name) ? [p] : [];
  });
}

const COMPONENT_FILES = walk(COMPONENTS_DIR);
/** Every customer-facing surface: components AND pages. Pages carry the legal
 *  copy, which is where the last „AI" string lived until Part B replaced it. */
const CUSTOMER_FACING_FILES = [...COMPONENT_FILES, ...walk(PAGES_DIR)];

describe('A6 — single origin', () => {
  const STRINGS = [
    ['GUIDE_CARD_TITLE', GUIDE_CARD_TITLE],
    ['GUIDE_DISCLOSURE_SENTENCE', GUIDE_DISCLOSURE_SENTENCE],
    ['AVATAR_BADGE_LABEL', AVATAR_BADGE_LABEL],
    ['CHAT_DISCLOSURE_LINE', CHAT_DISCLOSURE_LINE],
    ['VOICE_DISCLOSURE_SPOKEN', VOICE_DISCLOSURE_SPOKEN],
  ] as const;

  // Asserts on the component SOURCES, not on the module echoing itself — a test
  // whose fixture is the thing under test proves only that it equals itself.
  it.each(STRINGS)('nothing hardcodes %s', (_name, value) => {
    const offenders = CUSTOMER_FACING_FILES.filter((f) =>
      readFileSync(f, 'utf8').includes(value),
    );
    expect(offenders).toEqual([]);
  });

  it('every disclosure string is non-empty', () => {
    for (const [name, value] of STRINGS) {
      expect(value.trim(), `${name} is empty`).not.toHaveLength(0);
    }
  });
});

describe('A2b — no rendered „AI" left on customer-facing surfaces', () => {
  // Covers src/components AND src/pages. It was scoped to components only while
  // ToS §7.7 still said „AI gido"; Part B replaced that clause, so the reason for
  // the narrow scope is gone and the guard now covers every rendered surface.
  //
  // EXEMPTION MECHANISM — read this before extending. Two filters, in order:
  //   1. Line filter: lines whose first non-space characters are `//` or `*` are
  //      dropped, so JS line comments and JSDoc/HTML-comment bodies are exempt.
  //   2. Regex shape: only `AI` inside a rendered position matches — the value of
  //      a title/aria-label/placeholder attribute, or a text node between tags.
  // Everything else is exempt by construction: identifiers (`AIGuide`,
  // `AIGuideToggle`), import paths, className strings, and prop names never sit
  // in a rendered position. That is the intended line — component and variable
  // names may keep `AI`; anything a customer can read may not. The regex is
  // deliberately shallow; if a future surface renders `AI` some other way (a
  // template literal built at runtime, say), this will not catch it, and the
  // guard should be widened rather than trusted blindly.
  it('nothing renders a bare "AI" token in a user-visible string', () => {
    const pattern = /(?:title|aria-label|placeholder)="[^"]*\bAI\b|>[^<]*\bAI\b[^<]*</;
    const offenders = CUSTOMER_FACING_FILES.filter((f) => {
      const src = readFileSync(f, 'utf8')
        .split('\n')
        .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
        .join('\n');
      return pattern.test(src);
    });
    expect(offenders).toEqual([]);
  });

  it('the unmounted AIAvatar component is gone, not translated', () => {
    expect(COMPONENT_FILES.some((f) => f.endsWith('AIAvatar.tsx'))).toBe(false);
  });
});

describe('A1 — the avatar badge is persistent, not hover-gated', () => {
  const toggleSrc = readFileSync(
    join(COMPONENTS_DIR, 'guide/AIGuideToggle.tsx'),
    'utf8',
  );
  const avatarSrc = readFileSync(
    join(COMPONENTS_DIR, 'guide/RiveAvatar.tsx'),
    'utf8',
  );

  it('renders the badge outside the open/active conditionals', () => {
    // The badge sits in the always-rendered avatar container. If someone moves
    // it inside `{open && ...}` it stops reaching users who never open the card.
    const badgeIdx = toggleSrc.indexOf('di-disclosure-badge');
    const cardIdx = toggleSrc.indexOf('{open && !active && (');
    expect(badgeIdx).toBeGreaterThan(-1);
    expect(badgeIdx).toBeGreaterThan(cardIdx);
  });

  it('does not reintroduce a title-attribute tooltip on the avatar', () => {
    // The whole defect A1 fixes: `title` renders only on hover, and sighted
    // touch users have no hover event at all.
    expect(avatarSrc).not.toMatch(/title=/);
  });

  it('keeps the aria-label so screen-reader users do not regress', () => {
    expect(avatarSrc).toMatch(/aria-label=\{AVATAR_BADGE_LABEL\}/);
  });
});

describe('A3 — the chat box discloses on its own', () => {
  it('renders the disclosure line beneath the input', () => {
    render(
      <ChatInputCard chatHistory={[]} chatLoading={false} onSend={vi.fn()} />,
    );
    expect(screen.getByTestId('di-chat-disclosure')).toHaveTextContent(
      CHAT_DISCLOSURE_LINE,
    );
  });

  it('still renders it in voice mode', () => {
    render(
      <ChatInputCard
        chatHistory={[]}
        chatLoading={false}
        onSend={vi.fn()}
        voiceMode
        voiceConciergeActive
      />,
    );
    expect(screen.getByTestId('di-chat-disclosure')).toHaveTextContent(
      CHAT_DISCLOSURE_LINE,
    );
  });
});
