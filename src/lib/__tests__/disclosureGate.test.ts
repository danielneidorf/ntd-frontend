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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

// ─── Realtime GA endpoints (2026-08-03) ─────────────────────────────────────
//
// Source-level guards, and the limitation is stated rather than hidden: these
// assert what our code CALLS, not that the vendor still answers it. Only
// `scripts/smoke_voice_session.py` (bustodnr) crosses that boundary. This pair
// exists because both halves of the voice handshake were silently retired by
// OpenAI on the same day, and a mocked suite cannot see that.
describe('Realtime GA endpoints', () => {
  const src = readFileSync(
    join(process.cwd(), 'src/lib/realtimeVoice.ts'),
    'utf8',
  );
  // Strip comments — the beta URLs are quoted there deliberately, as the record
  // of what was probed, and must not trip the guard.
  const code = src
    .split('\n')
    .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    .join('\n');

  it('exchanges SDP against the GA calls endpoint', () => {
    expect(code).toContain('https://api.openai.com/v1/realtime/calls');
  });

  it('does not send the model in the SDP URL (the disabled beta shape)', () => {
    // `/v1/realtime?model=…` returns 400 beta_api_shape_disabled. Under GA the
    // model comes from the session the ephemeral key was minted against.
    expect(code).not.toMatch(/v1\/realtime\?model=/);
  });

  it('mints the token through our own backend, never OpenAI directly', () => {
    // The ephemeral key must be minted server-side; a browser holding the real
    // API key would be a credential leak, not just an architecture slip.
    expect(code).toContain('/v1/ai-guide/voice-session');
    expect(code).not.toMatch(/api\.openai\.com\/v1\/realtime\/client_secrets/);
  });
});
