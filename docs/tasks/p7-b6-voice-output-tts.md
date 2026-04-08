# P7-B6: Activate "Su balso asistentu" — Voice Output (TTS)

## What
Activate the existing "Su balso asistentu" button in the mode selector. Remove the "Greitai!" badge. Clicking it starts the guided tour with voice output — the Robocat speaks narrations and chat responses aloud in Lithuanian via OpenAI TTS. The tour behaves exactly like "Su AI gidu" but with audio narration added. Later phases (B7: user speaks, B8: form-filling) progressively enhance this same mode.

## Why
The button already exists with the right label and the right position. Adding a separate 🔊 speaker button is redundant UX — the user already understands "Su balso asistentu" means "with voice." Activating it now with partial functionality (AI speaks, user types) is honest and progressive: the feature delivers on the promise of voice output immediately, and gains full conversational capability in B7/B8.

## How

### Frontend changes

#### 1. Activate the button

In `AIGuideToggle.tsx`:
- Remove the "Greitai!" badge from "Su balso asistentu"
- Remove the `disabled` / dimmed styling
- Make it clickable — sets guide mode to `'voice'`

The three modes now:
- **Savarankiškai** — no tour, no AI (unchanged)
- **Naršyti padedant AI gidui?** — tour with text narrations + chat (unchanged)
- **Su balso asistentu** — tour with text narrations + voice output + chat (NEW)

#### 2. Voice mode behavior

When mode is `'voice'`:
- Tour starts exactly like `'guided'` mode (same spotlight, same steps, same narrations)
- ADDITIONALLY: each narration is spoken aloud via TTS
- Chat responses are also spoken aloud
- The Robocat's Chat animation syncs with audio (speech dots while speaking)
- Text is always visible — voice is additive

When mode is `'guided'`:
- Tour works exactly as before — no audio, no TTS calls

#### 3. Auto-play on step advance

In voice mode, when the tour advances to a new step:
1. The narration text appears in the speech bubble (immediately, as before)
2. The narration text is sent to `POST /v1/ai-guide/tts`
3. Audio plays when ready
4. Robocat shows Chat animation while audio plays
5. When audio ends, Robocat returns to idle

First step requires user interaction (click "Su balso asistentu" → "Pradėti") — this satisfies the browser autoplay policy. All subsequent steps auto-play because the session was user-initiated.

#### 4. Audio playback service

**New file:** `src/lib/ttsService.ts`

```typescript
class TTSService {
  private audio: HTMLAudioElement | null = null;
  
  async speak(text: string): Promise<void> {
    this.stop();
    
    const response = await fetch(`${API_BASE}/v1/ai-guide/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'nova', speed: 1.0 }),
    });
    
    if (!response.ok) return; // silent failure
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    this.audio = new Audio(url);
    await this.audio.play();
    
    this.audio.onended = () => {
      URL.revokeObjectURL(url);
      this.audio = null;
    };
  }
  
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
  
  get isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }
}

export const ttsService = new TTSService();
```

#### 5. Integration in AIGuide.tsx

```typescript
const mode = /* from sessionStorage or state */;

// When step changes in voice mode
useEffect(() => {
  if (mode === 'voice' && tour.state.active && currentStep) {
    const narration = aiNarrations?.get(currentStep.id) ?? currentStep.narration;
    ttsService.speak(narration);
  }
  return () => ttsService.stop(); // cleanup on step change
}, [tour.state.currentStep, mode]);

// When chat response arrives in voice mode
const handleChatResponse = (response: string) => {
  // ... existing chat logic
  if (mode === 'voice') {
    ttsService.speak(response);
  }
};

// Stop audio when tour closes
const handleTourStop = () => {
  ttsService.stop();
  // ... existing stop logic
};
```

#### 6. Robocat animation sync

In `RiveAvatar.tsx`, expose the Chat input toggle. In `AIGuide.tsx`:

```typescript
useEffect(() => {
  // Toggle Chat face on/off with audio playback
  const interval = setInterval(() => {
    setIsSpeaking(ttsService.isPlaying);
  }, 100);
  return () => clearInterval(interval);
}, []);

// Pass to RiveAvatar
<RiveAvatar isSpeaking={isSpeaking} ... />
```

The RiveAvatar toggles the "Chat" state machine input when `isSpeaking` changes — showing speech dots while audio plays.

#### 7. Standalone chat with voice

When the user has previously selected "Su balso asistentu" and is now using the standalone chat (hover, no tour):
- Chat responses are spoken aloud
- The mode preference persists in sessionStorage

#### 8. Stop audio on close

When the tour ends (Escape, ✕, or last step) or the user switches mode:
- `ttsService.stop()` is called
- Audio cuts off immediately
- Robocat returns to idle

### Backend changes

#### 1. TTS endpoint

**File:** `bustodnr_api/ai_guide.py`

```python
class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"
    speed: float = 1.0

@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="TTS not configured")
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")
    
    from openai import OpenAI
    client = OpenAI()
    
    response = client.audio.speech.create(
        model="tts-1",
        voice=request.voice,
        input=request.text,
        response_format="mp3",
        speed=request.speed,
    )
    
    return StreamingResponse(
        response.iter_bytes(chunk_size=4096),
        media_type="audio/mpeg",
    )
```

#### 2. Caching

Cache TTS audio for static narrations (landing, QuickScan — text never changes):
- Key: `tts:{sha256(text)[:16]}:{voice}`
- Store: in-memory bytes dict
- Static narrations: cache indefinitely
- Chat responses: no cache (unique each time)

#### 3. Rate limiting

30 TTS calls/hour per IP. A full voice tour (~7 steps + 3 chat questions) uses 10 calls — plenty of headroom.

#### 4. Dependencies

```bash
pip install openai
export OPENAI_API_KEY=sk-...
```

#### 5. Tests

```python
def test_tts_no_key():
    """Returns 503 when OPENAI_API_KEY not set"""

def test_tts_empty_text():
    """Returns 400 for empty text"""

def test_tts_success():
    """Returns audio/mpeg stream (mock OpenAI)"""

def test_tts_rate_limit():
    """Returns 429 after 30 calls/hour"""
```

### Frontend: TTS availability check

On mount, the frontend should check if TTS is available (the backend has the OpenAI key):

```typescript
// Quick check: can we use voice mode?
const [ttsAvailable, setTtsAvailable] = useState(false);
useEffect(() => {
  fetch(`${API_BASE}/v1/ai-guide/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'test', voice: 'nova' }),
  }).then(r => {
    setTtsAvailable(r.ok || r.status !== 503);
  }).catch(() => setTtsAvailable(false));
}, []);
```

If TTS is not available (no OpenAI key), the "Su balso asistentu" button stays dimmed with "Greitai!" badge — same as before. This way the button only activates when the backend is ready.

## Constraints
- OpenAI TTS `tts-1` model, voice `nova`, MP3 format
- Voice is additive — text is always visible
- Audio stops immediately on tour close, mode switch, or step change (before new audio starts)
- If TTS endpoint is unavailable, voice mode silently degrades to guided mode (text only, no error)
- `OPENAI_API_KEY` must be set for TTS; if not, button stays dimmed with "Greitai!"
- Browser autoplay policy: first audio requires user click (starting the tour counts)
- All existing tests must pass + 4 new backend tests

## Cost
- OpenAI TTS `tts-1`: $15 per 1M characters
- Full voiced tour (7 steps × ~200 chars): ~$0.02
- Chat response: ~$0.003
- 30 voice users/month: ~$0.90
- With narration caching: significantly less

## Files to touch

**Backend (~/dev/bustodnr):**
- `bustodnr_api/ai_guide.py` — add `/tts` endpoint
- `requirements.txt` — add `openai`
- `tests/test_ai_guide.py` — 4 new TTS tests

**Frontend (~/dev/ntd):**
- `src/lib/ttsService.ts` — NEW: audio playback service
- `src/components/guide/AIGuideToggle.tsx` — activate "Su balso asistentu" button, remove "Greitai!" when TTS available
- `src/components/guide/AIGuide.tsx` — voice mode: TTS on step change + chat response, TTS availability check
- `src/components/guide/RiveAvatar.tsx` — sync Chat animation with `isSpeaking` prop

## Visual QA
- [ ] Mode selector shows "Su balso asistentu" active (no "Greitai!" badge) when TTS is available
- [ ] Mode selector shows "Su balso asistentu" dimmed with "Greitai!" when TTS is NOT available (no OpenAI key)
- [ ] Select "Su balso asistentu" → "Pradėti" → tour starts, first narration spoken aloud
- [ ] Step advance → next narration auto-plays
- [ ] While speaking: Robocat shows Chat face (speech dots)
- [ ] Audio ends → Robocat returns to idle
- [ ] Chat response in voice mode → response spoken aloud
- [ ] Close tour → audio stops immediately
- [ ] Switch from voice to guided mode → audio stops, text-only continues
- [ ] No OpenAI key → voice mode not available, guided mode works normally
- [ ] Standalone chat in voice mode → responses spoken aloud