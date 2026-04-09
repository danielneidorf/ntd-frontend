# P7-B7: Voice Input — STT (User Speaks, Robocat Listens)

## What
Add speech-to-text to the "Su balso asistentu" mode so the user can speak questions instead of typing. The browser captures audio from the microphone, sends it to the backend, which transcribes it via Google Cloud Speech-to-Text (Lithuanian `lt-LT` model), then sends the transcription to the existing Haiku chat endpoint. The response is spoken back via TTS (B6). This completes the conversational loop: user speaks → AI understands → AI responds in text + voice.

## Why / Context
B6 gave the Robocat a mouth (TTS). B7 gives it ears (STT). Together, the user can have a voice conversation with the AI about their property — no typing needed. The chat input field still works as a fallback (type if you prefer or if the mic fails). B8 later adds the hands (form-filling agent).

Per the AI Guide Concept v2: Google Cloud STT has the best Lithuanian `lt-LT` model — dedicated streaming recognition with good accuracy for Lithuanian place names, addresses, and property terminology.

## Architecture

```
User clicks 🎤 microphone button (or holds to talk)
  → Browser captures audio via Web Audio API / MediaRecorder
  → Audio sent to POST /v1/ai-guide/stt (WAV/WebM blob)
  → Backend sends audio to Google Cloud STT (lt-LT model)
  → Transcription returned to frontend
  → Frontend displays transcription in chat input
  → Auto-sends as chat message to POST /v1/ai-guide/chat
  → Haiku responds contextually
  → Response displayed in speech bubble
  → Response spoken aloud via TTS (B6 — if voice mode active)
  → User sees + hears the answer
```

## Backend

### 1. New endpoint

**File:** `bustodnr_api/ai_guide.py` (add to existing router)

```python
from google.cloud import speech

class STTRequest(BaseModel):
    audio_format: str = "webm"  # "webm" or "wav"
    sample_rate: int = 48000     # browser default for MediaRecorder
    language: str = "lt-LT"

@router.post("/stt")
async def speech_to_text(
    audio: UploadFile,
    audio_format: str = "webm",
    sample_rate: int = 48000,
    language: str = "lt-LT",
):
    """Transcribe Lithuanian speech to text via Google Cloud STT."""
    
    if not _google_credentials_available():
        raise HTTPException(status_code=503, detail="STT not configured")
    
    audio_content = await audio.read()
    
    if not audio_content or len(audio_content) < 1000:
        raise HTTPException(status_code=400, detail="Audio too short")
    
    client = speech.SpeechClient()
    
    # Map format to encoding
    encoding_map = {
        "webm": speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        "wav": speech.RecognitionConfig.AudioEncoding.LINEAR16,
    }
    
    config = speech.RecognitionConfig(
        encoding=encoding_map.get(audio_format, speech.RecognitionConfig.AudioEncoding.WEBM_OPUS),
        sample_rate_hertz=sample_rate,
        language_code=language,
        # Boost recognition of NTD-specific terms
        speech_contexts=[speech.SpeechContext(
            phrases=[
                "NTD", "NT Duomenys", "ataskaita", "energinė klasė",
                "šiluminis komfortas", "perkaitimo rizika", "renovacija",
                "kilovatvalandė", "kvadratinis metras", "Registrų centras",
                "kadastras", "Infostatyba", "PENS",
                # Common Lithuanian addresses
                "gatvė", "prospektas", "alėja", "aikštė",
                "Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys",
            ],
            boost=15.0,
        )],
        enable_automatic_punctuation=True,
        model="latest_long",  # best accuracy for longer utterances
    )
    
    audio_obj = speech.RecognitionAudio(content=audio_content)
    
    try:
        response = client.recognize(config=config, audio=audio_obj)
        
        if not response.results:
            return {"transcription": "", "confidence": 0.0}
        
        best_result = response.results[0].alternatives[0]
        return {
            "transcription": best_result.transcript,
            "confidence": best_result.confidence,
        }
    except Exception as e:
        logger.error(f"Google STT error: {e}")
        raise HTTPException(status_code=503, detail="STT temporarily unavailable")
```

### 2. Speech context boosting

The `speech_contexts` parameter dramatically improves recognition accuracy for domain-specific terms. NTD terms like "energinė klasė", "šiluminis komfortas", "PENS", and Lithuanian street types ("gatvė", "prospektas") get priority in the recognition model.

### 3. Audio format

Browser `MediaRecorder` defaults to WebM/Opus on Chrome and Firefox. Google Cloud STT supports `WEBM_OPUS` natively — no server-side format conversion needed.

### 4. Audio size limits

- Minimum: 1KB (reject very short/empty recordings)
- Maximum: 10MB (enough for ~60 seconds of speech at standard quality)
- Reject anything larger with 413 status

### 5. Rate limiting

- 20 STT calls/hour per IP (same as chat — each STT call results in a chat call)
- Separate from TTS rate limit

### 6. Authentication

Uses the same `GOOGLE_APPLICATION_CREDENTIALS` service account key file from B6.2 (the `ntd-maps` GCP project). Cloud Speech-to-Text API must be enabled on the project.

**GCP setup (if not already done):**
1. Enable "Cloud Speech-to-Text API" on the `ntd-maps` project
2. The existing service account key should already have access

### 7. Dependencies

```bash
pip install google-cloud-speech
```

### 8. Tests

```python
def test_stt_no_credentials():
    """Returns 503 when Google credentials not configured"""

def test_stt_empty_audio():
    """Returns 400 for empty/tiny audio"""

def test_stt_success():
    """Returns transcription (mock Google STT)"""

def test_stt_rate_limit():
    """Returns 429 after 20 calls/hour"""
```

## Frontend

### 1. Microphone button in chat card

Replace or augment the chat text input with a microphone button when in voice mode:

```
Voice mode chat card:
┌──────────────────────────────┐
│ 💬 Klauskite balsu...   🎤  │  ← mic button replaces or sits next to send button
└──────────────────────────────┘

While recording:
┌──────────────────────────────┐
│ 🔴 Klausau...          ⏹   │  ← red dot + "Listening..." + stop button
└──────────────────────────────┘

After transcription:
┌──────────────────────────────┐
│ 💬 Kodėl C klasė blogai? [→]│  ← transcribed text in input, editable before sending
└──────────────────────────────┘
```

### 2. Recording flow

```typescript
// New file: src/lib/sttService.ts

class STTService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  async startRecording(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus',
    });
    this.audioChunks = [];
    
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    
    this.mediaRecorder.start();
  }
  
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) throw new Error('Not recording');
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        // Stop all tracks to release the mic
        this.stream?.getTracks().forEach(t => t.stop());
        this.stream = null;
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

export const sttService = new STTService();
```

### 3. Transcription API call

```typescript
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('audio_format', 'webm');
  formData.append('sample_rate', '48000');
  formData.append('language', 'lt-LT');
  
  const response = await fetch(`${API_BASE}/v1/ai-guide/stt`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) return '';
  
  const data = await response.json();
  return data.transcription || '';
}
```

### 4. Integration in ChatInputCard

In voice mode, the chat input card shows a microphone button:

```typescript
const [isRecording, setIsRecording] = useState(false);
const [isTranscribing, setIsTranscribing] = useState(false);

const handleMicClick = async () => {
  if (isRecording) {
    // Stop recording, transcribe, send
    setIsRecording(false);
    setIsTranscribing(true);
    
    const audioBlob = await sttService.stopRecording();
    const transcription = await transcribeAudio(audioBlob);
    
    setIsTranscribing(false);
    
    if (transcription) {
      // Auto-send the transcribed text as a chat message
      onSend(transcription);
    }
  } else {
    // Start recording
    try {
      await sttService.startRecording();
      setIsRecording(true);
    } catch (err) {
      // Mic permission denied or not available
      console.error('Microphone not available:', err);
    }
  }
};
```

### 5. Push-to-talk vs toggle

**Toggle mode (recommended for B7):**
1. Click 🎤 → recording starts, button turns red 🔴
2. Click again (or press Enter) → recording stops, transcription begins
3. Transcription appears in the input, auto-sends to chat

**Push-to-hold (future B8 consideration):**
Hold the mic button to record, release to send. More natural for conversation but harder to implement on mobile.

For B7, toggle mode is simpler and sufficient.

### 6. Visual states

| State | Chat card appearance |
|---|---|
| Idle (voice mode) | `💬 Klauskite balsu... 🎤` (mic button teal) |
| Recording | `🔴 Klausau... ⏹` (red dot pulse, stop button) |
| Transcribing | `⏳ Atpažįstame...` (spinner) |
| Transcribed | `💬 [transcribed text] [→]` (editable, send button) |
| Waiting for Haiku | `•••` typing indicator (same as text chat) |
| Response | AI response + spoken aloud |

### 7. Auto-send transcription

When transcription completes, auto-send it to the chat endpoint. The user does NOT need to manually click send — the flow is: click 🎤 → speak → click 🎤 → wait → AI responds. Two clicks total.

The transcribed text briefly appears in the input (200ms) so the user can see what was understood, then auto-sends. If the transcription is clearly wrong, the user can click before auto-send to edit it — but this is an edge case.

### 8. Mic permission handling

The first time 🎤 is clicked, the browser asks for microphone permission. Handle gracefully:
- Permission granted → recording starts
- Permission denied → show "Mikrofono prieiga užblokuota. Patikrinkite naršyklės nustatymus." in the chat card
- Not available (HTTP, not HTTPS) → hide the mic button entirely (mic requires HTTPS in production)

### 9. STT availability check

On mount, check if STT is configured:

```typescript
const [sttAvailable, setSttAvailable] = useState(false);
useEffect(() => {
  // Check if the backend has Google credentials
  fetch(`${API_BASE}/v1/ai-guide/stt`, { method: 'POST' })
    .then(r => setSttAvailable(r.status !== 503))
    .catch(() => setSttAvailable(false));
}, []);
```

If STT is not available, the mic button is hidden — the user types in voice mode (still gets TTS responses).

### 10. Robocat animation during recording

While recording, toggle a new Robocat state or reuse the existing Chat face. The visual signal: Robocat shows "listening" expression while the user speaks.

## Full voice conversation flow

```
1. User hovers Robocat → mode selector appears
2. User clicks "Su balso asistentu" → tour starts with voice narrations (B6)
3. User hears narration, has a question
4. User clicks 🎤 in the chat card
5. Browser asks for mic permission (first time only)
6. User speaks: "Kodėl mano pastatas įvertintas C?"
7. User clicks 🎤 again to stop
8. "Atpažįstame..." spinner shows
9. Backend transcribes: "Kodėl mano pastatas įvertintas C?"
10. Transcription auto-sends to /v1/ai-guide/chat
11. Haiku responds with property-specific answer
12. Response appears in chat bubble
13. Response spoken aloud via TTS
14. Robocat shows Chat face while speaking
15. User can ask follow-up or click "Toliau" to continue tour
```

## Constraints
- Google Cloud STT `lt-LT` model — the only provider with a trained Lithuanian model
- `GOOGLE_APPLICATION_CREDENTIALS` must be set (same credential as GCP Maps/TTS)
- Cloud Speech-to-Text API must be enabled on the GCP project
- Audio format: WebM/Opus (browser default) — no server-side conversion
- Max recording: 60 seconds (prevent accidental long recordings)
- Auto-stop recording after 30 seconds of silence (if possible via Web Audio API VAD)
- Mic requires HTTPS in production (localhost is exempt for dev)
- The text input always remains as fallback — mic is additive
- If STT is unavailable, mic button is hidden, not disabled
- All existing tests must pass + 4 new STT backend tests

## Cost
- Google Cloud STT: $0.006 per 15 seconds of audio
- Average voice question: ~5 seconds → ~$0.002
- 30 voice users × 3 questions: ~$0.18/month
- Combined with TTS: ~$5.18/month (ElevenLabs) + ~$0.18 (STT) = ~$5.36/month

## Files to touch

**Backend (~/dev/bustodnr):**
- `bustodnr_api/ai_guide.py` — add `/stt` endpoint
- `requirements.txt` — add `google-cloud-speech`
- `tests/test_ai_guide.py` — 4 new STT tests

**Frontend (~/dev/ntd):**
- `src/lib/sttService.ts` — NEW: microphone recording + STT API call
- `src/components/guide/ChatInputCard.tsx` — mic button, recording states, auto-send
- `src/components/guide/AIGuide.tsx` — STT availability check, integrate voice input with chat flow
- `src/components/guide/RiveAvatar.tsx` — listening animation state (optional)

## GCP setup
```bash
# Enable Speech-to-Text API (if not already)
# Go to: https://console.cloud.google.com/apis/library/speech.googleapis.com?project=ntd-maps
# Click "Enable"

# Install SDK
pip install google-cloud-speech

# Credentials already set from B6.2:
# export GOOGLE_APPLICATION_CREDENTIALS=/path/to/ntd-maps-key.json
```

## Visual QA
- [ ] Voice mode: 🎤 mic button visible in chat card
- [ ] Click 🎤 → browser asks for mic permission (first time)
- [ ] Permission granted → red recording indicator, "Klausau..."
- [ ] Speak Lithuanian → click 🎤 to stop → "Atpažįstame..." spinner
- [ ] Transcription appears briefly → auto-sends to chat
- [ ] Haiku responds → response shown in bubble + spoken aloud
- [ ] Full loop works: speak → AI understands → AI answers in text + voice
- [ ] Mic permission denied → error message in chat card, text input still works
- [ ] No Google credentials → mic button hidden, typing works normally
- [ ] Recording stops automatically after 60 seconds max
- [ ] Speech context: "energinė klasė", "šiluminis komfortas" recognized correctly
- [ ] Standalone chat (no tour): mic works the same way