# P7-B5: Text Chat in Narration Bubble

## What
Add a text input to the narration speech bubble so the user can ask questions at any tour step. Questions are sent to a new backend endpoint `POST /v1/ai-guide/chat` which calls Claude Haiku 4.5 with the current page context, property data (if on report page), and current tour step. The AI responds contextually in Lithuanian. This is where Haiku earns its cost — reasoning about property-specific questions, not template narration.

## Why / Context
The tour narrations explain what's on screen. But users have follow-up questions: "Kodėl C klasė yra blogai?", "Kiek kainuotų renovacija?", "Ar šis pastatas buvo renovuotas?". A text chat in the speech bubble lets them ask without leaving the tour. The AI knows which step the user is on, what property data is available, and what has already been explained.

## Architecture

```
User types question in speech bubble
  → Frontend sends POST /v1/ai-guide/chat { page, step_id, message, report_token?, history[] }
  → Backend builds context: NTD system prompt + page/step context + property data (if report)
  → Backend calls Claude Haiku 4.5
  → Haiku responds in Lithuanian
  → Frontend shows response in the speech bubble (replacing or below the narration)
  → User can ask follow-up or click "Toliau" to continue the tour
```

## Backend

### 1. New endpoint

**File:** `bustodnr_api/ai_guide.py` (add to existing router)

```python
class ChatRequest(BaseModel):
    page: str                    # "landing" | "quickscan" | "report"
    step_id: str                 # current tour step, e.g. "winter-comfort"
    message: str                 # user's question
    report_token: Optional[str] = None
    history: list[dict] = []     # [{ role: "user"|"assistant", content: "..." }, ...]
    locale: str = "lt"

class ChatResponse(BaseModel):
    response: str                # AI answer in Lithuanian
    source: str                  # "ai" | "fallback"

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    ...
```

### 2. System prompt for chat

```python
CHAT_SYSTEM_PROMPT = """Tu esi NTD (NT Duomenys) AI asistentas. Vartotojas naršo ntd.lt svetainę ir turi klausimų.

TAISYKLĖS:
- Atsakyk trumpai, aiškiai, lietuviškai.
- Atsakyk tik apie nekilnojamąjį turtą, NTD paslaugą ir tai, ką matai ekrane.
- Jei nežinai atsakymo — pasakyk atvirai, nespėliok.
- Jei klausimas nesusijęs su NTD ar nekilnojamuoju turtu — mandagiai nukreipk atgal.
- Niekada nekurk duomenų — naudok tik tai, kas pateikta kontekste.
- Maksimalus atsakymo ilgis: 3 sakiniai.

DABARTINIS PUSLAPIS: {page}
DABARTINIS ŽINGSNIS: {step_id}
{property_context}"""
```

### 3. Property context (report page)

Same `build_property_context()` function from B4 — load report data from DB when `report_token` is provided. For landing/QuickScan pages, no property context (generic NTD knowledge only).

### 4. Haiku call

```python
async def call_haiku_chat(system_prompt: str, history: list[dict], message: str) -> str:
    client = anthropic.AsyncAnthropic()
    
    messages = []
    for h in history[-6:]:  # keep last 6 messages for context, limit token usage
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})
    
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=system_prompt,
        messages=messages,
    )
    
    return response.content[0].text
```

### 5. Rate limiting

- 20 chat messages per day per IP (or per session token)
- Separate from the /narrate rate limit
- When exceeded: return `{ response: "Dienos klausimų limitas pasiektas. Bandykite rytoj.", source: "fallback" }`

### 6. Error handling

If Haiku fails: return `{ response: "Atsiprašau, šiuo metu negaliu atsakyti. Bandykite dar kartą.", source: "fallback" }`

### 7. Tests

**File:** `tests/test_ai_guide.py` (add to existing)

```python
def test_chat_returns_response():
    """POST /v1/ai-guide/chat returns AI response"""

def test_chat_with_report_context():
    """Chat on report page includes property data in context"""

def test_chat_rate_limit():
    """21st message returns rate limit fallback"""

def test_chat_no_api_key():
    """Chat without API key returns fallback"""
```

## Frontend

### 1. Chat input in NarrationBubble

Add a small text input at the bottom of the narration speech bubble:

```
┌──────────────────────────────┐
│ Narration text here.         │
│                              │
│ 2 iš 6    ◀ Atgal  Toliau ▶ │
├──────────────────────────────┤
│ 💬 Turite klausimų?     [→] │  ← text input + send button
└──────────────────────────────┘
```

**Design:**
- Thin divider line between narration and chat input
- Placeholder: "Turite klausimų?" in `text-xs text-slate-400`
- Small send button (→ arrow or teal icon)
- Input is `text-sm`, full width minus send button

### 2. Chat state

When the user types a question and presses Enter or clicks send:

1. Show the question in the bubble (user message, right-aligned or distinct style)
2. Show a "..." typing indicator
3. Send POST to `/v1/ai-guide/chat`
4. Replace "..." with the AI response
5. The narration text is pushed up or replaced — the bubble now shows the conversation
6. "Toliau ▶" button remains visible so the user can continue the tour

### 3. Conversation flow in the bubble

The bubble switches between two modes:

**Narration mode (default):** Shows the step narration + step counter + nav buttons + chat input.

**Chat mode (after user asks a question):** Shows the conversation thread (user question → AI response) + a "↩ Grįžti prie apžvalgos" button to return to narration mode + chat input for follow-ups.

```
┌──────────────────────────────┐
│ 🧑 Kodėl C klasė yra blogai?│  ← user message
│                              │
│ 🤖 C klasės pastatas naudoja │  ← AI response
│ vidutiniškai daugiau energi- │
│ jos nei A ar B klasė...      │
│                              │
│ ↩ Grįžti    ◀ Atgal Toliau ▶│
├──────────────────────────────┤
│ 💬 Klauskite dar...     [→]  │
└──────────────────────────────┘
```

### 4. Conversation history

Maintain a conversation history per session (in React state, not persisted):

```typescript
const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
```

Send the last 6 messages as `history` in the chat request (provides context for follow-ups). Clear history when the tour ends or when navigating to a new page.

### 5. Chat on specific steps

The chat is context-aware — the `step_id` tells Haiku what the user is looking at:

- Step "winter-comfort" + question "Kodėl?" → Haiku explains the winter comfort rating for this property
- Step "pricing" + question "Ar galiu gauti nuolaidą?" → Haiku explains pricing (doesn't invent discounts)
- Step "hero" + question "Kas yra NTD?" → Haiku gives a brief NTD description

### 6. Loading state

While waiting for Haiku response:
- Show "..." animated dots in the response area
- Disable the input field
- Keep nav buttons (Toliau/Atgal) active — the user can leave the chat and continue the tour

### 7. API base URL

The frontend needs to know where the backend is. Use the same `API_BASE` used by other API calls in the frontend (likely `api.staging.bustodnr.lt` in production, `localhost:8100` in dev). Check how `QuickScanFlow.tsx` makes backend calls and use the same base.

## Constraints
- Max 300 tokens per Haiku response (~3 sentences)
- Max 6 messages of history sent per request (older messages trimmed)
- 20 messages/day rate limit per IP
- Chat only works when Haiku is available (API key set) — if not, hide the chat input entirely
- The tour continues working normally — chat is additive, not blocking
- The bubble may need to be slightly taller to accommodate the chat input (test visually)
- All existing tests must pass + 4 new backend tests

## Files to touch

**Backend (~/dev/bustodnr):**
- `bustodnr_api/ai_guide.py` — add `/chat` endpoint
- `tests/test_ai_guide.py` — add 4 chat tests

**Frontend (~/dev/ntd):**
- `src/components/guide/NarrationBubble.tsx` — add chat input, chat mode, conversation display
- `src/components/guide/AIGuide.tsx` — manage chat state, API calls, history
- `src/components/guide/types.ts` — add ChatMessage type if needed

## Cost
- ~$0.002 per chat message (300 input + 300 output tokens)
- Average 3 questions per guided tour: ~$0.006
- 30 guided users/month × 3 questions: ~$0.18/month
- Negligible

## Run after
```bash
# Backend
cd ~/dev/bustodnr
pytest tests/test_ai_guide.py -v

# Frontend  
cd ~/dev/ntd
npm run build
npm test
npm run dev
```

## Visual QA
- [ ] Speech bubble shows chat input below narration text ("Turite klausimų?")
- [ ] Type a question + press Enter → "..." appears → AI response appears
- [ ] AI response is in Lithuanian, contextual to current step
- [ ] On report page: AI references actual property data in responses
- [ ] "↩ Grįžti" returns to narration mode
- [ ] "Toliau ▶" works during chat mode (continues tour)
- [ ] Follow-up questions work (AI remembers previous Q&A in the conversation)
- [ ] Rate limit: after 20 messages, shows limit message
- [ ] Backend down: chat input is hidden (tour works normally without chat)
- [ ] Bubble height adjusts gracefully for conversation content