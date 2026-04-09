# P7-B7.1: Real Voice Concierge — WebSocket Streaming Pipeline

## What
Replace the batch click-to-record STT flow with the voice concierge architecture described in the AI Guide Concept v2: continuous listening via browser-side Voice Activity Detection (VAD), WebSocket streaming audio to the backend, streaming overlap between STT→Haiku→TTS, and ~800-900ms perceived latency. When the user selects "Su balso asistentu", the Robocat listens continuously — no mic button, no clicking, no "Atpažįstame..." spinners. The user just talks.

## Why
B7 as delivered is a voice memo transcription tool — click mic, speak, click stop, wait, see text. The AI Guide Concept v2 promised:

> "The customer arrives, turns on the voice assistant, and talks their way through — all verbally, like talking to a real concierge."

> "~800–900ms from user stops speaking to AI starts speaking. This is within the range of a natural conversational pause."

That's the target. This brief delivers it.

## Architecture

```
User selects "Su balso asistentu" → browser opens WebSocket
  → Browser captures continuous audio via Web Audio API
  → Browser-side VAD detects speech onset/offset
  → When speech detected: audio chunks stream to backend via WebSocket
  → Backend pipes audio to Google Cloud STT (streaming recognition)
  → STT returns interim transcripts while user is still speaking
  → When stable phrase recognized → immediately sent to Claude Haiku (streaming)
  → Haiku streams response tokens → first complete sentence sent to TTS
  → TTS audio streams back via WebSocket → browser starts playing
  → User hears AI respond while Haiku is still generating the rest

Pipeline overlap (from concept doc):
  Time: 0ms     300ms     600ms     900ms
        |---------|---------|---------|
  STT:  [==streaming==]
                       ↓ stable phrase (~300ms)
  LLM:                 [==first sentence==][...rest...]
                                 ↓ first sentence (~600ms)
  TTS:                           [==audio streaming==]
                                      ↓ first audio (~800ms)
  User hears:                         🔊 AI starts speaking
```

## Backend

### 1. WebSocket endpoint

**File:** `bustodnr_api/ai_guide.py` (add to existing router)

```python
from fastapi import WebSocket, WebSocketDisconnect
from google.cloud import speech
import anthropic
import asyncio
import json

@app.websocket("/v1/ai-guide/voice")
async def voice_websocket(websocket: WebSocket):
    """
    Bidirectional WebSocket for voice conversation.
    
    Client sends:
      { type: "audio_chunk", data: "<base64 PCM audio>" }
      { type: "speech_start" }   — VAD detected speech onset
      { type: "speech_end" }     — VAD detected speech offset
      { type: "context", page: "report", step_id: "...", property_context: "..." }
    
    Server sends:
      { type: "transcript", text: "...", is_final: false }  — interim STT
      { type: "transcript", text: "...", is_final: true }   — final STT
      { type: "response_text", text: "..." }                — Haiku response (streamed sentence by sentence)
      { type: "audio_chunk", data: "<base64 MP3 chunk>" }   — TTS audio
      { type: "audio_end" }                                  — TTS finished
      { type: "error", message: "..." }                      — error
    """
    await websocket.accept()
    
    # Session state
    page_context = {}
    chat_history = []
    
    try:
        while True:
            message = await websocket.receive_json()
            
            if message["type"] == "context":
                page_context = message
                
            elif message["type"] == "speech_end":
                # User stopped speaking — process the audio
                # The accumulated audio has been streaming to STT
                # STT final transcript is ready (or nearly ready)
                pass
                
            elif message["type"] == "audio_data":
                # Complete audio blob from VAD segment
                audio_bytes = base64.b64decode(message["data"])
                
                # 1. Transcribe
                transcript = await transcribe_streaming(audio_bytes)
                if not transcript:
                    continue
                
                await websocket.send_json({
                    "type": "transcript",
                    "text": transcript,
                    "is_final": True,
                })
                
                # 2. Send to Haiku (streaming)
                chat_history.append({"role": "user", "content": transcript})
                
                response_text = ""
                async for sentence in haiku_stream_sentences(
                    page_context, chat_history, transcript
                ):
                    response_text += sentence
                    await websocket.send_json({
                        "type": "response_text",
                        "text": sentence,
                    })
                    
                    # 3. Send sentence to TTS immediately (streaming overlap)
                    audio_bytes = await generate_tts(sentence)
                    if audio_bytes:
                        await websocket.send_json({
                            "type": "audio_chunk",
                            "data": base64.b64encode(audio_bytes).decode(),
                        })
                
                chat_history.append({"role": "assistant", "content": response_text})
                
                await websocket.send_json({"type": "audio_end"})
                
    except WebSocketDisconnect:
        pass
```

### 2. Streaming Haiku — sentence by sentence

```python
async def haiku_stream_sentences(page_context, history, message):
    """
    Stream Haiku response, yielding complete sentences as they form.
    This allows TTS to start on the first sentence while Haiku is still generating.
    """
    client = anthropic.AsyncAnthropic()
    
    system_prompt = build_chat_system_prompt(
        page_context.get("page", ""),
        page_context.get("step_id", "standalone"),
        page_context.get("property_context", ""),
    )
    
    messages = []
    for h in history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})
    
    buffer = ""
    async with client.messages.stream(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=system_prompt,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            buffer += text
            # Check for complete sentence (period, question mark, exclamation)
            while any(end in buffer for end in ['. ', '? ', '! ', '.\n', '?\n', '!\n']):
                for end_char in ['. ', '? ', '! ', '.\n', '?\n', '!\n']:
                    idx = buffer.find(end_char)
                    if idx != -1:
                        sentence = buffer[:idx + 1].strip()
                        buffer = buffer[idx + 2:].strip()
                        if sentence:
                            yield sentence
                        break
        
        # Yield remaining buffer
        if buffer.strip():
            yield buffer.strip()
```

### 3. TTS generation (reuse existing)

The existing `/v1/ai-guide/tts` logic (ElevenLabs + `lt_text_prep.py`) is extracted into a function callable from the WebSocket handler:

```python
async def generate_tts(text: str) -> bytes | None:
    """Generate TTS audio for a sentence. Returns MP3 bytes."""
    processed = prepare_for_tts(text)
    # ... same ElevenLabs call as the /tts endpoint
    # Returns bytes instead of Response
```

### 4. STT transcription (batch for now, streaming later)

For B7.1, use batch recognition on the complete VAD segment (the audio captured between speech_start and speech_end). True streaming STT (interim transcripts while speaking) can be added as a B7.2 optimization.

```python
async def transcribe_streaming(audio_bytes: bytes) -> str:
    """Transcribe a VAD segment via Google Cloud STT."""
    client = speech.SpeechClient()
    # ... same config as the /stt endpoint
    # Returns transcript string
```

## Frontend

### 1. Voice Activity Detection (VAD)

**New file:** `src/lib/vadService.ts`

Use the `@ricky0123/vad-web` package — a browser-side VAD that detects speech onset/offset without sending audio to a server:

```typescript
import { MicVAD } from '@ricky0123/vad-web';

class VADService {
  private vad: MicVAD | null = null;
  private onSpeechEnd: ((audio: Float32Array) => void) | null = null;
  
  async start(callbacks: {
    onSpeechStart: () => void;
    onSpeechEnd: (audio: Float32Array) => void;
    onVADMisfire: () => void;
  }) {
    this.vad = await MicVAD.new({
      onSpeechStart: callbacks.onSpeechStart,
      onSpeechEnd: (audio) => callbacks.onSpeechEnd(audio),
      onVADMisfire: callbacks.onVADMisfire,
      // Tuning: detect end of speech after 500ms of silence
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.3,
      redemptionFrames: 8,
      minSpeechFrames: 3,
    });
    this.vad.start();
  }
  
  stop() {
    this.vad?.pause();
    this.vad?.destroy();
    this.vad = null;
  }
  
  get isListening(): boolean {
    return this.vad !== null;
  }
}

export const vadService = new VADService();
```

### 2. WebSocket client

**New file:** `src/lib/voiceWebSocket.ts`

```typescript
class VoiceWebSocket {
  private ws: WebSocket | null = null;
  private onTranscript: ((text: string) => void) | null = null;
  private onResponseText: ((text: string) => void) | null = null;
  private onAudioChunk: ((base64: string) => void) | null = null;
  private onAudioEnd: (() => void) | null = null;
  
  connect(url: string, callbacks: {
    onTranscript: (text: string) => void;
    onResponseText: (text: string) => void;
    onAudioChunk: (base64: string) => void;
    onAudioEnd: () => void;
  }) {
    this.ws = new WebSocket(url);
    this.onTranscript = callbacks.onTranscript;
    this.onResponseText = callbacks.onResponseText;
    this.onAudioChunk = callbacks.onAudioChunk;
    this.onAudioEnd = callbacks.onAudioEnd;
    
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'transcript':
          this.onTranscript?.(msg.text);
          break;
        case 'response_text':
          this.onResponseText?.(msg.text);
          break;
        case 'audio_chunk':
          this.onAudioChunk?.(msg.data);
          break;
        case 'audio_end':
          this.onAudioEnd?.();
          break;
      }
    };
  }
  
  sendContext(page: string, stepId: string, propertyContext?: string) {
    this.ws?.send(JSON.stringify({
      type: 'context',
      page,
      step_id: stepId,
      property_context: propertyContext,
    }));
  }
  
  sendAudio(audioFloat32: Float32Array) {
    // Convert Float32Array to base64 PCM or WebM
    const base64 = float32ToBase64(audioFloat32);
    this.ws?.send(JSON.stringify({
      type: 'audio_data',
      data: base64,
    }));
  }
  
  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const voiceWS = new VoiceWebSocket();
```

### 3. Audio queue for streaming playback

**New file:** `src/lib/audioQueue.ts`

Plays TTS audio chunks sequentially as they arrive from the WebSocket:

```typescript
class AudioQueue {
  private queue: string[] = [];  // base64 MP3 chunks
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  
  enqueue(base64Audio: string) {
    this.queue.push(base64Audio);
    if (!this.isPlaying) this.playNext();
  }
  
  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    this.isPlaying = true;
    const base64 = this.queue.shift()!;
    const blob = base64ToBlob(base64, 'audio/mpeg');
    const url = URL.createObjectURL(blob);
    
    this.currentAudio = new Audio(url);
    this.currentAudio.onended = () => {
      URL.revokeObjectURL(url);
      this.playNext();
    };
    await this.currentAudio.play();
  }
  
  stop() {
    this.queue = [];
    this.currentAudio?.pause();
    this.currentAudio = null;
    this.isPlaying = false;
  }
  
  get playing(): boolean {
    return this.isPlaying;
  }
}

export const audioQueue = new AudioQueue();
```

### 4. Integration in AIGuide.tsx

When voice mode activates:

```typescript
const startVoiceMode = async () => {
  // 1. Request mic permission + start VAD
  await vadService.start({
    onSpeechStart: () => {
      // User started speaking — stop any current TTS playback (barge-in)
      audioQueue.stop();
      setIsSpeaking(false);
      setIsListening(true);
    },
    onSpeechEnd: (audio) => {
      // User stopped speaking — send audio to backend
      setIsListening(false);
      voiceWS.sendAudio(audio);
    },
    onVADMisfire: () => {
      // False positive — ignore
    },
  });
  
  // 2. Open WebSocket
  voiceWS.connect(`ws://127.0.0.1:8100/v1/ai-guide/voice`, {
    onTranscript: (text) => {
      // Show what the user said (subtitle-style)
      setUserTranscript(text);
    },
    onResponseText: (text) => {
      // Show AI response text (accumulate sentences)
      setAiResponse(prev => prev + ' ' + text);
    },
    onAudioChunk: (base64) => {
      // Queue audio for playback
      audioQueue.enqueue(base64);
      setIsSpeaking(true);
    },
    onAudioEnd: () => {
      // AI finished responding — ready for next question
      setIsSpeaking(false);
    },
  });
  
  // 3. Send page context
  voiceWS.sendContext(tourId, currentStep?.id || 'standalone', propertyContext);
};

const stopVoiceMode = () => {
  vadService.stop();
  voiceWS.disconnect();
  audioQueue.stop();
};
```

### 5. Barge-in (interruption handling)

When the user starts speaking while the AI is talking:
1. VAD detects speech onset → `onSpeechStart` fires
2. `audioQueue.stop()` — TTS playback pauses immediately
3. New audio streams to backend
4. When user stops, new response cycle begins

This is automatic — the VAD handles it. No button clicks needed.

### 6. UI in voice mode

The chat card transforms in voice mode. No mic button, no text input — just a visual indicator of the conversation state:

```
Idle (listening):
┌──────────────────────────────┐
│ 🟢 Klausau...                │  ← green dot, "Listening..."
└──────────────────────────────┘

User speaking:
┌──────────────────────────────┐
│ 🔴 ●●●●●●                   │  ← red dot + waveform animation
└──────────────────────────────┘

AI thinking (brief, <1s):
┌──────────────────────────────┐
│ ⏳ •••                       │  ← only visible if latency >500ms
└──────────────────────────────┘

AI responding:
┌──────────────────────────────┐
│ 🔊 Jūsų pastatas pastatytas │  ← live subtitle of AI speech
│ tūkstantis devyni šimtai...  │
└──────────────────────────────┘
```

The narration card above still shows the tour narration text. The bottom card shows the live conversation state.

### 7. Subtitles

While the AI is speaking, show the response text in the chat card as live subtitles — the text appears sentence by sentence as TTS plays each chunk. This serves both accessibility (hearing-impaired users) and confirmation (user can read along).

### 8. Fallback to text

If the microphone is denied or WebSocket fails:
- Auto-downgrade to text mode (B5 chat + B6 TTS)
- Show message: "Nepavyko prisijungti prie mikrofono. Tęsiu tekstu."
- Text input becomes visible again

### 9. Remove the mic button from B7

The 🎤 mic button added in B7 is removed from the chat card in voice mode. In guided mode (text only), the chat card stays as-is (text input + send button, no mic).

## Dependencies

**Frontend:**
```bash
npm install @ricky0123/vad-web
```

**Backend:**
```bash
pip install websockets  # if not already available via FastAPI
```

## Constraints
- VAD runs entirely in the browser — no audio sent until speech detected
- WebSocket stays open for the duration of voice mode
- Maximum 5 minutes of continuous voice session (then auto-disconnect with message)
- Streaming overlap: TTS starts on first complete sentence from Haiku, not after full response
- Barge-in: user speaking immediately stops TTS playback
- All existing text chat, tour, and TTS functionality unchanged
- If WebSocket fails, graceful fallback to text mode
- HTTPS required in production (WebSocket + mic)
- All existing tests must pass + new WebSocket tests

## Cost
Same as B7 — the pipeline uses the same services:
- Google STT: ~$0.002 per utterance
- Haiku: ~$0.003 per response
- ElevenLabs TTS: ~$0.003 per response
- Total per voice exchange: ~$0.008
- 30 users × 5 exchanges: ~$1.20/month

## Files to touch

**Backend:**
- `bustodnr_api/ai_guide.py` — add WebSocket `/v1/ai-guide/voice` endpoint, extract TTS into reusable function, add streaming Haiku sentence generator
- `app.py` — ensure WebSocket support (FastAPI has it built-in)
- `tests/test_ai_guide.py` — WebSocket connection test, streaming response test

**Frontend:**
- `src/lib/vadService.ts` — NEW: browser-side Voice Activity Detection
- `src/lib/voiceWebSocket.ts` — NEW: WebSocket client for voice pipeline
- `src/lib/audioQueue.ts` — NEW: sequential audio chunk playback
- `src/lib/sttService.ts` — DEPRECATED (replaced by WebSocket pipeline)
- `src/components/guide/ChatInputCard.tsx` — voice mode UI: remove mic button, show conversation state indicators
- `src/components/guide/AIGuide.tsx` — voice mode lifecycle: start/stop VAD + WebSocket, barge-in, context updates on step change
- `src/components/guide/RiveAvatar.tsx` — listening state animation (distinct from speaking)
- `package.json` — add `@ricky0123/vad-web`

## Visual QA
- [ ] Select "Su balso asistentu" → mic permission requested → green "Klausau..." indicator
- [ ] Speak Lithuanian → red waveform indicator while speaking
- [ ] Stop speaking → brief natural pause (~800-900ms) → AI starts speaking
- [ ] NO clicking, NO "Atpažįstame...", NO visible pipeline steps
- [ ] AI response appears as live subtitles while speaking
- [ ] Robocat: idle → listening face → speaking face (Chat animation)
- [ ] Barge-in: speak while AI is talking → AI stops immediately → new response
- [ ] Tour step advance: AI narrates the new step → user can ask follow-up
- [ ] Close voice mode: audio stops, WebSocket disconnects, mic released
- [ ] Mic denied: falls back to text mode with notification
- [ ] Full conversation: narration → question → answer → follow-up → continue tour