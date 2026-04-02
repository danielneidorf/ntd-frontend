# P7-A9.1: Visual Fallback Chain — Vilnius Aerial + Street View Repositioning

## What
Implement the visual fallback chain: for Vilnius properties, show a 2024 high-resolution aerial photo (from gis.vplanas.lt) as the hero image at the top of the report. Move the Google Street View photo to sit next to the Google Map inside the Pastato charakteristikos card (two-column: map left, Street View right). For non-Vilnius properties, keep Street View as the hero image.

## Why / Context
The agreed fallback chain was: Vilnius aerial → project-hints image → Street View → satellite → map pin. The current implementation only has Street View at the top. This change implements the Vilnius-specific tier and repositions Street View to complement the satellite map inside the property card.

The Vilnius 2024 orthophoto is **free, public, and extremely high resolution** — served by Vilniaus planas (gis.vplanas.lt) via ArcGIS MapServer export. It shows the building from above with enough detail to see individual cars and trees. Google Street View (from ground level) provides a complementary facade view alongside the satellite map.

## How

### 1. Vilnius aerial photo — backend endpoint

File: add to `bustodnr_api/enrichment/streetview.py` (or new `aerial.py`)

New endpoint:
```
GET /v1/enrichment/vilnius-aerial?lat={lat}&lng={lng}
```

**Logic:**
1. Check if coordinates fall within Vilnius municipality bounds (approximate bbox: lat 54.55–54.83, lng 25.01–25.48)
2. If yes, construct the vplanas export URL:
```
https://gis.vplanas.lt/arcgis/rest/services/Baziniai_zemelapiai/ORTO_2024_WGS/MapServer/export
  ?bbox={lng-0.001},{lat-0.001},{lng+0.001},{lat+0.001}
  &bboxSR=4326
  &imageSR=3857
  &size=800,400
  &format=jpg
  &f=image
```
3. The bbox creates a ~200m×200m crop centered on the property — enough to show the building and immediate surroundings
4. Return the image URL directly (don't proxy — let the browser load from vplanas.lt)

**Response:**
```json
{
  "available": true,
  "is_vilnius": true,
  "image_url": "https://gis.vplanas.lt/arcgis/rest/services/...",
  "source": "Vilniaus miesto 2024 m. ortofoto",
  "attribution": "© Vilniaus planas"
}
```

If not Vilnius: `{ "available": false, "is_vilnius": false }`

**No cache needed** — the URL is deterministic (same coordinates = same URL). The browser and vplanas CDN handle caching.

**Timeout:** 5 seconds. On failure, return `available: false`.

### 2. Frontend — PropertyPhoto repositioning

**Current layout:**
```
PropertyPhoto (Street View)     ← hero position, full width
PropertyIdentity
Pastato charakteristikos
  └─ Google Map (satellite)     ← inside card, full width
```

**New layout for Vilnius:**
```
PropertyPhoto (Vilnius aerial)  ← hero position, full width
PropertyIdentity
Pastato charakteristikos
  ├─ Google Map (satellite)     ← left column
  └─ Street View photo          ← right column (NEW position)
```

**New layout for non-Vilnius:**
```
PropertyPhoto (Street View)     ← hero position (unchanged)
PropertyIdentity
Pastato charakteristikos
  └─ Google Map (satellite)     ← full width (no Street View alongside)
```

### 3. Detection logic in PropertyPhoto.tsx

```typescript
// Determine which photo to show in hero position
const isVilnius = municipality?.includes('Vilnius') || 
  (lat >= 54.55 && lat <= 54.83 && lng >= 25.01 && lng <= 25.48);

if (isVilnius) {
  // Fetch Vilnius aerial for hero position
  // Street View moves to Pastato card (handled by ReportViewer)
} else {
  // Use Street View for hero position (current behavior)
}
```

### 4. Two-column map + Street View in Pastato card

When the property is in Vilnius, the Pastato charakteristikos card header changes from a single full-width map to a two-column layout:

```
┌─ Pastato charakteristikos ─────────────────────────────────┐
│ ┌──────────────────────┐  ┌──────────────────────┐         │
│ │  Google Maps          │  │  Street View          │        │
│ │  (satellite, zoom 18) │  │  (ground-level photo) │        │
│ │  + Padidinti button   │  │  + Apžiūrėti ↗ link  │        │
│ └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│ Paskirtis: Gyvenamoji    Tipas: Daugiabutis namas           │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

- Both at equal height (~250px, reduced from current 400px to fit side-by-side)
- Map keeps the "Padidinti" fullscreen button
- Street View photo gets "Apžiūrėti Google Street View aplinkoje ↗" link below (already fixed to use `map_action=pano` URL)
- On mobile: stack vertically (map on top, Street View below)

### 5. Hero image attribution

**Vilnius aerial hero:**
- Attribution line: "Vilniaus miesto 2024 m. ortofoto · © Vilniaus planas" in `text-xs text-slate-400`

**Street View hero (non-Vilnius):**
- Attribution line: "Gatvės vaizdas · Google Street View" (current behavior)

### 6. Mock data for dev mode

- `dev-existing` (Vilnius): `is_vilnius = true` → show aerial hero + Street View in Pastato card
- `dev-land` (could be anywhere): `is_vilnius = false` → no photo hero, map only in Pastato card

For the Vilnius aerial mock: construct the real vplanas URL with mock coordinates (it's a public service, will return a real image even in dev mode).

### 7. Fallback chain summary

| Priority | Source | Position | Vilnius | Non-Vilnius |
|---|---|---|---|---|
| 1 | Vilnius 2024 aerial | Hero (top) | ✅ | — |
| 2 | Google Street View | Pastato card (right of map) | ✅ | Hero (top) |
| 3 | Google Maps satellite | Pastato card (left or full) | ✅ | ✅ |
| 4 | Map pin only | Pastato card fallback | ✅ | ✅ |

## Constraints
- The vplanas orthophoto export is public and free — no API key, no authentication
- Do NOT proxy images through NTD backend — return URLs, let browser fetch directly
- The aerial photo is top-down (not oblique) — this is the best available programmatic source
- Vilnius detection: use municipality name from mock data (preferred) or coordinate bounding box (fallback)
- Both hero image and Pastato card visuals load async — never block the report
- All existing tests must pass
- Responsive: two-column map+Street View on desktop, stacked on mobile

## Files to touch

**Backend:**
- `bustodnr_api/enrichment/streetview.py` (or `aerial.py`) — add Vilnius aerial endpoint
- `tests/enrichment/test_aerial.py` — NEW: tests for Vilnius detection + URL construction

**Frontend:**
- `src/components/report/PropertyPhoto.tsx` — add Vilnius aerial detection + fallback logic
- `src/components/report/PropertyProfile.tsx` — accept Street View photo as prop, render in two-column layout alongside map
- `src/components/ReportViewer.tsx` — pass isVilnius flag + Street View data to PropertyProfile

## Run after
```bash
cd ~/dev/bustodnr && pytest -q
cd ~/dev/ntd && npm run build && npm test && npm run dev
```

## Visual QA
- [ ] dev-existing (Vilnius): aerial hero photo at top showing Žirmūnai from above
- [ ] dev-existing: Pastato card has two columns — map left, Street View right
- [ ] dev-existing: Street View "Apžiūrėti" link opens interactive panorama (not 3D Earth)
- [ ] dev-existing: Aerial attribution "© Vilniaus planas"
- [ ] dev-land: no hero photo, map in Pastato card only
- [ ] Mobile: map and Street View stack vertically
- [ ] Both images load async, no blocking