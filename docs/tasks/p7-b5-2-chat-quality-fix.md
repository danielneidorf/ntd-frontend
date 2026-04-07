# P7-B5.2: Fix Chat Quality — Property Context + Rich System Prompt

## What
The chat returns generic/incorrect answers because Haiku has no property context and minimal domain knowledge. Two fixes:
1. Frontend sends property data to the chat endpoint (instead of backend loading from DB)
2. System prompt enriched with deep NTD domain knowledge so Haiku can reason about property data intelligently

## Problem
Current: user asks "Kodėl mano pastatas įvertintas C?" → Haiku responds "Negaliu atsakyti — nematau duomenų. Kreipkitės į NTD specialistą." This is because:
- `report_token: 'dev-existing'` has no DB record → `build_property_context()` returns empty
- Even with real data, the system prompt gives Haiku no knowledge of what energy classes mean or how NTD ratings work

## Fix 1: Frontend sends property context

### Backend change

Add `property_context` field to `ChatRequest`:

```python
class ChatRequest(BaseModel):
    page: str
    step_id: str
    message: str
    report_token: Optional[str] = None
    property_context: Optional[str] = None  # NEW — sent from frontend
    history: list[dict] = []
    locale: str = "lt"
```

In the `/chat` handler, use `request.property_context` if provided. Fall back to DB lookup via `report_token` only if `property_context` is not sent:

```python
context = request.property_context or build_property_context(request.report_token)
```

### Frontend change

In `AIGuide.tsx`, when sending a chat message on the report page, extract the visible property data from the DOM (reuse `extractReportData()` from B3) and serialize it as a string:

```typescript
const reportData = extractReportData();
const propertyContext = reportData ? [
  `Adresas: ${reportData.address}`,
  `Pastato tipas: ${reportData.buildingType}`,
  `Statybos metai: ${reportData.yearBuilt}`,
  `Energinė klasė: ${reportData.energyClass}`,
  `Energijos sąnaudos: ${reportData.energyKwh} kWh/m² per metus`,
  `Žiemos komfortas: ${reportData.winterComfort}`,
  `Vasaros perkaitimo rizika: ${reportData.summerRisk}`,
  `Sienų medžiaga: ${reportData.wallMaterial || 'nenurodyta'}`,
  `Šildymo tipas: ${reportData.heatingType || 'nenurodyta'}`,
  `Ventiliacijos tipas: ${reportData.ventilationType || 'nenurodyta'}`,
  `Statybos leidimai: ${reportData.permitCount || 0} rasta`,
].join('\n') : undefined;

// Include in chat request
sendChatMessage({
  page: tourId,
  step_id: currentStep.id,
  message: userMessage,
  property_context: propertyContext,
  history: chatHistory,
});
```

## Fix 2: Rich system prompt

Replace the thin `CHAT_SYSTEM_PROMPT` with a deep NTD domain knowledge prompt.

```python
CHAT_SYSTEM_PROMPT = """Tu esi NTD (NT Duomenys) AI asistentas. Padedi klientams suprasti jų nekilnojamojo turto ataskaitą.

KAS YRA NTD:
NTD (NT Duomenys / ntd.lt) — nekilnojamojo turto duomenų ir analitikos platforma. Renka duomenis iš oficialių Lietuvos registrų (NTR, Kadastras, PENS, Infostatyba), papildo moksliniais tyrimais ir pateikia kaip aiškias įžvalgas. Ataskaita kainuoja nuo 39 €.

ENERGINĖS KLASĖS (ką jos reiškia):
- A++ / A+ / A: Labai efektyvūs pastatai, minimalios šildymo sąnaudos. Dažniausiai nauji arba kapitališkai renovuoti.
- B: Geras efektyvumas. Šiuolaikiniai standartai.
- C: Vidutinis efektyvumas. Tipinis Lietuvos daugiabučiams, statytiems 1970–2000 m. Šildymo sąnaudos ~100–150 kWh/m²/metus.
- D: Žemas efektyvumas. Seni pastatai be renovacijos. Šildymo sąnaudos ~150–250 kWh/m²/metus.
- E: Labai žemas efektyvumas. Šildymo sąnaudos >250 kWh/m²/metus.

ŠILUMINIS KOMFORTAS (NTD vertinimas):
- A (Puikiai): Lengva palaikyti 20–22°C žiemą, minimali perkaitimo rizika vasarą.
- B (Gerai): Geras komfortas, kartais reikia papildomo dėmesio.
- C (Vidutiniškai): Reikės daugiau šildymo pastangų. Kampiniai kambariai gali būti vėsesni. Sąnaudos ~10–30% didesnės nei A/B.
- D (Silpnai): Didelės šildymo sąnaudos, kai kurios patalpos gali būti nekomfortiškos. Sąnaudos ~30–60% didesnės.
- E (Labai silpnai): Labai sunku palaikyti komfortą. Būtina renovacija.

PAGRINDINIAI VEIKSNIAI, TURINTYS ĮTAKĄ KOMFORTUI:
- Statybos metai: Prieš 1992 m. — dažniausiai be šiuolaikinio apšiltinimo. Po 2000 m. — geriau. Po 2010 m. — šiuolaikiniai standartai.
- Sienų medžiaga: Gelžbetonio plokštės (blokiniai daugiabučiai) — prastas apšiltinimas be renovacijos. Keraminės plytos — vidutinis. Šiuolaikinis termoizoliacinis blokas — geras.
- Šildymo tipas: Centrinis — priklauso nuo pastato izoliacijos. Dujinis katilas — efektyvesnis, bet priklauso nuo katilo amžiaus. Elektrinis — brangiausias.
- Ventilacija: Natūrali — nėra šilumos atgavimo, didesnės energijos sąnaudos. Mechaninė su rekuperacija — efektyvesnė.
- Langų dalis fasade: >30% — didesnė perkaitimo rizika vasarą ir šilumos nuostoliai žiemą.

LIETUVOS STATYBOS LAIKOTARPIAI:
- Iki 1960 m.: Mūriniai, mediniai. Dažnai kultūros paveldas. Labai skirtinga būklė.
- 1960–1990 m.: Masinė statybos era. Blokiniai daugiabučiai, gelžbetonio plokštės. C–D klasė be renovacijos.
- 1990–2005 m.: Pereinamasis laikotarpis. Mišri kokybė.
- 2005–2015 m.: Griežtesni standartai. B–C klasė.
- Po 2015 m.: Šiuolaikiniai standartai, A–B klasė.

RENOVACIJA:
- Daugiabučių renovacija gali pagerinti klasę 2–3 lygiais (pvz., D→B).
- Kaina: ~200–400 €/m² (visa programa), bet didelė dalis padengiama valstybės subsidijomis.
- Po renovacijos šildymo sąnaudos gali sumažėti 40–60%.

DABARTINIS PUSLAPIS: {page}
DABARTINIS ŽINGSNIS: {step_id}

{property_context}

ATSAKYMO TAISYKLĖS:
- Kalbėk trumpai, aiškiai, lietuviškai. Maksimum 3 sakiniai.
- VISADA naudok pateiktus objekto duomenis — nurodyk konkrečius skaičius, metus, klases.
- Niekada nesakyk "kreipkitės į NTD specialistą" ar "susisiekite su NTD komanda" — TU esi tas specialistas.
- Niekada nesakyk "nematau duomenų" — jei turi property_context, naudok jį.
- Jei klausia apie kažką, ko nėra duomenyse — pasakyk "Šios informacijos ataskaitoje nėra, bet..." ir pateik bendrą paaiškinimą pagal aukščiau pateiktą žinių bazę.
- Jei klausimas visiškai nesusijęs su nekilnojamuoju turtu — mandagiai nukreipk: "Galiu padėti tik su nekilnojamojo turto klausimais."
- Niekada nekurk konkrečių skaičių, kurių nėra duomenyse. Bendras statistikas ir intervalus (iš žinių bazės aukščiau) galima pateikti.
"""
```

## Why this matters

With this prompt, the same question "Kodėl mano pastatas įvertintas C?" gets:

**Before:** "Negaliu atsakyti. Kreipkitės į NTD specialistą."

**After:** "Jūsų pastatas pastatytas 1985 m. — tai blokinių daugiabučių era. C klasė reiškia, kad šildymo sąnaudos yra ~10–30% didesnės nei šiuolaikiniame A/B klasės pastate. Pagrindiniai veiksniai — gelžbetonio plokštės be papildomo apšiltinimo ir natūrali ventiliacija be rekuperacijos."

That's a useful answer. It references the actual property data AND explains the physics behind it.

## Files to touch

**Backend:**
- `bustodnr_api/ai_guide.py` — add `property_context` to ChatRequest, replace CHAT_SYSTEM_PROMPT with enriched version, use frontend-provided context with DB fallback

**Frontend:**
- `src/components/guide/AIGuide.tsx` — extract property data via `extractReportData()`, serialize and send as `property_context` in chat requests

## Constraints
- The enriched prompt is ~600 tokens of system context — still cheap for Haiku
- Property context from frontend: ~100–150 tokens per request
- Total per chat message: ~800 input tokens + 300 output tokens ≈ $0.003 (slightly more than before, still negligible)
- The backend should accept BOTH `property_context` (from frontend) and `report_token` (from DB) — frontend-provided takes priority
- All tests must pass (update mocks in test_ai_guide.py if the request schema changes)

## Visual QA
- [ ] On report page, ask "Kodėl C klasė?" → answer references the actual building year, wall material, energy class
- [ ] Ask "Ar verta renovuoti?" → answer gives general renovation info from the knowledge base
- [ ] Ask "Koks oras lauke?" → polite redirect: "Galiu padėti tik su NT klausimais"
- [ ] No response ever says "kreipkitės į NTD" or "susisiekite su komanda"
- [ ] On landing page, ask "Kas yra NTD?" → clear, informative answer about NTD service