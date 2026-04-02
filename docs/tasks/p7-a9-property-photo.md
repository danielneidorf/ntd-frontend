# P7-A9: Property Visual — Google Street View with Fallback Chain

## What
Add a property photo to the report header using Google Street View Static API, with a graceful fallback to the satellite map view already rendered by P7-A7. The photo shows the actual building as seen from the street — the most intuitive "is this the right place?" visual for a property buyer.

## Why / Context
The report currently has a satellite map (P7-A7) but no street-level photo. A buyer looking at a report about Žirmūnų g. 12 wants to **see** the building — not just a satellite dot. Google Street View coverage is excellent in Lithuanian urban areas. The metadata endpoint is free and lets us check availability before making the paid image request ($0.007/call).

The full fallback chain from the Source Review Report is:
1. ~~Vilnius 3D oblique aerial~~ (deferred — needs 3d.vilnius.lt ArcGIS research)
2. ~~Project-hints agent image~~ (deferred — needs og:image scraping pipeline)
3. **Google Street View** ← THIS BRIEF
4. Satellite map (already built in P7-A7) ← FALLBACK
5. Map pin only (P7-A7 already handles this)

Items 1 and 2 are deferred to post-launch enrichment. This brief delivers item 3 with item 4 as automatic fallback.

## How

### 1. Backend endpoint

File: `bustodnr_api/enrichment/streetview.py` (NEW)

New endpoint:
```
GET /v1/enrichment/streetview?lat={lat}&lng={lng}
```

**Step 1 — Metadata check (free):**
```
GET https://maps.googleapis.com/maps/api/streetview/metadata
  ?location={lat},{lng}
  &key={GOOGLE_PLACES_API_KEY}
```

Response: `{ "status": "OK" }` means Street View imagery exists at this location. `"ZERO_RESULTS"` means no coverage.

**Step 2 — If metadata OK, return the image URL (not the image itself):**

Construct the Street View Static API URL:
```
https://maps.googleapis.com/maps/api/streetview
  ?size=800x400
  &location={lat},{lng}
  &pitch=10
  &fov=90
  &key={GOOGLE_PLACES_API_KEY}
```

**Do NOT proxy the image through our backend** — return the URL and let the frontend render it directly as an `<img>` tag. Google's CDN serves the image; we avoid bandwidth costs and caching complexity.

**Response shape:**
```json
{
  "available": true,
  "image_url": "https://maps.googleapis.com/maps/api/streetview?size=800x400&location=54.7104,25.2865&pitch=10&fov=90&key=...",
  "lat": 54.7104,
  "lng": 25.2865
}
```

Or if no coverage:
```json
{
  "available": false,
  "image_url": null,
  "lat": 54.7104,
  "lng": 25.2865
}
```

**API key:** Reuse the existing `GOOGLE_PLACES_API_KEY` env var — just enable the "Street View Static API" on the same GCP project. No new key needed.

**Timeout:** 5 seconds for the metadata check. On timeout or error, return `{ "available": false }`.

**Cache:** Cache metadata results per lat/lng (rounded to 4 decimal places) for 7 days. Street View coverage doesn't change often.

### 2. Frontend component

File: `src/components/report/PropertyPhoto.tsx` (NEW)

Props:
```typescript
{
  lat: number;
  lng: number;
  address: string;
}
```

**Behavior:**
1. On mount, fetch `GET /v1/enrichment/streetview?lat={lat}&lng={lng}`
2. If `available === true`: render `<img>` with the returned `image_url`
3. If `available === false` or fetch fails: render nothing (the satellite map from P7-A7 is already showing below — that's the fallback)
4. While loading: show a subtle skeleton placeholder (same height as the image would be)

**Image styling:**
- Full width of the report content area
- Height: `h-[300px]` with `object-cover` to crop nicely
- Rounded top corners if placed at the top of a card: `rounded-t-xl`
- A small attribution line below: "Gatvės vaizdas: Google Street View" in `text-xs text-slate-400`

### 3. Position in the report

Insert the Street View photo **above** the PropertyIdentity section — it becomes the very first visual the customer sees after the header:

```
1. ReportHeader (NTD logo bar + PDF button)
2. **PropertyPhoto** ← NEW (Street View image, or nothing if unavailable)
3. PropertyIdentity (address, NTR, date, bundle)
4. Pastato charakteristikos (with satellite map inside)
5. Energinis naudingumas
6. Block-1: Vidaus patalpų klimato komfortas
7. ... rest of report
```

The Street View photo is the hero image. The satellite map inside the Pastato card provides spatial context. They serve different purposes — the photo shows "what does it look like from the street" while the map shows "where is it on the map."

### 4. Dev mock mode

When token starts with `dev-`, skip the API call:
- `dev-existing` (Žirmūnų g. 12, Vilnius): construct the Street View URL directly with the mock coordinates — Street View coverage exists there, so the image will actually render (unlike the Maps tiles which are blocked by referrer restrictions)
- `dev-land`: set `available: false` (land plots rarely have Street View of the specific plot)

**Important:** The Street View Static API image URL does NOT have referrer restrictions the same way the Maps JavaScript API does — the `<img>` tag loads directly from Google's CDN. So the Street View photo **should render on localhost** even though the Maps tiles don't. Test this.

### 5. Cost

| Item | Cost | Note |
|---|---|---|
| Street View Metadata | Free | No charge for metadata checks |
| Street View Static image | $0.007/load | Only charged when image renders in browser |
| At 100 reports/month | ~$0.70/month | Same as the Maps tile cost |

### 6. Tests

**Backend:**
- Test: metadata returns OK → endpoint returns available=true with image URL
- Test: metadata returns ZERO_RESULTS → endpoint returns available=false
- Test: metadata timeout → endpoint returns available=false
- Test: cache hit returns cached result

**Frontend:**
- Existing 38 tests should still pass (PropertyPhoto is additive)

## Constraints
- Reuse existing GCP API key — just enable Street View Static API on the project
- Do NOT proxy images through the backend — return the URL, let browser fetch directly
- Do NOT block report page load — the photo loads async
- If Street View is unavailable: show nothing (satellite map is already there as fallback)
- The metadata check must be free (it is — Google doesn't charge for metadata)
- All backend tests must pass (483+), all frontend tests must pass (38)

## Files to touch

**Backend:**
- `bustodnr_api/enrichment/streetview.py` — NEW: metadata check + URL construction
- `bustodnr_api/app.py` — register streetview router (or add to existing enrichment router)
- `tests/enrichment/test_streetview.py` — NEW: 4 tests

**Frontend:**
- `src/components/report/PropertyPhoto.tsx` — NEW
- `src/components/ReportViewer.tsx` — async fetch + render PropertyPhoto above identity

## Run after
```bash
# Backend
cd ~/dev/bustodnr
pytest -q

# Frontend
cd ~/dev/ntd
npm run build
npm test
npm run dev    # check /report/dev-existing — Street View photo should render!
```

## Visual QA
- [ ] dev-existing: Street View photo of Žirmūnų area visible at top of report
- [ ] Photo is full-width, ~300px height, nicely cropped
- [ ] "Gatvės vaizdas: Google Street View" attribution below photo
- [ ] dev-land: no photo shown (satellite map in Pastato card is the only visual)
- [ ] Report loads immediately; photo appears async (no blocking)
- [ ] If Street View API is down: no photo, no error, satellite map still works