# P7-B8.1: Streaming STT Partials + Abbreviation Pronunciation Fix

## What
Two changes:
1. **Streaming STT:** Replace Azure `recognize_once()` (batch) with continuous recognition that streams partial transcripts during speech. Haiku starts generating before the user finishes speaking. Target: first audio response ~1-2s after user stops (down from 3-5s).
2. **Abbreviation fix:** Expand Lithuanian address abbreviations and number patterns in `lt_text_prep.py` so Azure TTS pronounces them correctly.

## Part 1: Streaming STT Architecture

### Current (batch — 3-5s latency)
```
User speaks (3s) → VAD detects end → send complete audio → Azure recognize_once (2-3s) → Haiku (1-2s) → TTS (0.5-1s)
Total: 3-5s from end of speech to first audio
```

### Target (streaming — 1-2s latency)
```
User speaks (3s)
  ↓ audio streams to Azure continuously during speech
  → Azure emits partial transcripts ("Kiek..." → "Kiek kainuoja..." → "Kiek kainuoja ataskaita?")
  → On final transcript (Recognized event): immediately send to Haiku
  → Haiku starts generating while Azure is confirming
  → TTS on first sentence
Total: 1-2s from end of speech to first audio (STT already ran during speech)
```

The key insight: STT runs **during** speech, not after. By the time the user stops speaking, Azure already has the transcript ready (or nearly ready). The 2-3s STT wait disappears.

### Backend Implementation

Replace the WebSocket `audio_data` handling with a streaming approach. Instead of receiving one complete audio blob after `onSpeechEnd`, receive audio chunks **during** speech.

#### New WebSocket message types from frontend:

```
{ type: "speech_start" }           — VAD detected speech onset
{ type: "audio_chunk", data: "..." } — PCM16 audio chunk (every ~100ms during speech)
{ type: "speech_end" }             — VAD detected speech offset
```

#### Backend: Azure continuous recognition with PushAudioInputStream

```python
import azure.cognitiveservices.speech as speechsdk
import asyncio
import threading

async def _run_streaming_stt(
    websocket: WebSocket,
    page_context: dict,
    chat_history: list,
    exchange_count: int,
) -> Optional[str]:
    """
    Run Azure continuous recognition on a PushAudioInputStream.
    Audio chunks arrive via WebSocket messages. Recognition runs in a
    background thread. Returns the final transcript when speech_end arrives.
    """
    speech_key = os.getenv("AZURE_SPEECH_KEY")
    speech_region = os.getenv("AZURE_SPEECH_REGION", _DEFAULT_AZURE_REGION)
    
    config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)
    config.speech_recognition_language = "lt-LT"
    
    fmt = speechsdk.audio.AudioStreamFormat(
        samples_per_second=16000,
        bits_per_sample=16,
        channels=1,
    )
    stream = speechsdk.audio.PushAudioInputStream(stream_format=fmt)
    audio_config = speechsdk.audio.AudioConfig(stream=stream)
    
    recognizer = speechsdk.SpeechRecognizer(
        speech_config=config,
        audio_config=audio_config,
    )
    
    # Add NTD phrase hints
    phrase_list = speechsdk.PhraseListGrammar.from_recognizer(recognizer)
    for phrase in (
        "NTD", "NT Duomenys", "ataskaita", "energinė klasė",
        "šiluminis komfortas", "perkaitimo rizika", "renovacija",
        "kilovatvalandė", "kvadratinis metras", "Registrų centras",
        "kadastras", "Infostatyba", "PENS",
        "gatvė", "prospektas", "alėja",
        "Vilnius", "Kaunas", "Klaipėda", "Žirmūnų",
    ):
        phrase_list.addPhrase(phrase)
    
    # State shared between recognition callbacks and the main loop
    final_transcript = ""
    recognition_done = asyncio.Event()
    
    def on_recognizing(evt):
        """Partial transcript — send to frontend as interim text."""
        partial = evt.result.text
        if partial:
            logger.info("Azure STT partial: %r", partial)
            # Send partial transcript to frontend (non-blocking)
            asyncio.run_coroutine_threadsafe(
                websocket.send_json({
                    "type": "partial_transcript",
                    "text": partial,
                }),
                asyncio.get_event_loop(),
            )
    
    def on_recognized(evt):
        """Final transcript — recognition is done."""
        nonlocal final_transcript
        final_transcript = evt.result.text
        logger.info("Azure STT final: len=%d text=%r", len(final_transcript), final_transcript)
        recognition_done.set()
    
    def on_canceled(evt):
        """Recognition canceled — log and signal done."""
        logger.error("Azure STT canceled: %s — %s", evt.reason, evt.cancellation_details)
        recognition_done.set()
    
    def on_session_stopped(evt):
        """Session stopped — signal done."""
        recognition_done.set()
    
    recognizer.recognizing.connect(on_recognizing)
    recognizer.recognized.connect(on_recognized)
    recognizer.canceled.connect(on_canceled)
    recognizer.session_stopped.connect(on_session_stopped)
    
    # Start continuous recognition
    recognizer.start_continuous_recognition()
    
    # Feed audio chunks from WebSocket until speech_end
    try:
        while True:
            message = await asyncio.wait_for(
                websocket.receive_json(),
                timeout=30.0,  # 30s max speech duration
            )
            
            msg_type = message.get("type")
            
            if msg_type == "audio_chunk":
                # Decode and push to Azure stream
                audio_bytes = base64.b64decode(message["data"])
                pcm16 = _float32_bytes_to_pcm16(audio_bytes)
                stream.write(pcm16)
                
            elif msg_type == "speech_end":
                # Close the stream — Azure will finalize recognition
                stream.close()
                break
                
            elif msg_type == "cancel":
                # User barged in — abort
                stream.close()
                recognizer.stop_continuous_recognition()
                return None
                
            elif msg_type == "context":
                # Context update during speech — store but don't interrupt
                page_context.update(message)
    except asyncio.TimeoutError:
        stream.close()
    
    # Wait for Azure to finalize (should be very fast — audio is already processed)
    try:
        await asyncio.wait_for(recognition_done.wait(), timeout=5.0)
    except asyncio.TimeoutError:
        logger.warning("Azure STT finalization timeout")
    
    recognizer.stop_continuous_recognition()
    
    return final_transcript if final_transcript else ""
```

#### Updated WebSocket handler flow

```python
# In voice_websocket, replace the audio_data branch:

elif msg_type == "speech_start":
    # User started speaking — begin streaming STT
    t0 = time.monotonic()
    exchange_count += 1
    logger.info("voice_ws: speech_start (exchange=%d)", exchange_count)
    
    # Run streaming STT — this consumes audio_chunk messages
    # until speech_end arrives
    transcript = await _run_streaming_stt(
        websocket, page_context, chat_history, exchange_count,
    )
    
    t_stt = time.monotonic()
    logger.info("voice_ws: STT result len=%d text=%r", 
                len(transcript) if transcript else 0, transcript)
    
    if not transcript:
        await websocket.send_json({"type": "transcript", "text": "", "is_final": True})
        continue
    
    # ... rest of pipeline (Haiku + TTS) stays the same
```

### Frontend Changes

#### vadService.ts — stream audio chunks during speech

Currently, VAD collects all audio and sends one `audio_data` blob on `onSpeechEnd`. Change to:

```typescript
// In vadService start():
onSpeechStart: () => {
    // Tell backend speech started
    voiceWS.send({ type: 'speech_start' });
    callbacks.onSpeechStart();
},

// Stream audio chunks during speech (every ~100ms):
// @ricky0123/vad-web's onFrameProcessed callback
onFrameProcessed: (probs, audioFrame) => {
    if (isInSpeechSegment) {
        // Send audio chunk to backend via WebSocket
        voiceWS.sendAudioChunk(audioFrame);
    }
},

onSpeechEnd: (audio) => {
    // Tell backend speech ended (no audio blob — already streamed)
    voiceWS.send({ type: 'speech_end' });
    callbacks.onSpeechEnd(audio);
},
```

**Important check:** Verify that `@ricky0123/vad-web` v0.0.30 supports `onFrameProcessed` or an equivalent callback that fires every frame during speech. If it doesn't expose per-frame audio during speech (only the complete segment in `onSpeechEnd`), we need an alternative approach:

**Alternative approach (simpler, still gets most of the latency win):**
Use the browser's `MediaRecorder` or `AudioWorklet` to capture audio independently of VAD, and stream chunks via WebSocket. VAD only signals start/stop — the audio stream is separate.

```typescript
// On speech_start:
const audioStream = vadService.getStream();  // get the MediaStream
const processor = audioContext.createScriptProcessor(4096, 1, 1);
processor.onaudioprocess = (e) => {
    const float32 = e.inputBuffer.getChannelData(0);
    voiceWS.sendAudioChunk(float32);
};
source.connect(processor);

// On speech_end:
processor.disconnect();
voiceWS.send({ type: 'speech_end' });
```

#### voiceWebSocket.ts — add sendAudioChunk method

```typescript
sendAudioChunk(audioFloat32: Float32Array) {
    const base64 = float32ToBase64(audioFloat32);
    this.ws?.send(JSON.stringify({
        type: 'audio_chunk',
        data: base64,
    }));
}
```

#### ChatInputCard.tsx — show partial transcripts

When `partial_transcript` messages arrive, show them as live text (like real-time captions):

```typescript
// In WebSocket message handler:
case 'partial_transcript':
    setUserTranscript(msg.text);  // shows live what Azure is hearing
    break;
```

The user sees their words appearing in real-time as they speak — like YouTube live captions. This provides immediate feedback that the system is listening and understanding.

### Latency Analysis

```
BEFORE (batch):
  User speaks 3s → VAD end → send blob → Azure 2-3s → Haiku 1-2s → TTS 0.5-1s
  Total after speech: 3-5s

AFTER (streaming):
  User speaks 3s (Azure recognizes in parallel → partial transcripts shown)
  → VAD end → stream.close() → Azure finalizes ~200ms → Haiku 1-2s → TTS 0.5-1s
  Total after speech: 1.5-2.5s
```

The STT stage drops from 2-3s to ~200ms because recognition already happened during speech. The pipeline saves 1.5-2.5s of latency.

---

## Part 2: lt_text_prep.py Abbreviation Fix

### Problem
Azure TTS pronounces `g.` as "gay", `12-5` as gibberish, and other Lithuanian abbreviations incorrectly.

### Fix: Add to `convert_abbreviations()` in `bustodnr_api/lt_text_prep.py`

```python
# Lithuanian address abbreviations
'g.': 'gatvė',
'pr.': 'prospektas',
'al.': 'alėja',
'a.': 'aikštė',
'pl.': 'plentas',
'k.': 'kaimas',
'r.': 'rajonas',
'sav.': 'savivaldybė',
'm.': 'miestas',  # but careful — "m." after a year means "metais"

# Common building/address terms
'nr.': 'numeris',
'tel.': 'telefonas',
'el.': 'elektroninis',
'namo': 'namo',
```

### Fix: Add address number handling

Lithuanian addresses like `12-5` (house 12, apartment 5) should be read as separate numbers:

```python
import re

def convert_address_numbers(text: str) -> str:
    """Convert address numbers: '12-5' → 'dvylika penki'"""
    # Match patterns like "gatvė 12-5" or "g. 12-5"
    def replace_address(match):
        house = int(match.group(1))
        apt = int(match.group(2))
        return f"{number_to_lithuanian(house)} {number_to_lithuanian(apt)}"
    
    # Hyphenated numbers (address format: house-apartment)
    text = re.sub(r'\b(\d{1,3})-(\d{1,3})\b', replace_address, text)
    return text
```

### Fix: Handle "m." context sensitivity

`m.` after a 4-digit year = "metais" (already handled). `m.` after a city name = "miestas". Add context-aware handling:

```python
# Year context: "1985 m." → already handled by convert_units
# City context: "Vilniaus m." → "Vilniaus miestas"
text = re.sub(r'(\b[A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž]+(?:aus|ių|ės))\s+m\.', r'\1 miestas', text)
```

### Add tests for new patterns

In `tests/test_lt_text_prep.py`:

```python
def test_address_abbreviations():
    assert "gatvė" in prepare_for_tts("Žirmūnų g. 12")
    assert "prospektas" in prepare_for_tts("Konstitucijos pr. 7")
    assert "alėja" in prepare_for_tts("Gedimino al. 1")

def test_address_numbers():
    assert "dvylika penki" in prepare_for_tts("Žirmūnų gatvė 12-5")
    
def test_city_abbreviation():
    assert "miestas" in prepare_for_tts("Vilniaus m.")
```

---

## Files to touch

**Backend:**
- `bustodnr_api/ai_guide.py` — streaming STT function, updated WebSocket handler flow
- `bustodnr_api/lt_text_prep.py` — address abbreviations, hyphenated numbers, city context
- `tests/test_lt_text_prep.py` — new abbreviation/address tests
- `tests/test_ai_guide.py` — update if WebSocket message protocol changes

**Frontend:**
- `src/lib/vadService.ts` — stream audio chunks during speech (not just on end)
- `src/lib/voiceWebSocket.ts` — add `sendAudioChunk()` method
- `src/components/guide/ChatInputCard.tsx` — show partial transcripts
- `src/components/guide/AIGuide.tsx` — handle `partial_transcript` WebSocket messages

## Constraints
- Keep `recognize_once()` as fallback for `audio_data` messages (backward compatibility if frontend hasn't updated)
- Verify `@ricky0123/vad-web` v0.0.30 supports per-frame audio callbacks during speech — if not, use AudioWorklet approach
- `lt_text_prep.py` changes must not break existing number/unit tests
- All existing tests must pass
- Partial transcript display is informational — if it's jittery, hide it (don't block on it)

## Cost
No additional cost — same Azure Speech resource, same free tier. Continuous recognition uses the same pricing as single-shot.

## Run after
```bash
# Backend
cd ~/dev/bustodnr
pytest tests/test_ai_guide.py tests/test_lt_text_prep.py -v
uvicorn app:app --reload --host 127.0.0.1 --port 8100

# Frontend
cd ~/dev/ntd
npm run build && npm test
npm run dev
```

## Go / No-Go

After implementation, speak: "Sveiki, kiek kainuoja ataskaita?"

**Measure:** Compare the TIMING line `stt=` and `first_audio=` against the B8 baseline:
- B8 baseline: `stt=2600-3100ms`, `first_audio=4900-7600ms`
- B8.1 target: `stt=100-500ms`, `first_audio=1500-2500ms`

**GO:** `first_audio` < 2500ms AND abbreviations pronounced correctly ("gatvė" not "gay")
**NO-GO on streaming:** Revert to `recognize_once()` (batch) — the abbreviation fix still ships
**NO-GO on abbreviations:** Expand more patterns in `lt_text_prep.py`