# P7-B7.2: Switch STT to OpenAI Whisper for Lithuanian

## What
Replace Google Cloud STT with OpenAI Whisper (`whisper-1` or `gpt-4o-mini-transcribe`) for Lithuanian speech recognition. Google's `default` model for `lt-LT` is too weak — low confidence scores, frequent empty results, poor transcription accuracy. Whisper was trained on 680,000 hours of multilingual audio and handles Lithuanian significantly better.

Also: revert the VAD AGC/noiseSuppression disable from the previous session — Silero expects AGC-normalized audio.

## Why
The voice concierge pipeline is proven working end-to-end — VAD detects speech, WebSocket transports audio, Haiku generates clean responses, ElevenLabs speaks them. The ONLY broken link is STT. If Whisper transcribes Lithuanian reliably, the entire voice concierge works as designed with no push-to-talk compromise.

If Whisper also fails → we disable voice input and keep voice output only (Mode 3 partial: AI speaks, user types). No half-measures.

## How

### 1. Revert VAD audio settings

In `src/lib/vadService.ts`, revert to Silero defaults:
- `autoGainControl: true` (was disabled)
- `noiseSuppression: true` (was disabled)  
- `positiveSpeechThreshold: 0.5` (was 0.85 — too aggressive)

### 2. Replace `_transcribe_pcm()` with Whisper

In `bustodnr_api/ai_guide.py`, replace the Google Cloud STT call:

```python
import openai
import io
import wave

async def _transcribe_whisper(pcm16_bytes: bytes, sample_rate: int = 16000) -> str:
    """Transcribe Lithuanian speech via OpenAI Whisper."""
    
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set — STT unavailable")
        return ""
    
    # Convert raw PCM16 to WAV (Whisper expects a file-like object)
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)  # 16-bit = 2 bytes
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm16_bytes)
    wav_buffer.seek(0)
    wav_buffer.name = "speech.wav"  # Whisper needs a filename with extension
    
    try:
        client = openai.OpenAI(api_key=api_key)
        
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=wav_buffer,
            language="lt",  # ISO 639-1 code for Lithuanian
            prompt="NTD, NT Duomenys, ataskaita, energinė klasė, šiluminis komfortas, Žirmūnų, Vilnius",
        )
        
        result = transcript.text.strip()
        logger.info("Whisper STT: text=%r", result)
        return result
        
    except Exception as exc:
        logger.exception("Whisper STT error")
        return ""
```

**Key advantages of Whisper over Google STT for Lithuanian:**
- `language="lt"` is explicitly supported
- The `prompt` parameter primes the model with NTD-specific vocabulary (similar to Google's `speech_contexts` but simpler)
- Whisper handles noisy audio better (trained on diverse real-world recordings)
- No streaming model compatibility issues (`whisper-1` just works for all languages)

### 3. Update the WebSocket handler

In the `voice_websocket` handler, replace the `_transcribe_pcm()` call with `_transcribe_whisper()`:

```python
# Before:
transcript = await _transcribe_pcm(pcm16_bytes, sample_rate)

# After:
transcript = await _transcribe_whisper(pcm16_bytes, sample_rate)
```

### 4. Update the `/stt` REST endpoint too

The batch `/stt` endpoint (from B7) should also use Whisper as a fallback or primary:

```python
@router.post("/stt")
async def speech_to_text(audio: UploadFile, ...):
    # Try Whisper first
    transcript = await _transcribe_whisper(pcm16_bytes, sample_rate)
    if transcript:
        return {"transcription": transcript, "confidence": 1.0, "provider": "whisper"}
    
    # Fall back to Google if Whisper fails
    transcript = await _transcribe_pcm(pcm16_bytes, sample_rate)
    return {"transcription": transcript, "confidence": 0.0, "provider": "google"}
```

### 5. Environment variable

`OPENAI_API_KEY` must be set. It may already be in `.env` from the earlier TTS experiments — check.

```bash
# Add to .env if not present:
OPENAI_API_KEY=sk-...
```

The `openai` package should already be installed from B6.

### 6. Keep Google STT as fallback (optional)

Don't delete `_transcribe_pcm()` — keep it as a fallback. If Whisper fails or is unavailable, the Google path still works (poorly, but works).

## Go / No-Go Evaluation

After implementing, test with these 5 Lithuanian sentences. Each should transcribe correctly (allow minor spelling variations):

| # | Speak this | Expected transcription |
|---|---|---|
| 1 | "Labas, aš noriu patikrinti butą" | Labas, aš noriu patikrinti butą |
| 2 | "Kodėl mano pastatas įvertintas C klasė?" | Kodėl mano pastatas įvertintas C klasė? |
| 3 | "Žirmūnų gatvė dvylika" | Žirmūnų gatvė dvylika |
| 4 | "Kiek kainuoja ataskaita?" | Kiek kainuoja ataskaita? |
| 5 | "Ar galima pagerinti energinę klasę?" | Ar galima pagerinti energinę klasę? |

**GO criteria:** ≥4 out of 5 transcribed correctly (meaning understandable enough for Haiku to answer)

**NO-GO criteria:** <3 out of 5 → disable voice input, keep voice output only, add "Greitai!" badge back to "Su balso asistentu" button

## Constraints
- `whisper-1` model (not `gpt-4o-mini-transcribe` which may not support Lithuanian yet — verify)
- The `prompt` parameter helps with domain vocabulary — keep NTD terms in it
- Whisper is NOT streaming (batch only) — this adds ~1-2 seconds of latency compared to streaming STT, but reliability matters more than latency at this stage
- `OPENAI_API_KEY` required — if not set, voice input disabled
- Keep Google STT code — don't delete, just deprioritize
- All existing tests must pass

## Cost
- Whisper: $0.006 per minute of audio
- Average voice utterance: ~5 seconds = $0.0005
- 30 users × 5 utterances: ~$0.075/month
- Negligible

## Files to touch

**Backend:**
- `bustodnr_api/ai_guide.py` — add `_transcribe_whisper()`, update WebSocket handler and `/stt` endpoint to use Whisper

**Frontend:**
- `src/lib/vadService.ts` — revert AGC/noiseSuppression to defaults, threshold back to 0.5

## Run after
```bash
# Backend
cd ~/dev/bustodnr
export OPENAI_API_KEY=sk-...
pytest tests/test_ai_guide.py -v

# Frontend
cd ~/dev/ntd
npm run build && npm test

# Manual test: speak the 5 Lithuanian test sentences
# Check backend logs for Whisper transcriptions
```