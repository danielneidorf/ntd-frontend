# P7-A7: Property Location Map with Google Maps

## What
Add an interactive map to the report page showing the property's location using Google Maps (same library as Screen 1's map overlay). Satellite view at building-level zoom with an optional building contour polygon overlay from OpenStreetMap's Overpass API.

## Why / Context
The report currently has no visual representation of the property's location. A satellite map showing the actual building and its surroundings gives immediate spatial context — especially valuable for buyers who haven't visited yet. Using Google Maps matches Screen 1's implementation and the existing GCP configuration (API key already set up with IPv4+IPv6 restrictions).

The Phase 6 cost objection to Google Maps was about unpaid-flow previews. In the report, the customer has paid — the per-load cost (~$0.007 for a dynamic map) is justified by the €39 revenue.

## How

### 1. Create the map component

File: `src/components/report/PropertyMap.tsx`

Props:
```typescript
{
  lat: number;
  lng: number;
  address: string;
}
```

### 2. Google Maps implementation

Follow the same pattern as Screen 1's map overlay for loading the Google Maps JavaScript API. The map should be:

- **Map type:** `google.maps.MapTypeId.HYBRID` (satellite imagery with road/label overlay) — or `SATELLITE` if cleaner
- **Zoom:** 18 (building-level detail with clear roof shapes visible)
- **Center:** property coordinates from mock data
- **Marker:** single pin at the property location, teal color or NTD-branded
- **Size:** full card width, 280px height on desktop, 220px on mobile
- **Interactive:** user can zoom/pan, but the initial view is set and useful without interaction
- **Map controls:** minimal — zoom buttons only, no street view pegman, no fullscreen button, no map type toggle

**Google Maps load pattern:**
Check how `QuickScanFlow.tsx` loads the Google Maps script. It likely uses a dynamic script injection or a React wrapper. Reuse the exact same loading approach — don't introduce a second loading mechanism. The API key is already configured as `PUBLIC_GOOGLE_MAPS_API_KEY` or similar env var.

### 3. Building contour overlay (optional enhancement)

After the map renders, optionally fetch building footprints from OpenStreetMap's Overpass API:

```
https://overpass-api.de/api/interpreter?data=[out:json][timeout:5];
  way["building"](around:50,{lat},{lng});
  out geom;
```

If the Overpass call succeeds:
- Parse the returned building polygons
- Find the one closest to the property coordinates
- Render as a `google.maps.Polygon` with teal fill (#0D7377, opacity 0.15) and teal stroke (#0D7377, opacity 0.7, weight 2)
- Other nearby buildings: render in light grey (optional — may look cluttered on satellite)

**If Overpass fails or times out (5s):** Skip the overlay entirely. The satellite map with a pin is already valuable. No error shown.

**Note:** This overlay is a nice-to-have. If it adds complexity, ship without it — the satellite view alone is a strong visual.

### 4. Position in the report

Insert inside the **Pastato charakteristikos** card, at the top spanning full width before the field grid. The map should be the first thing visible when this card comes into view:

```
┌─ Pastato charakteristikos ─────────────────────────┐
│ ┌────────────────────────────────────────────────┐  │
│ │             [Google Maps satellite]              │  │
│ │               📍 property pin                    │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Paskirtis          Tipas                             │
│ Gyvenamoji         Daugiabutis namas                 │
│ ...                                                  │
└──────────────────────────────────────────────────────┘
```

### 5. Mock data

Verify coordinates exist in mockReportData.ts. If not, add:

```typescript
// MOCK_EXISTING — Žirmūnų g. 12, Vilnius
lat: 54.7104,
lng: 25.2865,

// MOCK_LAND_ONLY — example land plot
lat: 54.7520,
lng: 25.3380,
```

### 6. Land-only case

Show the map for land-only too — satellite view of the plot and surroundings. Skip the Overpass building contour (no building). Just the pin on satellite imagery.

### 7. Cost

| Item | Cost | Note |
|---|---|---|
| Google Maps JavaScript API (dynamic map) | $0.007/load | Charged per map initialisation |
| Overpass API | Free | No API key, public |
| At 100 reports/month | ~$0.70/month | Negligible vs €39 revenue |

## Constraints
- Use the **same Google Maps loading pattern** as Screen 1 (QuickScanFlow.tsx) — do NOT introduce a second map library
- Reuse the existing GCP API key and env var
- Overpass building contour is optional — ship without it if it adds complexity
- The map must NOT block page render — load it after the main content is visible
- Soft-fail: if Google Maps fails to load (network issue), hide the map area entirely
- All 38 tests must pass, build must succeed

## Files to touch
- `src/components/report/PropertyMap.tsx` — NEW
- `src/components/report/PropertyProfile.tsx` or `src/components/ReportViewer.tsx` — import and render the map inside Pastato charakteristikos card
- `src/components/report/mockReportData.ts` — add lat/lng if not present

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # check /report/dev-existing (satellite map of Žirmūnai) and /report/dev-land (satellite of land plot)
```

## Visual QA
- [ ] Google Maps satellite view renders inside Pastato charakteristikos card
- [ ] Correct location shown (Žirmūnų area for dev-existing)
- [ ] Pin marker visible at property coordinates
- [ ] Zoom level shows individual buildings clearly
- [ ] Map is interactive (can zoom/pan) but initial view is useful
- [ ] Minimal controls (no street view pegman, no fullscreen)
- [ ] Land-only: satellite view with pin, no building contour
- [ ] Page loads normally if Google Maps is slow
- [ ] No console errors from Google Maps API