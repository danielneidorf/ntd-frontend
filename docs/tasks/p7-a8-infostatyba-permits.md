# P7-A8: Infostatyba Construction Permit Metadata

## What
Add a backend endpoint that queries the Lithuanian open data API (Saugykla) for Infostatyba construction permit data, and display matching permits in the interactive report. The customer sees what construction permits, declarations, or building projects are associated with their property's address or NTR number.

## Why / Context
Construction permits reveal important history: was the building renovated? Is there an active construction project? Was a demolition permit issued? Was there an unauthorized construction (savavališka statyba) case? This data is publicly available via Lithuania's open data portal (data.gov.lt, Dataset #1000) and adds real value to the report at zero cost.

The Saugykla API is self-described as "pre-alpha" and may be unreliable — the entire feature must soft-fail gracefully.

## How

### 1. Backend endpoint

File: `bustodnr_api/enrichment/infostatyba.py` (NEW module)

New endpoint:
```
GET /v1/enrichment/infostatyba?ntr={ntr_number}&address={address}
```

**Query logic:**
1. If NTR number is provided, query Saugykla by NTR: filter on `statinio_ntr_nr` field
2. If no NTR, query by address: filter on `adresas` field (partial match)
3. Return matching permits, sorted by date (newest first)
4. Limit to 10 results maximum

**Saugykla API call:**
```
GET https://get.data.gov.lt/datasets/gov/vtpsi/infostatyba/Statinys
  ?select(projekto_pavadinimas,statybos_rusis,statinio_pavadinimas,dokumento_tipas,dokumento_statusas,dokumento_data,statinio_ntr_nr,adresas,statinio_paskirtis)
  &{filter_condition}
  &sort(-dokumento_data)
  &limit(10)
```

Filter by NTR: `statinio_ntr_nr="{ntr_number}"`
Filter by address: `adresas.contains("{address_fragment}")`

**Note:** The exact Saugykla query syntax may need experimentation. The API uses a custom filter language documented at `atviriduomenys.readthedocs.io/api/`. If the query syntax doesn't support `contains`, fall back to fetching a broader result set and filtering in Python.

**Response shape from NTD backend:**
```json
{
  "permits": [
    {
      "project_name": "Vienbutis gyvenamasis namas",
      "construction_type": "Naujo statinio statyba",
      "building_name": "Gyvenamas namas",
      "document_type": "Statybą leidžiantis dokumentas",
      "document_status": "Galiojantis",
      "document_date": "2019-11-29",
      "ntr_number": "4400-1209-6610",
      "address": "Kaišiadorių rajono sav., Rumšiškių sen., Karčiupis, Pamiškės g. 26",
      "purpose": "Gyvenamoji (vieno buto pastatai)"
    }
  ],
  "source": "Infostatyba (IS) / data.gov.lt",
  "query_ntr": "4400-1209-6610",
  "query_address": null,
  "count": 1
}
```

**If no results or API error:** Return `{ "permits": [], "count": 0, "error": null }` — never fail the whole endpoint.

### 2. Caching

Cache results per NTR number for 24 hours (permits don't change often). Use a simple in-memory dict or the existing cache pattern from the resolver. Key: `infostatyba:{ntr_number}`.

### 3. Timeouts and soft-fail

- HTTP timeout: 8 seconds (the Saugykla API can be slow)
- On timeout or HTTP error: return empty result, log warning
- On malformed response: return empty result, log warning
- The endpoint must NEVER return a 500 — always return a valid JSON with empty permits list

### 4. Frontend component

File: `src/components/report/ConstructionPermits.tsx` (NEW)

Props: `{ permits: Permit[], loading: boolean }`

**If permits found:** Show a compact card with title "Statybos leidimai ir dokumentai (Infostatyba)" listing each permit:
- Project name / building name (bold)
- Construction type (e.g. "Naujo statinio statyba")
- Document type + status + date
- Compact rows, no excessive detail

**If no permits:** Hide the section entirely — don't show "Nerasta" (absence of permits is normal and not noteworthy).

**If still loading:** Show a subtle skeleton/shimmer in the card area (permits load async after the main report renders).

### 5. Frontend integration

In `ReportViewer.tsx`:
- After the main report renders, fire a `fetch` to `/v1/enrichment/infostatyba?ntr={ntr_number}&address={address}`
- This is an **async enrichment call** — it does NOT block the report page load
- When the response arrives, render ConstructionPermits if permits found
- Position: between the Block-1 card and the "Papildomi dokumentai" card

### 6. Mock data for dev mode

When token starts with `dev-`, skip the API call and use hardcoded mock permits:

```typescript
const MOCK_PERMITS = [
  {
    project_name: "Daugiabučio namo renovacija",
    construction_type: "Statinio kapitalinis remontas",
    building_name: "Daugiabutis gyvenamasis namas",
    document_type: "Statybą leidžiantis dokumentas",
    document_status: "Galiojantis",
    document_date: "2021-06-15",
    ntr_number: "4400-1234-5678",
    address: "Vilnius, Žirmūnų g. 12",
    purpose: "Gyvenamoji (daugiabučiai pastatai)"
  }
];
```

For `dev-land`: empty permits array (land plots rarely have construction permits in Infostatyba).

### 7. Section order in ReportViewer (updated)

1. ReportHeader
2. PropertyIdentity
3. Pastato charakteristikos (with map)
4. Energinis naudingumas
5. Block-1: Vidaus patalpų klimato komfortas
6. **Statybos leidimai (Infostatyba)** ← NEW (only if permits found)
7. Papildomi dokumentai ir šaltiniai
8. Locked blocks (2–5)
9. Citations
10. ReportFooter

## Constraints
- Backend: the Saugykla API is "pre-alpha" — expect instability, treat it as best-effort
- The enrichment call must NEVER block the main report page load
- If no permits found or API fails: hide the section entirely, no error shown
- Cache per NTR for 24h
- Do NOT expose raw Saugykla response to the frontend — transform into clean NTD response shape
- All existing backend tests must pass (478+)
- All frontend tests must pass (38)
- Both builds must succeed

## Files to touch

**Backend:**
- `bustodnr_api/enrichment/__init__.py` — NEW package
- `bustodnr_api/enrichment/infostatyba.py` — NEW: Saugykla client + endpoint
- `bustodnr_api/main.py` — register the new router
- `tests/enrichment/test_infostatyba.py` — NEW: test with mocked Saugykla response

**Frontend:**
- `src/components/report/ConstructionPermits.tsx` — NEW
- `src/components/ReportViewer.tsx` — async fetch + render ConstructionPermits
- `src/components/report/mockReportData.ts` — add mock permits for dev mode

## Run after
```bash
# Backend
cd ~/dev/bustodnr
pytest -q    # all tests pass

# Frontend
cd ~/dev/ntd
npm run build
npm test
npm run dev    # check /report/dev-existing (mock permit shown) and /report/dev-land (no permits section)
```

## Visual QA
- [ ] dev-existing shows "Statybos leidimai ir dokumentai" card with 1 mock permit
- [ ] dev-land shows no permits section (hidden, not "nerasta")
- [ ] Main report loads immediately, permit data appears async (no blocking)
- [ ] Card styling matches other report cards