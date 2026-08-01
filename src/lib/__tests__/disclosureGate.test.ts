// A4.2 — the model's first turn must not fire before the Art. 50 disclosure is
// on screen.
//
// Art. 50(1) wants the person informed at the latest at first interaction. That
// is an ordering property, and ordering bugs are silent: the disclosure and the
// greeting both "work", they just land in the wrong order, intermittently. So it
// is asserted at the boundary that decides it — the data channel. If no
// `response.create` crosses the wire while the gate is shut, the model cannot
// have spoken.
//
// (This gate originally waited on a spoken clip; the clip was deferred to
// backlog 2026-07-31 and the gate was repointed at the on-screen line. The
// ordering guarantee is what survived, and it is what these tests pin.)
import { describe, expect, it, vi } from 'vitest';

import { RealtimeVoice } from '../realtimeVoice';

vi.mock('../guideAnalytics', () => ({ analytics: { track: vi.fn() } }));

/** Minimal fake of the OpenAI data channel — records what was sent. */
function fakeChannel() {
  return { readyState: 'open', send: vi.fn(), close: vi.fn() };
}

function withChannel() {
  const rt = new RealtimeVoice();
  const ch = fakeChannel();
  (rt as unknown as { dc: unknown }).dc = ch;
  return { rt, ch };
}

function sentTypes(ch: ReturnType<typeof fakeChannel>): string[] {
  return ch.send.mock.calls.map((c) => JSON.parse(c[0] as string).type);
}

describe('A4.2 — first-turn gate', () => {
  it('holds sendNarration until the disclosure is shown, then releases it', async () => {
    const { rt, ch } = withChannel();

    const pending = rt.sendNarration('Čia matote jūsų pastato duomenis.');
    await Promise.resolve();

    // Gate shut: nothing has reached the wire, so the model cannot be speaking.
    expect(sentTypes(ch)).toEqual([]);

    rt.markDisclosureShown();
    await pending;

    // Gate open: the narration item and its response trigger both land.
    expect(sentTypes(ch)).toContain('conversation.item.create');
    expect(sentTypes(ch)).toContain('response.create');
  });

  it('holds sendTextPrompt too — a user typing must not jump the gate', async () => {
    const { rt, ch } = withChannel();

    // The reason the gate lives inside RealtimeVoice rather than in the caller:
    // gating only the narration path would leave this one open.
    const pending = rt.sendTextPrompt('Kiek kainuoja ataskaita?');
    await Promise.resolve();
    expect(sentTypes(ch)).toEqual([]);

    rt.markDisclosureShown();
    await pending;
    expect(sentTypes(ch)).toContain('response.create');
  });

  it('releases anything queued when the session is torn down', async () => {
    const { rt, ch } = withChannel();

    // A user who aborts before the disclosure rendered must not strand a
    // narration awaiting a promise that can no longer resolve.
    const pending = rt.sendNarration('Sveiki.');
    rt.disconnect();
    await pending;

    // disconnect() nulls the channel, so nothing is sent — the point is that the
    // await returns at all rather than hanging forever.
    expect(sentTypes(ch)).toEqual([]);
  });
});
