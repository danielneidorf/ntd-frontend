# P7-B4: AI Narration Backend — Haiku Replaces Hardcoded Text

## What
Add a backend endpoint `POST /v1/ai-guide/narrate` that generates personalized Lithuanian tour narrations via Claude Haiku 4.5. One API call per page generates all step narrations at once (batched). The frontend calls this endpoint when the tour starts and displays AI-generated text instead of hardcoded narrations. Hardcoded narrations remain as fallback if the API is unavailable.

## Why / Context
B1–B3 shipped the tour engine with hardcoded Lithuanian narrations. These are correct but generic — the landing and QuickScan narrations never change, and the report narrations use simple template strings. Haiku can generate narrations that are:
- More natural and varied (not the same text every time)
- Fully personalized to the specific property (report page)
- Contextually aware (adapts to what the user has done so far)
- Conversational and warmer than templated strings

This is the prerequisite for B5 (chat) — the same Anthropic API integration serves both features.

## Architecture

### Data flow
```
Frontend: User starts tour on page X
  → Frontend sends POST /v1/ai-guide/narrate { page, steps, report_token? }
  → Backend builds system prompt with NTD context + step list
  → Backend calls Claude Haiku 4.5 API
  → Haiku returns JSON array of narrations (one per step)
  → Backend caches response (24h per page+token combination)
  → Backend returns narrations to frontend
  → Frontend displays AI narrations in the speech bubble
  → If API fails → frontend falls back to hardcoded narrations
```

## Backend (FastAPI)

### 1. New endpoint

**File:** `bustodnr_api/routers/ai_guide.py` (NEW)

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import anthropic
import json

router = APIRouter(prefix="/v1/ai-guide", tags=["ai-guide"])

class NarrateRequest(BaseModel):
    page: str  # "landing" | "quickscan-screen1" | "quickscan-screen2" | "report"
    steps: list[dict]  # [{ id: "hero", selector: "...", context: "..." }, ...]
    report_token: Optional[str] = None  # for report page — loads property data
    locale: str = "lt"

class NarrateResponse(BaseModel):
    narrations: list[dict]  # [{ step_id: "hero", narration: "Sveiki! ..." }, ...]
    source: str  # "ai" | "cache" | "fallback"

@router.post("/narrate", response_model=NarrateResponse)
async def generate_narrations(request: NarrateRequest):
    # 1. Check cache
    # 2. Build system prompt
    # 3. Call Haiku
    # 4. Parse response
    # 5. Cache and return
    ...
```

### 2. System prompt

```python
NARRATE_SYSTEM_PROMPT = """Tu esi NTD (NT Duomenys) svetainės AI gidas. Tavo užduotis — sugeneruoti trumpus, draugiškus, informatyvius pasakojimus lietuvių kalba kiekvienam apžvalgos žingsniui.

TONAS:
- Kalbėk kaip profesionalus, bet šiltas konsultantas — ne kaip brošiūra.
- Pradėk nuo to, ką vartotojas mato: "Čia matote...", "Šioje dalyje rasite...".
- Pridėk vertės pastabą: kodėl tai svarbu, kiek kainuoja kitur, ką tai reiškia praktiškai.
- Niekada nenaudok žodžio "blokas" — sakyk "sritis", "dalis", "tema".
- Niekada neapibūdink NTD trečiuoju asmeniu ("NT Duomenys renka...") — sakyk "čia rasite", "jūs gausite".
- Kiekvienas pasakojimas: 1–3 sakiniai, iki 50 žodžių.

KONTEKSTAS:
- Puslapis: {page}
- Žingsniai: {steps_json}
{property_context}

ATSAKYMO FORMATAS (tik JSON, be jokio papildomo teksto):
[
  {{ "step_id": "hero", "narration": "Sveiki! ..." }},
  {{ "step_id": "data-categories", "narration": "Čia matote..." }},
  ...
]"""
```

### 3. Property context for report page

When `page == "report"` and `report_token` is provided, the backend loads property data from the database and injects it into the prompt:

```python
def build_property_context(report_token: str) -> str:
    # Load report data from DB
    report = get_report_by_token(report_token)
    if not report:
        return ""
    
    return f"""
OBJEKTO DUOMENYS:
- Adresas: {report.address}
- Pastato tipas: {report.building_type}
- Statybos metai: {report.year_built}
- Energinė klasė: {report.energy_class}
- Energijos sąnaudos: {report.energy_kwh} kWh/m² per metus
- Žiemos komfortas: {report.winter_comfort_level} ({report.winter_comfort_label})
- Vasaros perkaitimo rizika: {report.summer_risk_level} ({report.summer_risk_label})
- Statybos leidimai: {report.permit_count} rasta
- Vertinimo tipas: {report.case_type}

Naudok šiuos duomenis pasakojimuose — minėk konkrečius skaičius ir vertinimus."""
```

### 4. Haiku API call

```python
async def call_haiku(system_prompt: str, steps: list[dict]) -> list[dict]:
    client = anthropic.AsyncAnthropic()  # API key from env
    
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2000,
        system=system_prompt,
        messages=[{
            "role": "user",
            "content": f"Sugeneruok pasakojimus šiems žingsniams: {json.dumps(steps, ensure_ascii=False)}"
        }]
    )
    
    # Parse JSON from response
    response_text = message.content[0].text
    narrations = json.loads(response_text)
    return narrations
```

### 5. Caching

Cache narrations to avoid redundant API calls:

- **Landing page:** cache indefinitely (narrations are generic, no property data)
- **QuickScan pages:** cache per session (narrations are generic)
- **Report page:** cache per report_token for 24 hours (narrations are property-specific)

Use a simple in-memory dict or Redis if available. Cache key: `f"narrate:{page}:{report_token or 'generic'}:{locale}"`.

### 6. Rate limiting

- 5 calls/hour per IP for `/narrate`
- Prevents abuse (each page load should hit cache after the first call)

### 7. Error handling

If Haiku API fails (timeout, rate limit, server error):
- Log the error
- Return `{ narrations: [], source: "fallback" }`
- Frontend uses hardcoded narrations when `source == "fallback"` or when narrations array is empty

### 8. Register router

Add to `bustodnr_api/main.py`:
```python
from bustodnr_api.routers.ai_guide import router as ai_guide_router
app.include_router(ai_guide_router)
```

### 9. Environment variable

Add `ANTHROPIC_API_KEY` to the backend environment. The `anthropic` Python package reads it automatically.

```bash
pip install anthropic --break-system-packages
```

## Frontend Changes

### 1. API call in AIGuide.tsx

When the tour starts, fetch narrations from the backend:

```typescript
async function fetchNarrations(
  page: string,
  steps: { id: string; context?: string }[],
  reportToken?: string
): Promise<{ step_id: string; narration: string }[] | null> {
  try {
    const response = await fetch(`${API_BASE}/v1/ai-guide/narrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, steps, report_token: reportToken }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.source === 'fallback' || !data.narrations.length) return null;
    return data.narrations;
  } catch {
    return null;  // fallback to hardcoded
  }
}
```

### 2. Narration override logic

In `AIGuide.tsx`, after fetching:

```typescript
const [aiNarrations, setAiNarrations] = useState<Map<string, string> | null>(null);

useEffect(() => {
  if (tour.state.active) {
    fetchNarrations(tourId, tourSteps.map(s => ({ id: s.id }))).then(result => {
      if (result) {
        const map = new Map(result.map(r => [r.step_id, r.narration]));
        setAiNarrations(map);
      }
    });
  }
}, [tour.state.active]);

// When rendering NarrationBubble:
const currentNarration = aiNarrations?.get(currentStep.id) ?? currentStep.narration;
```

This means: use AI narration if available, fall back to hardcoded otherwise. The switch is invisible to the user.

### 3. Loading state

While narrations are being fetched (~500ms), show the hardcoded narration immediately. If AI narrations arrive, swap silently. The user starts reading the hardcoded text; if AI text arrives within ~1s, it replaces it. If not, the hardcoded text stays.

No loading spinner — the hardcoded text IS the loading state.

## Testing

### Backend tests (new file: `tests/test_ai_guide.py`)

```python
def test_narrate_landing_returns_narrations():
    """POST /v1/ai-guide/narrate with page=landing returns step narrations"""

def test_narrate_report_with_token():
    """POST /v1/ai-guide/narrate with page=report and report_token returns property-specific narrations"""

def test_narrate_invalid_page():
    """POST /v1/ai-guide/narrate with invalid page returns 400"""

def test_narrate_cache_hit():
    """Second call with same params returns cached result"""

def test_narrate_api_failure_returns_fallback():
    """When Haiku API fails, returns source=fallback"""

def test_narrate_rate_limit():
    """6th call within 1 hour returns 429"""
```

Mock the Anthropic API in tests — don't make real API calls.

## Constraints
- Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — cheapest, fastest model
- Max tokens: 2000 per call (all steps combined)
- Response must be valid JSON — if Haiku returns invalid JSON, fall back
- The frontend never breaks if the backend is unavailable — hardcoded narrations always work
- `ANTHROPIC_API_KEY` must be set in environment for the endpoint to work; if missing, return fallback immediately
- CORS must allow the frontend origin (already configured for api.staging.bustodnr.lt)
- All existing tests must pass + new tests added

## Files to touch

**Backend (~/dev/bustodnr):**
- `bustodnr_api/routers/ai_guide.py` — NEW: /narrate endpoint
- `bustodnr_api/main.py` — register ai_guide router
- `requirements.txt` — add `anthropic`
- `tests/test_ai_guide.py` — NEW: 6 tests
- `.env` or environment config — add `ANTHROPIC_API_KEY`

**Frontend (~/dev/ntd):**
- `src/components/guide/AIGuide.tsx` — fetch narrations on tour start, override hardcoded text
- `src/lib/api.ts` (or equivalent) — add `fetchNarrations()` function

## Cost
- Landing page narration: ~$0.003 per call (400 input + 700 output tokens)
- QuickScan narration: ~$0.005 per call
- Report narration: ~$0.007 per call (includes property context)
- With caching: first visit costs, subsequent visits free
- Monthly at 100 reports, 30% guide adoption: ~$0.90

## Run after
```bash
# Backend
cd ~/dev/bustodnr
pip install anthropic --break-system-packages
pytest tests/test_ai_guide.py -v

# Frontend
cd ~/dev/ntd
npm run build
npm test
npm run dev
```

## Visual QA
- [ ] Start landing tour → narrations appear (may be hardcoded initially, AI text replaces within ~1s)
- [ ] Start report tour → narrations mention actual property data (address, year, energy class)
- [ ] Kill the backend → start tour → hardcoded narrations appear (no error, no broken UI)
- [ ] Reload page and start tour again → cached narrations appear instantly (no API call)
- [ ] Check backend logs: Haiku API call logged with token count and latency