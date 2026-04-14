# P7-B8.2-fix2 — Remove All Azure TTS Usage From Frontend

## What
Remove every reference to the Azure TTS `/v1/ai-guide/tts` endpoint from the frontend. Delete the TTS service file, all fetch calls to `/tts`, and all `Audio` playback tied to it. This is the source of the double-speaking bug: Azure TTS plays narration audio while the Realtime model simultaneously speaks the same text.

## Why
Backend logs confirm: every "Su balsu" session fires `POST /v1/ai-guide/tts` before the Realtime session even starts. The frontend fetches Azure audio AND sends the narration to the Realtime model. Two audio streams play. Guarding it is a waste of time — Azure TTS is not used in either mode ("Su balsu" uses OpenAI Realtime, "Be balso" shows text only). Remove it.

## How

1. **Find all TTS references in the frontend.** Search the entire `src/` directory for:
   - Any import or reference to `ttsService` or a TTS service file
   - Any `fetch` calls to `/tts` or `/v1/ai-guide/tts`
   - Any `Audio()` or `audio.play()` related to TTS narration playback
   - Any `isSpeaking` state tied to Azure TTS audio (not the Realtime model)

2. **Delete the TTS service file** if one exists (e.g. `src/services/ttsService.ts` or `src/lib/ttsService.ts`). Remove the entire file.

3. **Remove all TTS fetch calls and audio playback** from `AIGuide.tsx` and any other component that calls `/tts`. This includes:
   - The fetch call itself
   - Any audio element creation / playback
   - Any state variables tracking TTS playback (e.g. `isSpeaking` if it's Azure-specific)
   - Any `useEffect` cleanup that stops TTS audio

4. **Check the Robocat animation.** If the Robocat avatar's speaking animation state (`Chat` state in Rive) was driven by Azure TTS `isSpeaking`, it needs to be rewired to the Realtime model's speaking state — or just left in its default state. Don't break the avatar.

5. **Backend stays untouched.** The `/tts` endpoint, `_azure_tts_sync`, `_generate_tts_bytes`, `lt_text_prep.py` all remain in the backend. They're dead code from the frontend's perspective but removing backend code risks test breakage. Note this in a code comment if desired.

## Constraints

- **Frontend only.** No backend changes.
- **Delete, don't gate.** Remove the code entirely — no `if` guards, no commented-out blocks.
- **Don't break "Be balso" mode.** It shows text narrations only (no audio). Verify it still works after removal.
- **Don't break the Robocat.** If its animation was tied to TTS playback state, handle the rewire or leave it in default state.
- **The `[NARACIJA]` prefix from B8.2-fix stays.** Still useful for the Realtime model.
- **Tests:** Remove any tests that mock/test TTS service calls. Remaining tests must pass. Target: 59 or slightly fewer if TTS-specific tests existed.

## Files to touch

### Delete:
- `src/services/ttsService.ts` (or wherever the TTS service lives — find it)

### Modified:
- `src/components/guide/AIGuide.tsx` — remove all `/tts` fetch calls, TTS audio playback, TTS-related state
- Any other files that import the TTS service

### Not touched:
- Backend (`~/dev/bustodnr`) — no changes
- `src/lib/realtimeVoice.ts` — no changes
- `src/components/QuickScanFlow.tsx` — no changes

## Verification

1. Start "Su balsu" mode. Backend log shows `POST /v1/ai-guide/voice-session` but **zero** `POST /v1/ai-guide/tts` calls.
2. Narration plays exactly once — Realtime model only.
3. Barge-in works cleanly.
4. "Be balso" mode works — text narrations display, no audio (same as before).
5. `grep -r "/tts" src/` returns zero hits (excluding unrelated paths).
6. Build passes, all tests pass.