# P7-B7.3: Voice Pipeline Optimization — Latency + Accent

## What
Five incremental improvements to the working voice concierge pipeline, in order. Each is small and independently testable. Combined target: latency from ~2.5-5s to ~1.2-2s, and better Lithuanian accent.

**IMPORTANT:** Keep `eleven_v3` as the TTS model. Do NOT switch to `eleven_multilingual_v2` — we tested it and it was worse for Lithuanian.

## Changes (in order)

### 1. Add per-stage latency timestamps (5 min)

In the WebSocket handler in `ai_guide.py`, add timing around each pipeline stage:

```python
import time

# Inside the audio_data handler:
t0 = time.monotonic()

# After Whisper transcription:
t1 = time.monotonic()
logger.info("voice_ws: TIMING stt=%.1fms", (t1 - t0) * 1000)

# After first Haiku sentence yields:
t2 = time.monotonic()
logger.info("voice_ws: TIMING haiku_first_sentence=%.1fms", (t2 - t1) * 1000)

# After first TTS audio chunk generated:
t3 = time.monotonic()
logger.info("voice_ws: TIMING tts_first_chunk=%.1fms", (t3 - t2) * 1000)

# After first audio_chunk sent to client:
logger.info("voice_ws: TIMING total_to_first_audio=%.1fms", (t3 - t0) * 1000)
```

This gives us ground truth before any optimization.

### 2. Find and use a Lithuanian voice from ElevenLabs (10 min)

The current voice is Rachel (`21m00Tcm4TlvDq8ikWAM`) — an English-trained voice. Lithuanian vowels (ė, į, ų), palatalized consonants, and stress patterns sound wrong with her.

**Steps:**
1. Go to https://elevenlabs.io/app/voice-library
2. Filter by language: Lithuanian
3. Pick a warm, professional voice
4. Copy its voice ID
5. In `ai_guide.py`, replace the default voice ID in `_generate_tts_bytes()`:

```python
# Change from:
voice_id = voice or "21m00Tcm4TlvDq8ikWAM"  # Rachel (English)
# Change to:
voice_id = voice or "NEW_LITHUANIAN_VOICE_ID"  # [name] (Lithuanian)
```

Also update the default in `TTSRequest`:
```python
class TTSRequest(BaseModel):
    text: str
    voice: str = "NEW_LITHUANIAN_VOICE_ID"  # was Rachel
    speed: float = 1.0
```

And update the frontend voice ID in:
- `src/lib/ttsService.ts`
- `src/components/guide/AIGuide.tsx` (TTS availability check)

**Keep `model_id="eleven_v3"`** — do not change the model.

### 3. Switch Whisper to AsyncOpenAI (5 min)

The current `_transcribe_whisper()` uses the sync `openai.OpenAI` client, which blocks the asyncio event loop for 1-2 seconds per transcription. Nothing else can happen during that time.

```python
# Before:
client = openai.OpenAI(api_key=api_key)
transcript = client.audio.transcriptions.create(...)

# After:
client = openai.AsyncOpenAI(api_key=api_key)
transcript = await client.audio.transcriptions.create(...)
```

The function is already `async def`, so this is just swapping the client class.

### 4. Try gpt-4o-mini-transcribe (1 line)

After measuring baseline latency (step 1), try the newer model:

```python
# Before:
model="whisper-1",

# After:
model="gpt-4o-mini-transcribe",
```

Measure again. If Lithuanian quality holds and latency drops, keep it. If quality degrades, revert to `whisper-1`.

### 5. Parallel TTS per Haiku sentence (30 min)

Currently the WebSocket handler generates TTS sequentially — each sentence blocks until its audio is generated before moving to the next:

```python
# Current (sequential):
async for sentence in _haiku_stream_sentences(...):
    tts_bytes = await _generate_tts_bytes(sentence)  # blocks 500-1500ms
    await websocket.send_json({"type": "audio_chunk", ...})
```

Change to: start TTS for the next sentence while the current one is being sent. Use `asyncio.create_task` to overlap:

```python
# Parallel:
import asyncio

pending_tts = None
async for sentence in _haiku_stream_sentences(...):
    # Start TTS for this sentence
    current_tts = asyncio.create_task(_generate_tts_bytes_async(sentence))
    
    # While TTS generates, send the previous sentence's audio (if ready)
    if pending_tts is not None:
        tts_bytes = await pending_tts
        if tts_bytes:
            await websocket.send_json({"type": "audio_chunk", ...})
            await websocket.send_json({"type": "response_text", ...})
    
    pending_tts = current_tts

# Send the last sentence
if pending_tts is not None:
    tts_bytes = await pending_tts
    if tts_bytes:
        await websocket.send_json({"type": "audio_chunk", ...})
```

This means: while sentence 1 audio is being sent to the client and played, sentence 2 TTS is already generating. The user hears zero gap between sentences instead of a 500-1500ms pause.

**Note:** `_generate_tts_bytes` may need to be made truly async (using `AsyncOpenAI` or `httpx` for the ElevenLabs call) for `create_task` to actually parallelize. If the ElevenLabs SDK is sync-only, wrap it in `asyncio.to_thread()`:

```python
tts_bytes = await asyncio.to_thread(_generate_tts_bytes_sync, sentence)
```

## Files to touch

**Backend:**
- `bustodnr_api/ai_guide.py` — latency timestamps, voice ID, async Whisper, model swap, parallel TTS

**Frontend (voice ID only):**
- `src/lib/ttsService.ts` — update default voice ID
- `src/components/guide/AIGuide.tsx` — update TTS availability check voice ID

## Verification

After each change, speak a test sentence and check the backend logs:

**After step 1:** Note baseline timing numbers
**After step 2:** Listen — does the accent sound more Lithuanian?
**After step 3:** Check that the event loop isn't blocked (other requests still respond during STT)
**After step 4:** Compare latency numbers to baseline
**After step 5:** Listen for gaps between sentences — they should be eliminated

Target: total_to_first_audio < 2000ms, no gaps between spoken sentences, natural Lithuanian accent.

## Constraints
- Keep `eleven_v3` model — do NOT switch to `eleven_multilingual_v2`
- Keep `whisper-1` as fallback if `gpt-4o-mini-transcribe` quality degrades
- Each change is independently testable — stop and evaluate after each
- All existing tests must pass